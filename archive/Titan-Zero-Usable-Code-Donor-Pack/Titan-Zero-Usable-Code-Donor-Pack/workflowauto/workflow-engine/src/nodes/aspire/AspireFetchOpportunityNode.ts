/**
 * Aspire Fetch Opportunity Node
 * Integrates with Aspire MCP server to fetch opportunity data
 * Following POC roadmap Milestone 1.2 specifications
 */

import { ExecutionContext, NodeResult, NodeConfiguration } from '../../types/workflow';
import { BaseNode } from '../BaseNode';
import axios from 'axios';

export class AspireFetchOpportunityNode extends BaseNode {
  getConfiguration(): NodeConfiguration {
    return {
      name: 'Fetch Aspire Opportunity',
      description: 'Fetches opportunity details from Aspire Field Management system',
      category: 'saas',
      inputs: {
        workspace_id: {
          type: 'string',
          required: true,
          description: 'Aspire workspace identifier'
        },
        opportunity_id: {
          type: 'string',
          required: true,
          description: 'Opportunity ID to fetch'
        }
      },
      outputs: {
        opportunity: {
          type: 'object',
          description: 'Complete opportunity data from Aspire'
        }
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    try {
      this.validateInputs(context);

      const { workspace_id, opportunity_id } = context.inputs;

      context.logger.info(`Fetching Aspire opportunity`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        workspaceId: workspace_id,
        opportunityId: opportunity_id
      });

      // Get credentials for Aspire API
      const credentials = await context.credentials.getCredentials(
        workspace_id,
        'aspire'
      );

      if (!credentials) {
        return this.createErrorResult(
          'CREDENTIALS_NOT_FOUND',
          `No Aspire credentials found for workspace: ${workspace_id}`
        );
      }

      // Call Aspire MCP server (we'll use existing MCP server)
      const mcpServerUrl = process.env.ASPIRE_MCP_URL || 'http://aspire-mcp-server:8002';
      const response = await axios.post(`${mcpServerUrl}/tools/call`, {
        name: 'aspire_fetch_opportunity',
        arguments: {
          workspace_id,
          opportunity_id,
          credentials: credentials.credential_data
        }
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        return this.createErrorResult(
          'ASPIRE_API_ERROR',
          `Failed to fetch opportunity: ${response.data.error}`,
          response.data
        );
      }

      const opportunity = response.data.result;

      context.logger.info(`Successfully fetched Aspire opportunity`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        opportunityId: opportunity.id,
        customerName: opportunity.customer?.name
      });

      return this.createSuccessResult({
        opportunity
      });

    } catch (error) {
      context.logger.error(`Failed to fetch Aspire opportunity`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        error: error instanceof Error ? error.message : String(error)
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return this.createErrorResult(
            'TIMEOUT_ERROR',
            'Request to Aspire MCP server timed out'
          );
        }
        
        if (error.response?.status === 404) {
          return this.createErrorResult(
            'OPPORTUNITY_NOT_FOUND',
            `Opportunity not found: ${context.inputs.opportunity_id}`
          );
        }

        return this.createErrorResult(
          'NETWORK_ERROR',
          `Network error calling Aspire API: ${error.message}`,
          error.response?.data
        );
      }

      return this.createErrorResult(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : String(error),
        error
      );
    }
  }
}