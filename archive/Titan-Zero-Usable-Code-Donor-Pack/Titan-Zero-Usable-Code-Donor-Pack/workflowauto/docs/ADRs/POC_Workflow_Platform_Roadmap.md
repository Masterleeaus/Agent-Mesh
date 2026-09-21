# SaaS Interaction + AI Workflow Platform POC Roadmap

## Executive Summary

This document outlines the POC roadmap for **Option 1: SaaS Interaction Platform with AI-based Enrichment** - a visual workflow builder that connects to SaaS platforms (starting with Aspire) and enriches data flows with AI capabilities. This is similar to tools like n8n but specifically designed for field service business automation with AI enhancement.

## POC Scope & Objectives

### **Primary Goal**
Build a visual workflow platform that demonstrates:
- Real-time interaction with SaaS platforms (Aspire Field Management)
- AI-powered data enrichment and decision-making
- Visual workflow design and execution
- Template-based workflow library

### **Success Criteria**
- [ ] Visual drag-drop workflow designer functional
- [ ] Aspire integration working (fetch opportunities, create proposals)
- [ ] AI enrichment nodes operational (Claude for text generation)
- [ ] End-to-end proposal workflow executable
- [ ] Template library with 3+ pre-built workflows

### **Out of Scope for POC**
- Ontology-driven app generation
- Multi-modal data processing
- Complex entity modeling
- Marketplace platform features
- Multi-tenant architecture

---

## POC Architecture

### **High-Level Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                 Workflow Designer UI                        │
│           React-based drag-drop interface                   │
├─────────────────────────────────────────────────────────────┤
│                 Workflow Engine                             │
│    Node execution • Flow control • State management         │
├─────────────────────────────────────────────────────────────┤
│                   Node Library                             │
│ [Aspire Nodes] [AI Nodes] [Logic Nodes] [Utility Nodes]    │
├─────────────────────────────────────────────────────────────┤
│               Connector Framework                           │
│        MCP-based connectors for external systems           │
├─────────────────────────────────────────────────────────────┤
│                 Auth & Security                            │
│      Credential management • Token handling • RBAC         │
└─────────────────────────────────────────────────────────────┘
```

### **Core Components**

#### **1. Visual Workflow Designer**
- React-based UI with drag-drop functionality
- Node library panel
- Canvas for workflow design
- Property panels for node configuration
- Real-time validation and testing

#### **2. Workflow Engine**
- Node.js runtime for workflow execution
- State management between nodes
- Error handling and retry mechanisms
- Real-time execution monitoring
- Webhook triggers and scheduling

#### **3. Node Library**
```typescript
interface NodeTypes {
  // SaaS Integration Nodes
  aspire_fetch_opportunity: AspireNode;
  aspire_create_proposal: AspireNode;
  aspire_upload_attachment: AspireNode;
  
  // AI Enhancement Nodes
  ai_text_generation: AINode;
  ai_data_analysis: AINode;
  ai_decision_making: AINode;
  
  // Logic Nodes
  conditional: LogicNode;
  loop: LogicNode;
  transform: LogicNode;
  
  // Utility Nodes
  webhook: TriggerNode;
  timer: TriggerNode;
  email: ActionNode;
}
```

#### **4. MCP Connector Framework**
- Reuse existing Aspire MCP server architecture
- Extensible for future SaaS platforms
- Standardized connector interface
- Built-in auth handling

---

## Implementation Phases

## Phase 1: Foundation Infrastructure (2 weeks)

### **Milestone 1.1: Workflow Engine Core**
**Priority**: Critical - Core execution engine

#### Deliverables:
- [ ] **Node.js Workflow Runtime**:
  ```typescript
  interface WorkflowEngine {
    executeWorkflow(workflow: WorkflowDefinition): Promise<ExecutionResult>;
    executeNode(node: NodeDefinition, context: ExecutionContext): Promise<NodeResult>;
    handleNodeError(error: NodeError, retryPolicy: RetryPolicy): Promise<void>;
  }
  ```
- [ ] **Node Interface Specification**:
  ```typescript
  interface WorkflowNode {
    id: string;
    type: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    config: NodeConfiguration;
    execute(context: ExecutionContext): Promise<NodeResult>;
  }
  ```
- [ ] **State Management System**:
  - Workflow execution state
  - Inter-node data passing
  - Error state handling
  - Execution history tracking

#### Tech Stack:
- **Runtime**: Node.js with TypeScript
- **State**: Redis for execution state
- **Database**: PostgreSQL for workflow definitions
- **Queue**: Bull/BullMQ for task processing

#### Success Criteria:
- [ ] Simple linear workflows execute successfully
- [ ] Node-to-node data passing works
- [ ] Error handling and retries functional
- [ ] Execution state properly tracked

---

### **Milestone 1.2: Core Node Library**
**Priority**: Critical - Essential workflow building blocks

#### Deliverables:
- [ ] **Aspire Integration Nodes**:
  ```typescript
  class AspireFetchOpportunityNode implements WorkflowNode {
    async execute(context: ExecutionContext): Promise<NodeResult> {
      // Call existing Aspire MCP server
      const opportunity = await mcpClient.call('aspire_fetch_opportunity', {
        workspace_id: context.inputs.workspace_id,
        opportunity_id: context.inputs.opportunity_id
      });
      return { outputs: { opportunity } };
    }
  }
  ```
- [ ] **AI Enhancement Nodes**:
  ```typescript
  class AITextGenerationNode implements WorkflowNode {
    async execute(context: ExecutionContext): Promise<NodeResult> {
      const response = await claudeClient.generate({
        prompt: context.inputs.prompt,
        context: context.inputs.context
      });
      return { outputs: { generated_text: response.text } };
    }
  }
  ```
- [ ] **Basic Logic Nodes**:
  - Conditional branching
  - Data transformation
  - Loop/iteration
  - Variable assignment

#### Tech Stack:
- **Base Classes**: TypeScript abstract classes
- **AI Integration**: Anthropic Claude API
- **MCP Integration**: Existing MCP client
- **Validation**: Zod for input/output schemas

#### Success Criteria:
- [ ] 8+ core nodes implemented and tested
- [ ] Aspire integration working through MCP
- [ ] AI text generation functional
- [ ] Logic nodes support branching workflows

---

### **Milestone 1.3: Reuse Existing Infrastructure**
**Priority**: Medium - Leverage existing work

#### Deliverables:
- [ ] **Integrate Platform Auth Service** (from existing roadmap):
  - Reuse credential management system
  - OAuth2 token handling for Aspire
  - Secure credential storage
- [ ] **Integrate Aspire MCP Server** (from existing roadmap):
  - Reuse existing 5 MCP tools
  - Error handling and retries
  - Guard field exclusions
- [ ] **Docker Compose Setup**:
  - Workflow engine service
  - Redis and PostgreSQL
  - Existing auth and MCP services

#### Tech Stack:
- **Reuse**: Existing FastAPI auth service
- **Reuse**: Existing Aspire MCP server
- **Integration**: HTTP APIs between services
- **Container**: Docker Compose orchestration

#### Success Criteria:
- [ ] All services start with docker-compose up
- [ ] Auth service provides tokens to workflow engine
- [ ] MCP server responds to workflow node calls
- [ ] End-to-end service communication working

---

## Phase 2: Visual Workflow Designer (2 weeks)

### **Milestone 2.1: React Workflow Designer**
**Priority**: Critical - User interface for workflow creation

#### Deliverables:
- [ ] **Drag-Drop Canvas**:
  ```typescript
  interface WorkflowCanvas {
    nodes: WorkflowNode[];
    connections: NodeConnection[];
    addNode(nodeType: string, position: Position): void;
    connectNodes(sourceId: string, targetId: string): void;
    validateWorkflow(): ValidationResult[];
  }
  ```
- [ ] **Node Library Panel**:
  - Categorized node types (SaaS, AI, Logic, Utility)
  - Drag-to-canvas functionality
  - Node search and filtering
- [ ] **Node Configuration Panel**:
  - Dynamic forms based on node type
  - Input/output mapping
  - Real-time validation
- [ ] **Workflow Execution Controls**:
  - Start/stop workflow execution
  - Step-by-step debugging
  - Execution history viewer

#### Tech Stack:
- **Frontend**: React 18 + TypeScript
- **Drag-Drop**: react-flow or similar
- **Forms**: React Hook Form + Zod
- **UI Library**: Tailwind CSS + shadcn/ui

#### Success Criteria:
- [ ] Users can drag nodes onto canvas
- [ ] Nodes can be connected with visual flow lines
- [ ] Node properties can be configured via forms
- [ ] Workflows can be saved and loaded

---

### **Milestone 2.2: Real-Time Workflow Execution**
**Priority**: High - Live workflow testing and monitoring

#### Deliverables:
- [ ] **Live Execution Mode**:
  ```typescript
  interface ExecutionMonitor {
    startExecution(workflow: WorkflowDefinition): Promise<ExecutionInstance>;
    monitorExecution(executionId: string): Observable<ExecutionUpdate>;
    pauseExecution(executionId: string): Promise<void>;
    stopExecution(executionId: string): Promise<void>;
  }
  ```
- [ ] **Real-Time Updates**:
  - WebSocket connection for execution updates
  - Node status indicators (running, completed, failed)
  - Data flow visualization
  - Performance metrics display
- [ ] **Debugging Tools**:
  - Breakpoint support
  - Variable inspection
  - Step-through execution
  - Error details and stack traces

#### Tech Stack:
- **WebSockets**: Socket.io for real-time updates
- **State Management**: Zustand or Redux Toolkit
- **Visualization**: Custom React components
- **Monitoring**: Custom execution tracking

#### Success Criteria:
- [ ] Workflows execute with real-time visual feedback
- [ ] Users can see data flowing between nodes
- [ ] Errors are clearly displayed with context
- [ ] Debugging tools help troubleshoot issues

---

## Phase 3: AI-Enhanced Workflow Templates (1 week)

### **Milestone 3.1: Proposal Generation Workflow**
**Priority**: High - Demonstrate core use case

#### Deliverables:
- [ ] **End-to-End Proposal Workflow**:
  ```yaml
  workflow: "aspire-proposal-generation"
  trigger: webhook
  steps:
    1. fetch-opportunity:
        node: aspire_fetch_opportunity
        inputs: 
          opportunity_id: "{{trigger.opportunity_id}}"
    
    2. generate-proposal-text:
        node: ai_text_generation
        inputs:
          prompt: "Generate proposal for {{fetch-opportunity.outputs.opportunity}}"
          
    3. create-proposal:
        node: aspire_create_proposal
        inputs:
          opportunity_id: "{{fetch-opportunity.outputs.opportunity.id}}"
          proposal_text: "{{generate-proposal-text.outputs.text}}"
  ```
- [ ] **Advanced AI Nodes**:
  ```typescript
  class AIProposalEnhancerNode implements WorkflowNode {
    async execute(context: ExecutionContext): Promise<NodeResult> {
      const { opportunity, tone, requirements } = context.inputs;
      
      const enhancedProposal = await claudeClient.enhance({
        opportunity: opportunity,
        tone: tone,
        requirements: requirements,
        template: 'field-service-proposal'
      });
      
      return { outputs: { enhanced_proposal: enhancedProposal } };
    }
  }
  ```
- [ ] **Template Configuration**:
  - Parameterizable workflows
  - Default value handling
  - Template versioning

#### Tech Stack:
- **Templates**: YAML workflow definitions
- **AI**: Claude API with custom prompts
- **Validation**: JSON Schema for template validation

#### Success Criteria:
- [ ] Complete proposal workflow executes successfully
- [ ] AI enhancement produces quality output
- [ ] Templates can be customized by users
- [ ] Workflow completes in under 30 seconds

---

### **Milestone 3.2: Workflow Template Library**
**Priority**: Medium - Demonstrate platform versatility

#### Deliverables:
- [ ] **Pre-Built Workflow Templates**:
  1. **Customer Onboarding**: Fetch customer → AI risk assessment → Setup workflow
  2. **Service Ticket Analysis**: Get tickets → AI sentiment analysis → Priority assignment  
  3. **Invoice Processing**: Fetch invoices → AI data extraction → Approval workflow
- [ ] **Template Marketplace UI**:
  - Template browser with categories
  - Template preview and description
  - One-click template installation
  - Template customization wizard
- [ ] **Template Management**:
  ```typescript
  interface TemplateManager {
    listTemplates(category?: string): Promise<WorkflowTemplate[]>;
    installTemplate(templateId: string): Promise<WorkflowInstance>;
    customizeTemplate(templateId: string, config: TemplateConfig): Promise<WorkflowInstance>;
    exportTemplate(workflowId: string): Promise<WorkflowTemplate>;
  }
  ```

#### Tech Stack:
- **Storage**: PostgreSQL for template definitions
- **UI**: React components for template browser
- **Export/Import**: JSON-based template format

#### Success Criteria:
- [ ] 3+ functional workflow templates available
- [ ] Templates can be easily installed and customized
- [ ] Users can create and share custom templates
- [ ] Template library is searchable and well-organized

---

## Technical Specifications

### **Workflow Definition Schema**
```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  
  trigger: {
    type: 'webhook' | 'schedule' | 'manual';
    config: TriggerConfig;
  };
  
  nodes: {
    [nodeId: string]: {
      type: string;
      position: { x: number; y: number };
      inputs: Record<string, any>;
      config: Record<string, any>;
    };
  };
  
  connections: Array<{
    source: string;
    target: string;
    sourceOutput?: string;
    targetInput?: string;
  }>;
  
  settings: {
    timeout: number;
    retryPolicy: RetryPolicy;
    errorHandling: ErrorHandling;
  };
}
```

### **Node Execution Context**
```typescript
interface ExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  
  inputs: Record<string, any>;
  variables: Record<string, any>;
  
  credentials: CredentialManager;
  logger: Logger;
  
  // Previous node outputs
  nodeOutputs: Record<string, any>;
  
  // Workflow metadata
  startTime: Date;
  currentStep: number;
  totalSteps: number;
}
```

### **Error Handling Strategy**
```typescript
interface ErrorHandling {
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    retryableErrors: string[];
  };
  
  fallbackBehavior: {
    continueOnError: boolean;
    defaultOutput?: any;
    fallbackNode?: string;
  };
  
  notifications: {
    onError: NotificationConfig[];
    onFailure: NotificationConfig[];
  };
}
```

---

## Infrastructure Requirements

### **Development Environment**
```yaml
# docker-compose.yml
version: "3.9"

services:
  workflow-engine:
    build: ./workflow-engine
    ports: ["8004:8004"]
    depends_on: [postgres, redis, platform-auth-service]
    
  workflow-ui:
    build: ./workflow-ui
    ports: ["3000:3000"]
    depends_on: [workflow-engine]
    
  platform-auth-service:
    # Reuse existing service
    ports: ["8001:8001"]
    
  aspire-mcp-server:
    # Reuse existing service
    ports: ["8002:8002"]
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: workflow_platform
      
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
```

### **Required Environment Variables**
```bash
# Workflow Engine
WORKFLOW_ENGINE_PORT=8004
WORKFLOW_DB_URL=postgresql://user:pass@postgres:5432/workflow_platform
WORKFLOW_REDIS_URL=redis://redis:6379

# AI Services  
ANTHROPIC_API_KEY=your-api-key
AI_MODEL=claude-3-5-sonnet-20241022

# Auth Integration
AUTH_SERVICE_URL=http://platform-auth-service:8001
AUTH_SERVICE_INTERNAL_KEY=workflow-engine-key

# MCP Integration
ASPIRE_MCP_URL=http://aspire-mcp-server:8002/mcp
```

---

## Success Metrics & Validation

### **POC Success Criteria**
- [ ] **Visual Design**: Users can create workflows in under 5 minutes
- [ ] **SaaS Integration**: Aspire workflows execute successfully 95% of the time
- [ ] **AI Enhancement**: AI nodes produce quality output with <10 second latency
- [ ] **Template Library**: 3+ templates functional and customizable
- [ ] **Performance**: Workflows execute in under 60 seconds
- [ ] **Reliability**: Error handling prevents workflow failures

### **Demo Scenarios**
1. **Proposal Generation Demo**:
   - Visual workflow creation (2 minutes)
   - Configure Aspire connection (30 seconds)
   - Execute workflow with real opportunity (30 seconds)
   - Show generated proposal in Aspire

2. **Template Installation Demo**:
   - Browse template library (30 seconds)
   - Install "Customer Onboarding" template (15 seconds)
   - Customize template parameters (1 minute)
   - Execute customized workflow

3. **Error Handling Demo**:
   - Introduce API failure
   - Show retry mechanism
   - Display error handling and fallback

### **Technical Validation**
- [ ] Load testing with 10+ concurrent workflows
- [ ] Error injection testing for failure scenarios
- [ ] Performance profiling of node execution times
- [ ] Security testing for credential handling

---

## Timeline & Milestones

### **Week 1-2: Foundation Infrastructure**
- **Week 1**: Workflow engine core + node library
- **Week 2**: Infrastructure integration + testing

### **Week 3-4: Visual Designer**  
- **Week 3**: React workflow designer UI
- **Week 4**: Real-time execution monitoring

### **Week 5: Templates & Polish**
- **Days 1-3**: Proposal workflow + AI enhancement
- **Days 4-5**: Template library + demo preparation

### **Total Timeline: 5 weeks**

---

## Risk Mitigation

### **High Risk Areas**
- **Visual Designer Complexity**: Complex drag-drop UIs can be time-consuming
  - *Mitigation*: Use proven React Flow library, start with simple MVP
- **Real-Time Performance**: WebSocket connections can be unreliable
  - *Mitigation*: Implement fallback polling, robust reconnection logic
- **AI Integration Latency**: AI calls may be too slow for workflows
  - *Mitigation*: Implement async execution with progress indicators

### **Medium Risk Areas** 
- **Error Handling**: Complex error scenarios in workflows
  - *Mitigation*: Start with simple retry logic, expand incrementally
- **Node Library Extensibility**: Adding new node types may be difficult
  - *Mitigation*: Design pluggable node architecture from start

---

## Next Steps

### **Immediate Actions** (This Week)
1. **Set up project structure** with workflow-engine and workflow-ui directories
2. **Implement basic Node.js workflow engine** with simple execution
3. **Create basic node interface** and implement 2-3 core nodes
4. **Set up development environment** with Docker Compose

### **Week 1 Goals**
- [ ] Workflow engine executes simple linear workflows
- [ ] Aspire integration nodes functional
- [ ] Basic AI text generation node working
- [ ] Foundation for visual designer established

### **POC Demo Preparation** (Week 5)
- [ ] Proposal generation workflow fully functional
- [ ] Visual designer polished and user-friendly
- [ ] Template library with 3+ templates
- [ ] Performance and reliability validated
- [ ] Demo script and scenarios prepared

---

This POC roadmap focuses specifically on **SaaS interaction + AI workflow automation** as requested by your manager, avoiding the complexity of ontology-driven app generation while demonstrating the core value proposition of AI-enhanced field service workflows.