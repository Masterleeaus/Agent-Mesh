/**
 * Workflow Engine Application Entry Point
 * Following POC roadmap Milestone 1.1-1.3 specifications
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { DefaultWorkflowEngine } from './engine/WorkflowEngine';
import { DefaultNodeRegistry } from './services/NodeRegistry';
import { DefaultStateManager, MockCredentialManager } from './services/StateManager';
import { WorkflowLogger } from './services/Logger';

// Import node implementations
import { AspireFetchOpportunityNode } from './nodes/aspire/AspireFetchOpportunityNode';
import { AspireCreateProposalNode } from './nodes/aspire/AspireCreateProposalNode';
import { AITextGenerationNode } from './nodes/ai/AITextGenerationNode';
import { ConditionalNode } from './nodes/logic/ConditionalNode';
import { TransformNode } from './nodes/logic/TransformNode';

// Load environment variables
dotenv.config();

class WorkflowEngineApp {
  private app: express.Application;
  private workflowEngine!: DefaultWorkflowEngine;
  private logger: WorkflowLogger;
  private stateManager!: DefaultStateManager;
  private nodeRegistry!: DefaultNodeRegistry;

  constructor() {
    this.app = express();
    this.logger = new WorkflowLogger(process.env.LOG_LEVEL || 'info');
    this.setupExpress();
  }

  private setupExpress(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => this.logger.info(message.trim())
      }
    }));
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Workflow Engine...');

    try {
      // Initialize services
      await this.initializeServices();
      
      // Register node types
      this.registerNodes();
      
      // Setup routes
      this.setupRoutes();
      
      this.logger.info('Workflow Engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Workflow Engine', { error });
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    // Initialize state manager
    const redisUrl = process.env.WORKFLOW_REDIS_URL || 'redis://localhost:6379';
    const postgresUrl = process.env.WORKFLOW_DB_URL || 'postgresql://postgres:password@localhost:5432/workflow_platform';
    
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
    const authServiceKey = process.env.AUTH_SERVICE_INTERNAL_KEY || 'workflow-engine-key';
    
    const credentialManager = new MockCredentialManager(
      authServiceUrl,
      authServiceKey,
      this.logger
    );

    this.stateManager = new DefaultStateManager(
      redisUrl,
      postgresUrl,
      this.logger,
      credentialManager
    );

    await this.stateManager.initialize();

    // Initialize node registry
    this.nodeRegistry = new DefaultNodeRegistry(this.logger);

    // Initialize workflow engine
    this.workflowEngine = new DefaultWorkflowEngine(
      this.nodeRegistry,
      this.stateManager,
      this.logger
    );
  }

  private registerNodes(): void {
    // Register Aspire nodes
    this.nodeRegistry.register('aspire_fetch_opportunity', AspireFetchOpportunityNode);
    this.nodeRegistry.register('aspire_create_proposal', AspireCreateProposalNode);

    // Register AI nodes
    this.nodeRegistry.register('ai_text_generation', AITextGenerationNode);

    // Register logic nodes
    this.nodeRegistry.register('conditional', ConditionalNode);
    this.nodeRegistry.register('transform', TransformNode);

    this.logger.info(`Registered ${this.nodeRegistry.list().length} node types`, {
      nodeTypes: this.nodeRegistry.list()
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'workflow-engine',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        nodeTypes: this.nodeRegistry.list().length
      });
    });

    // Execute workflow
    this.app.post('/workflows/execute', async (req, res) => {
      try {
        const { workflow, triggerData } = req.body;
        
        if (!workflow) {
          return res.status(400).json({
            error: 'Missing required field: workflow'
          });
        }

        this.logger.info('Executing workflow via API', {
          workflowId: workflow.id,
          workflowName: workflow.name
        });

        const result = await this.workflowEngine.executeWorkflow(workflow, triggerData);
        
        res.json({
          success: true,
          result
        });

      } catch (error) {
        this.logger.error('Failed to execute workflow', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Get execution status
    this.app.get('/executions/:executionId', async (req, res) => {
      try {
        const { executionId } = req.params;
        const instance = await this.workflowEngine.getExecutionStatus(executionId);
        
        res.json({
          success: true,
          instance
        });

      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: 'Execution not found'
          });
        }

        this.logger.error('Failed to get execution status', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // List available node types
    this.app.get('/nodes', (req, res) => {
      const nodeTypes = this.nodeRegistry.list().map(type => ({
        type,
        schema: this.nodeRegistry.getSchema(type)
      }));

      res.json({
        success: true,
        nodeTypes
      });
    });

    // Pause execution
    this.app.post('/executions/:executionId/pause', async (req, res) => {
      try {
        const { executionId } = req.params;
        await this.workflowEngine.pauseExecution(executionId);
        
        res.json({
          success: true,
          message: 'Execution paused'
        });

      } catch (error) {
        this.logger.error('Failed to pause execution', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Cancel execution
    this.app.post('/executions/:executionId/cancel', async (req, res) => {
      try {
        const { executionId } = req.params;
        await this.workflowEngine.cancelExecution(executionId);
        
        res.json({
          success: true,
          message: 'Execution cancelled'
        });

      } catch (error) {
        this.logger.error('Failed to cancel execution', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', { error: error.message, stack: error.stack });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });

    // 404 handler
    this.app.use((req: express.Request, res: express.Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  async start(): Promise<void> {
    const port = process.env.WORKFLOW_ENGINE_PORT || 8004;
    
    this.app.listen(port, () => {
      this.logger.info(`Workflow Engine listening on port ${port}`, {
        port,
        nodeTypes: this.nodeRegistry.list()
      });
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Workflow Engine...');
    
    try {
      await this.stateManager.disconnect();
      this.logger.info('Workflow Engine shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }
}

// Application startup
async function main(): Promise<void> {
  const app = new WorkflowEngineApp();
  
  try {
    await app.initialize();
    await app.start();

    // Graceful shutdown handling
    process.on('SIGTERM', () => app.shutdown());
    process.on('SIGINT', () => app.shutdown());
    
  } catch (error) {
    console.error('Failed to start Workflow Engine:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

export default WorkflowEngineApp;