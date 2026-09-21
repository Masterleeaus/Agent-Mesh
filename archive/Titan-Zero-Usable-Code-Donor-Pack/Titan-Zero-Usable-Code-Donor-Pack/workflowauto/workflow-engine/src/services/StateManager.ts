/**
 * State Management System for Workflow Engine
 * Handles workflow execution state, inter-node data passing, and persistence
 */

import { WorkflowInstance, CredentialManager } from '../types/workflow';
import { Logger } from './Logger';
import { createClient, RedisClientType } from 'redis';
import { Pool } from 'pg';

export interface StateManager {
  saveInstance(instance: WorkflowInstance): Promise<void>;
  getInstance(executionId: string): Promise<WorkflowInstance | null>;
  updateInstanceStatus(executionId: string, status: string, data?: any): Promise<void>;
  getCredentialManager(): CredentialManager;
  cleanup(maxAge: number): Promise<void>;
}

export class DefaultStateManager implements StateManager {
  private redis: RedisClientType;
  private postgres: Pool;
  private logger: Logger;
  private credentialManager: CredentialManager;

  constructor(
    redisUrl: string,
    postgresUrl: string,
    logger: Logger,
    credentialManager: CredentialManager
  ) {
    this.redis = createClient({ url: redisUrl });
    this.postgres = new Pool({ connectionString: postgresUrl });
    this.logger = logger;
    this.credentialManager = credentialManager;
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.info('Connected to Redis for state management');

      // Initialize PostgreSQL tables
      await this.initializeTables();
      this.logger.info('Initialized PostgreSQL tables for workflow storage');
    } catch (error) {
      this.logger.error('Failed to initialize state manager', { error });
      throw error;
    }
  }

  async saveInstance(instance: WorkflowInstance): Promise<void> {
    try {
      // Save to Redis for fast access during execution
      const key = `workflow:instance:${instance.id}`;
      await this.redis.setEx(
        key,
        3600, // 1 hour TTL
        JSON.stringify(instance)
      );

      // Save to PostgreSQL for persistence
      const query = `
        INSERT INTO workflow_instances (
          id, workflow_id, status, created_at, started_at, completed_at,
          trigger_data, current_node, execution_context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          started_at = EXCLUDED.started_at,
          completed_at = EXCLUDED.completed_at,
          current_node = EXCLUDED.current_node,
          execution_context = EXCLUDED.execution_context,
          updated_at = NOW()
      `;

      await this.postgres.query(query, [
        instance.id,
        instance.workflowId,
        instance.status,
        instance.createdAt,
        instance.startedAt,
        instance.completedAt,
        JSON.stringify(instance.triggerData),
        instance.currentNode,
        JSON.stringify(instance.executionContext)
      ]);

      this.logger.debug('Saved workflow instance', { 
        instanceId: instance.id, 
        status: instance.status 
      });
    } catch (error) {
      this.logger.error('Failed to save workflow instance', {
        instanceId: instance.id,
        error
      });
      throw error;
    }
  }

  async getInstance(executionId: string): Promise<WorkflowInstance | null> {
    try {
      // Try Redis first
      const redisKey = `workflow:instance:${executionId}`;
      const cached = await this.redis.get(redisKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to PostgreSQL
      const query = `
        SELECT * FROM workflow_instances 
        WHERE id = $1
      `;
      
      const result = await this.postgres.query(query, [executionId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const instance: WorkflowInstance = {
        id: row.id,
        workflowId: row.workflow_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        triggerData: row.trigger_data ? JSON.parse(row.trigger_data) : undefined,
        currentNode: row.current_node,
        executionContext: row.execution_context ? JSON.parse(row.execution_context) : {}
      };

      // Cache in Redis for future access
      await this.redis.setEx(redisKey, 3600, JSON.stringify(instance));

      return instance;
    } catch (error) {
      this.logger.error('Failed to get workflow instance', {
        executionId,
        error
      });
      return null;
    }
  }

  async updateInstanceStatus(
    executionId: string, 
    status: string, 
    data?: any
  ): Promise<void> {
    try {
      const instance = await this.getInstance(executionId);
      if (!instance) {
        throw new Error(`Instance not found: ${executionId}`);
      }

      instance.status = status as any;
      if (data) {
        instance.executionContext = { ...instance.executionContext, ...data };
      }

      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        instance.completedAt = new Date();
      }

      await this.saveInstance(instance);
    } catch (error) {
      this.logger.error('Failed to update instance status', {
        executionId,
        status,
        error
      });
      throw error;
    }
  }

  getCredentialManager(): CredentialManager {
    return this.credentialManager;
  }

  async cleanup(maxAge: number): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      
      // Clean up old instances from PostgreSQL
      const query = `
        DELETE FROM workflow_instances 
        WHERE created_at < $1 AND status IN ('completed', 'failed', 'cancelled')
      `;
      
      const result = await this.postgres.query(query, [cutoffDate]);
      
      this.logger.info('Cleaned up old workflow instances', {
        deletedCount: result.rowCount,
        cutoffDate
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old instances', { error });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      await this.postgres.end();
      this.logger.info('Disconnected from state storage');
    } catch (error) {
      this.logger.error('Error disconnecting from state storage', { error });
    }
  }

  private async initializeTables(): Promise<void> {
    const createInstancesTable = `
      CREATE TABLE IF NOT EXISTS workflow_instances (
        id VARCHAR(255) PRIMARY KEY,
        workflow_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW(),
        trigger_data JSONB,
        current_node VARCHAR(255),
        execution_context JSONB DEFAULT '{}'::jsonb
      )
    `;

    const createWorkflowsTable = `
      CREATE TABLE IF NOT EXISTS workflows (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL,
        definition JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `;

    // Create tables
    await this.postgres.query(createInstancesTable);
    await this.postgres.query(createWorkflowsTable);

    // Create indexes separately
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_id)',
      'CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status)',
      'CREATE INDEX IF NOT EXISTS idx_workflow_instances_created_at ON workflow_instances(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name)',
      'CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at)'
    ];

    for (const indexQuery of createIndexes) {
      try {
        await this.postgres.query(indexQuery);
      } catch (error) {
        // Index creation errors are non-fatal
        this.logger.warn('Failed to create index', { query: indexQuery, error });
      }
    }
  }
}

export class MockCredentialManager implements CredentialManager {
  private authServiceUrl: string;
  private internalApiKey: string;
  private logger: Logger;

  constructor(authServiceUrl: string, internalApiKey: string, logger: Logger) {
    this.authServiceUrl = authServiceUrl;
    this.internalApiKey = internalApiKey;
    this.logger = logger;
  }

  async getCredentials(workspace: string, connector: string): Promise<any> {
    try {
      // This will integrate with the Platform Auth Service we built
      const response = await fetch(
        `${this.authServiceUrl}/credentials/${workspace}`, 
        {
          headers: {
            'Authorization': `Bearer ${this.internalApiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get credentials: ${response.status}`);
      }

      const data = await response.json() as any;
      const credential = data.credentials?.find(
        (cred: any) => cred.connector_id === connector
      );

      if (!credential) {
        throw new Error(`No credentials found for ${workspace}:${connector}`);
      }

      return credential;
    } catch (error) {
      this.logger.error('Failed to get credentials', {
        workspace,
        connector,
        error
      });
      throw error;
    }
  }

  async setCredentials(
    workspace: string, 
    connector: string, 
    credentials: any
  ): Promise<void> {
    try {
      const response = await fetch(`${this.authServiceUrl}/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.internalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: workspace,
          connector_id: connector,
          auth_type: 'oauth2_client_credentials',
          credential_data: credentials
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set credentials: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to set credentials', {
        workspace,
        connector,
        error
      });
      throw error;
    }
  }
}