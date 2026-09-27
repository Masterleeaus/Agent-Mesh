import { EXECUTION_CLASSES, EXECUTION_STATES, ExecutionError } from './execution-gateway.mjs';

/** MCP discovery maps capability only. It never creates authority. */
export class McpCapabilityAdapter {
  constructor({ company_id, serverId, client, mappings={}, timeoutMs=15000, safeRetries=1 }) {
    if (!company_id||!serverId||!client) throw new ExecutionError('INVALID_MCP_ADAPTER','MCP adapter requires company_id, serverId and client');
    this.company_id=company_id; this.serverId=serverId; this.client=client; this.mappings=new Map(Object.entries(mappings)); this.timeoutMs=timeoutMs; this.safeRetries=safeRetries;
  }
  async discover() { const tools=await this.client.listTools(); return tools.map(tool=>({server:this.serverId,external_tool:tool.name,capability:this.mappings.get(tool.name)??null,input_schema:tool.inputSchema??{},discovered:true,authorised:false})); }
  providerFor(capability,externalTool,{verify=null,retrySafe=false}={}) {
    if (this.mappings.get(externalTool)!==capability) throw new ExecutionError('MCP_MAPPING_REQUIRED','MCP tool must map to a stable Titan capability');
    if (typeof verify!=='function') throw new ExecutionError('MCP_VERIFIER_REQUIRED','MCP consequential capabilities require an independent verification query');
    return { id:`mcp:${this.serverId}:${externalTool}`,company_id:this.company_id,executionClass:EXECUTION_CLASSES.CONNECTED,capabilities:[capability],
      execute:async(request)=>{
        if(request.company_id!==this.company_id) throw new ExecutionError('MCP_COMPANY_SCOPE','MCP server is scoped to another company');
        let lastError;
        for(let attempt=0;attempt<=(retrySafe?this.safeRetries:0);attempt++) try {
          const result=await withTimeout(this.client.callTool(externalTool,request.input??{}, {signal:request.signal}),this.timeoutMs);
          if(result?.requiresAuth) return {state:EXECUTION_STATES.WAITING_USER_AUTH,external_ref:result?.requestId??null,result};
          if(result?.isError===true) throw new ExecutionError('MCP_PROVIDER_ERROR',result?.message??'MCP provider returned an error');
          return {external_ref:result?.requestId??result?.id??null,result};
        } catch(error) { lastError=error; if(attempt>=(retrySafe?this.safeRetries:0)) throw error; }
        throw lastError;
      },
      verify:async(raw,request)=>verify({raw,request,client:this.client,serverId:this.serverId}),
    };
  }
}

async function withTimeout(promise,ms) { let timer; try { return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new ExecutionError('MCP_TIMEOUT','MCP invocation timed out')),ms);})]); } finally { clearTimeout(timer); } }
