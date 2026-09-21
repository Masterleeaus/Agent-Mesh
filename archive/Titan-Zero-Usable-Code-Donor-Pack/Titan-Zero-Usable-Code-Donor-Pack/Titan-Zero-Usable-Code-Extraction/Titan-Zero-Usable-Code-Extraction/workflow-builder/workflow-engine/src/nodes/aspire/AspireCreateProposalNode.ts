/**
 * Aspire Create Proposal Node
 * Creates a new proposal in Aspire Field Management system
 * Following POC roadmap Milestone 1.2 specifications
 */

import { ExecutionContext, NodeResult, NodeConfiguration } from '../../types/workflow';
import { BaseNode } from '../BaseNode';
import axios from 'axios';

export class AspireCreateProposalNode extends BaseNode {
  getConfiguration(): NodeConfiguration {
    return {
      name: 'Create Aspire Proposal',
      description: 'Creates a new proposal in Aspire Field Management system',
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
          description: 'Opportunity ID to create proposal for'
        },
        proposal_text: {
          type: 'string',
          required: true,
          description: 'Generated proposal content'
        },
        proposal_title: {
          type: 'string',
          required: false,
          description: 'Proposal title (optional)',
          default: 'AI-Generated Proposal'
        }
      },
      outputs: {
        proposal: {
          type: 'object',
          description: 'Created proposal data from Aspire'
        },
        proposal_id: {
          type: 'string',
          description: 'ID of the created proposal'
        }
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    try {
      this.validateInputs(context);

      const { 
        workspace_id, 
        opportunity_id, 
        proposal_text, 
        proposal_title 
      } = context.inputs;

      context.logger.info(`Creating Aspire proposal`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        workspaceId: workspace_id,
        opportunityId: opportunity_id,
        proposalLength: proposal_text.length
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

      // Call Aspire MCP server to create proposal
      const mcpServerUrl = process.env.ASPIRE_MCP_URL || 'http://aspire-mcp-server:8002';
      const response = await axios.post(`${mcpServerUrl}/tools/call`, {
        name: 'aspire_create_proposal',
        arguments: {
          workspace_id,
          opportunity_id,
          proposal_data: {
            title: proposal_title || 'AI-Generated Proposal',
            content: proposal_text,
            status: 'draft',
            generated_by: 'workflow-ai',
            created_at: new Date().toISOString()
          },
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
          `Failed to create proposal: ${response.data.error}`,
          response.data
        );
      }

      const proposal = response.data.result;

      context.logger.info(`Successfully created Aspire proposal`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        proposalId: proposal.id,
        opportunityId: opportunity_id
      });

      return this.createSuccessResult({
        proposal,
        proposal_id: proposal.id
      });

    } catch (error) {
      context.logger.error(`Failed to create Aspire proposal`, {
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
        
        if (error.response?.status === 400) {
          return this.createErrorResult(
            'INVALID_PROPOSAL_DATA',
            `Invalid proposal data: ${error.response.data?.error || 'Bad request'}`
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