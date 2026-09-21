"""
Aspire MCP Server

Exposes Aspire Field Management API operations as tool calls.
Consumed by the workflow engine via POST /tools/call.
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings
from tools.read import fetch_opportunity, list_attachments
from tools.write import create_proposal, update_proposal, upload_attachment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Aspire MCP Server",
    description="Tool call interface for Aspire Field Management API",
    version=settings.server_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Tool registry ─────────────────────────────────────────────────────────────

TOOLS = {
    "aspire_fetch_opportunity": fetch_opportunity,
    "aspire_list_attachments": list_attachments,
    # legacy name used by workflow engine node
    "aspire_list_opportunity_attachments": list_attachments,
    "aspire_create_proposal": create_proposal,
    "aspire_update_proposal": update_proposal,
    "aspire_upload_attachment": upload_attachment,
}

TOOL_DESCRIPTIONS = {
    "aspire_fetch_opportunity": "Fetch a single opportunity by ID including property, services, and proposals",
    "aspire_list_attachments": "List file attachments on an opportunity (images_only=true by default)",
    "aspire_create_proposal": "Create a new proposal linked to an opportunity",
    "aspire_update_proposal": "Update fields on an existing proposal (status changes excluded)",
    "aspire_upload_attachment": "Download a file from a URL and attach it to an opportunity or proposal",
}


# ── Request / Response models ─────────────────────────────────────────────────

class ToolCallRequest(BaseModel):
    name: str
    arguments: dict = {}


class ToolCallResponse(BaseModel):
    success: bool
    result: object = None
    error: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "aspire-mcp-server",
        "version": settings.server_version,
    }


@app.get("/")
async def root():
    return {
        "service": settings.server_name,
        "version": settings.server_version,
        "tools": [
            {"name": name, "description": desc}
            for name, desc in TOOL_DESCRIPTIONS.items()
        ],
    }


@app.get("/tools")
async def list_tools():
    """List all available tools and their descriptions."""
    return {
        "tools": [
            {"name": name, "description": desc}
            for name, desc in TOOL_DESCRIPTIONS.items()
        ]
    }


@app.post("/tools/call", response_model=ToolCallResponse)
async def tools_call(request: ToolCallRequest):
    """
    Execute a named Aspire tool call.

    Request body:
        name: tool name (e.g. "aspire_fetch_opportunity")
        arguments: tool-specific arguments dict

    Response:
        success: true/false
        result: tool output (on success)
        error: error message (on failure)
    """
    tool_fn = TOOLS.get(request.name)
    if tool_fn is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown tool: '{request.name}'. Available: {list(TOOLS.keys())}",
        )

    logger.info(f"Tool call: {request.name}", extra={"arguments_keys": list(request.arguments.keys())})

    try:
        result = await tool_fn(request.arguments)
        logger.info(f"Tool call succeeded: {request.name}")
        return ToolCallResponse(success=True, result=result)

    except ValueError as e:
        # Configuration errors (missing credentials, bad input)
        logger.warning(f"Tool call validation error: {request.name} — {e}")
        return ToolCallResponse(success=False, error=str(e))

    except Exception as e:
        logger.error(f"Tool call failed: {request.name} — {e}", exc_info=True)
        return ToolCallResponse(success=False, error=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
