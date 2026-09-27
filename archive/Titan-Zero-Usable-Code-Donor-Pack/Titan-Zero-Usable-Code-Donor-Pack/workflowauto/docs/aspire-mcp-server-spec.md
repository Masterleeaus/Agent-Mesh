# Aspire MCP Server — Technical Specification

**Version:** 1.0.0  
**Status:** Ready for Implementation  
**Author:** Platform Team  
**Date:** 2026-03-05  
**Depends On:** Platform Auth Service (platform-auth-service-spec.md)

---

## 1. Overview

The Aspire MCP Server is a stateless HTTP service that exposes Aspire Field Management API operations as MCP tools. It is the first connector in the platform's connector layer.

It has no reasoning capability of its own. It receives tool call requests from agents (initially the Proposal Generation Agent), resolves a live token from the Platform Auth Service, executes the corresponding Aspire API call, and returns a typed result.

Every future connector in the platform follows this same pattern.

---

## 2. Goals & Non-Goals

### Goals

- Expose all Aspire actions from `connector-schema.json` as MCP tools
- Be fully stateless — no credentials, no token state, no request memory
- Delegate all auth to the Platform Auth Service
- Be consumable by any PydanticAI agent (or any MCP-compatible client) with zero Aspire-specific code in the agent
- Run locally via Docker, production-ready for serverless deployment with no code changes

### Non-Goals

- Any reasoning, decision-making, or multi-step orchestration
- Caching Aspire API responses (that belongs in the data availability layer, a future milestone)
- Exposing unmapped Aspire endpoints (`/workorders`, `/invoices`, `/schedules` — future connectors)
- User-facing auth flows

---

## 3. Tech Stack

| Concern               | Choice                                                   |
| --------------------- | -------------------------------------------------------- |
| MCP server framework  | `mcp` Python SDK (official, from Anthropic)              |
| HTTP transport        | Streamable HTTP (replaces SSE as of MCP spec 2025-03-26) |
| API framework         | FastAPI (hosts the MCP server over HTTP)                 |
| Aspire HTTP client    | `httpx` (async)                                          |
| Data validation       | Pydantic v2                                              |
| Auth token resolution | HTTP call to Platform Auth Service                       |
| Config                | `pydantic-settings`                                      |
| Containerisation      | Docker                                                   |

---

## 4. Project Structure

```
aspire-mcp-server/
├── pyproject.toml
├── Dockerfile
├── .env.example
├── README.md
│
├── main.py                    # FastAPI app + MCP server mount
├── config.py                  # Settings
│
├── auth/
│   ├── __init__.py
│   └── token_resolver.py      # Calls Platform Auth Service for live token
│
├── client/
│   ├── __init__.py
│   └── aspire.py              # Async httpx client — auth header injection + retry
│
├── models/
│   ├── __init__.py
│   └── aspire.py              # Pydantic models for all Aspire objects
│
├── tools/
│   ├── __init__.py
│   ├── read.py                # MCP tools: fetch_opportunity, list_attachments
│   └── write.py               # MCP tools: create_proposal, update_proposal,
│                              #             upload_attachment
│
└── tests/
    ├── conftest.py
    ├── test_tools_read.py
    ├── test_tools_write.py
    └── fixtures/
        ├── opportunity.json
        └── attachments.json
```

---

## 5. Configuration

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 8002

    # Aspire API
    aspire_base_url: str = "https://api.youraspire.com/api/v1"
    aspire_rate_limit_rpm: int = 300
    aspire_max_retries: int = 4

    # Platform Auth Service
    auth_service_url: str = "http://platform-auth-service:8001"
    auth_service_internal_key: str = "local-dev-key"

    # MCP server identity
    server_name: str = "aspire-field-management"
    server_version: str = "1.0.0"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 6. Data Models (`models/aspire.py`)

Pydantic models for all objects returned by Aspire. These are the typed contracts between the MCP server and any consuming agent. Derived directly from `connector-schema.json`.

```python
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

# ── Core Objects ──────────────────────────────────────────────────────────────

class Property(BaseModel):
    propertyId: int
    propertyName: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    squareFootage: Optional[float] = None
    propertyTypeId: Optional[int] = None

    @property
    def full_address(self) -> str:
        parts = [self.address, self.city, self.state, self.zip]
        return ", ".join(p for p in parts if p)

    @property
    def property_type_label(self) -> str:
        return {1: "Residential", 2: "Commercial", 3: "HOA"}.get(
            self.propertyTypeId, "Unknown"
        )


class OpportunityService(BaseModel):
    serviceId: int
    serviceName: str
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None


class Opportunity(BaseModel):
    opportunityId: int
    opportunityName: str
    opportunityStatusId: int
    propertyId: int
    contactId: Optional[int] = None
    assignedRepId: Optional[int] = None
    totalRevenue: Optional[float] = None
    createdDate: datetime
    notes: Optional[str] = None
    property: Optional[Property] = None
    services: list[OpportunityService] = []


class Attachment(BaseModel):
    attachmentId: int
    fileName: str
    fileType: Optional[str] = None
    fileUrl: Optional[str] = None
    uploadedAt: Optional[datetime] = None
    isBeforeImage: Optional[bool] = None

    @property
    def is_image(self) -> bool:
        return (self.fileType or "").lower() in {"jpg", "jpeg", "png", "webp"}


class Proposal(BaseModel):
    proposalId: int
    proposalName: str
    opportunityId: int
    proposalStatusId: int
    sentDate: Optional[datetime] = None
    expirationDate: Optional[date] = None
    totalAmount: Optional[float] = None
    notes: Optional[str] = None


# ── Tool Input Schemas ────────────────────────────────────────────────────────
# Explicit input models for each MCP tool. These are what the agent passes in.
# Pydantic validates them before the Aspire API call is ever made.

class FetchOpportunityInput(BaseModel):
    workspace_id: str = Field(..., description="Platform workspace ID")
    opportunity_id: int = Field(..., description="Aspire opportunity ID")
    include_services: bool = Field(True, description="Include nested services")
    include_proposals: bool = Field(True, description="Include nested proposals")


class ListAttachmentsInput(BaseModel):
    workspace_id: str
    opportunity_id: int
    images_only: bool = Field(
        True,
        description="If true, filter to jpg/jpeg/png/webp only"
    )


class CreateProposalInput(BaseModel):
    workspace_id: str
    opportunity_id: int
    proposal_name: str
    notes: Optional[str] = None
    expiration_date: Optional[date] = None
    template_id: Optional[int] = None


class UpdateProposalInput(BaseModel):
    workspace_id: str
    proposal_id: int
    proposal_name: Optional[str] = None
    notes: Optional[str] = None
    expiration_date: Optional[date] = None
    # NOTE: proposalStatusId deliberately excluded.
    # Changing status triggers downstream Aspire automations.
    # Guard field — not exposed until human-in-the-loop is implemented.


class UploadAttachmentInput(BaseModel):
    workspace_id: str
    file_name: str
    file_url: str = Field(
        ...,
        description="URL of the file to fetch and upload. "
                    "The MCP server downloads and base64-encodes it."
    )
    parent_type: str = Field(..., pattern="^(opportunity|proposal)$")
    parent_id: int
```

---

## 7. Token Resolver (`auth/token_resolver.py`)

Single responsibility: given a `workspace_id` and `connector_id`, return a live Bearer token from the Platform Auth Service.

```python
import httpx
from config import settings

CONNECTOR_ID = "aspire-field-management"

class TokenResolver:
    def __init__(self):
        self._base_url = settings.auth_service_url
        self._api_key = settings.auth_service_internal_key

    async def resolve(self, workspace_id: str) -> str:
        """
        Fetch a live token for the given workspace from the Platform Auth Service.
        Raises on failure — the tool call should not proceed without a valid token.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/token",
                params={
                    "workspace_id": workspace_id,
                    "connector_id": CONNECTOR_ID,
                },
                headers={"Authorization": f"Bearer {self._api_key}"},
                timeout=10.0,
            )

        if response.status_code == 404:
            raise ValueError(
                f"No Aspire credentials configured for workspace '{workspace_id}'. "
                "Please register credentials via the Platform Auth Service."
            )

        response.raise_for_status()
        return response.json()["access_token"]


# Module-level singleton — shared across tool calls within a server instance
token_resolver = TokenResolver()
```

---

## 8. Aspire HTTP Client (`client/aspire.py`)

Stateless async HTTP client. Receives a token per call — holds no auth state itself.

```python
import asyncio
import httpx
from config import settings

RETRY_ON = {429, 503}

class AspireClient:

    def __init__(self, base_url: str = settings.aspire_base_url):
        self._base_url = base_url

    async def get(self, token: str, path: str, params: dict | None = None) -> dict:
        return await self._request("GET", token, path, params=params)

    async def post(self, token: str, path: str, json: dict) -> dict:
        return await self._request("POST", token, path, json=json)

    async def patch(self, token: str, path: str, json: dict) -> dict:
        return await self._request("PATCH", token, path, json=json)

    async def _request(
        self,
        method: str,
        token: str,
        path: str,
        **kwargs,
    ) -> dict:
        url = f"{self._base_url}{path}"
        headers = {"Authorization": f"Bearer {token}"}

        for attempt in range(settings.aspire_max_retries):
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method, url, headers=headers, timeout=30.0, **kwargs
                )

            if response.status_code in RETRY_ON:
                await asyncio.sleep(2 ** attempt)
                continue

            response.raise_for_status()
            return response.json()

        raise RuntimeError(
            f"Aspire API unavailable after {settings.aspire_max_retries} retries: "
            f"{method} {path}"
        )


# Module-level singleton
aspire_client = AspireClient()
```

---

## 9. MCP Tools

### 9.1 Read Tools (`tools/read.py`)

```python
from mcp.server import Server
from mcp.types import Tool, TextContent
from models.aspire import (
    FetchOpportunityInput,
    ListAttachmentsInput,
    Opportunity,
    Attachment,
)
from auth.token_resolver import token_resolver
from client.aspire import aspire_client
import json

def register_read_tools(server: Server):

    @server.tool()
    async def aspire_fetch_opportunity(
        workspace_id: str,
        opportunity_id: int,
        include_services: bool = True,
        include_proposals: bool = True,
    ) -> str:
        """
        Fetch a single Aspire opportunity by ID, including its nested property,
        contact, and services. Returns the full opportunity as JSON.

        Use this as the first step in any workflow that operates on an opportunity.
        """
        inp = FetchOpportunityInput(
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            include_services=include_services,
            include_proposals=include_proposals,
        )
        token = await token_resolver.resolve(inp.workspace_id)
        data = await aspire_client.get(
            token,
            f"/opportunities/{inp.opportunity_id}",
            params={
                "includeServices": inp.include_services,
                "includeProposals": inp.include_proposals,
            },
        )
        opportunity = Opportunity.model_validate(data)
        return opportunity.model_dump_json()


    @server.tool()
    async def aspire_list_attachments(
        workspace_id: str,
        opportunity_id: int,
        images_only: bool = True,
    ) -> str:
        """
        List file attachments on an Aspire opportunity.
        When images_only=true (default), returns only jpg/jpeg/png/webp files.
        Returns a JSON array of attachment objects including fileUrl for download.

        fileUrl values are presigned and short-lived — use them promptly.
        """
        inp = ListAttachmentsInput(
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            images_only=images_only,
        )
        token = await token_resolver.resolve(inp.workspace_id)
        data = await aspire_client.get(
            token,
            f"/opportunities/{inp.opportunity_id}/attachments",
        )
        attachments = [Attachment.model_validate(item) for item in data]
        if inp.images_only:
            attachments = [a for a in attachments if a.is_image]
        return json.dumps([a.model_dump() for a in attachments])
```

### 9.2 Write Tools (`tools/write.py`)

```python
import base64
import httpx
import json
from datetime import date
from mcp.server import Server
from models.aspire import (
    CreateProposalInput,
    UpdateProposalInput,
    UploadAttachmentInput,
    Proposal,
)
from auth.token_resolver import token_resolver
from client.aspire import aspire_client

def register_write_tools(server: Server):

    @server.tool()
    async def aspire_create_proposal(
        workspace_id: str,
        opportunity_id: int,
        proposal_name: str,
        notes: str | None = None,
        expiration_date: str | None = None,   # ISO date string YYYY-MM-DD
        template_id: int | None = None,
    ) -> str:
        """
        Create a new proposal in Aspire linked to the given opportunity.
        Always creates a NEW proposal — never updates an existing one.

        expiration_date: optional ISO date string (YYYY-MM-DD).
        Returns the created proposal as JSON including the new proposalId.
        """
        inp = CreateProposalInput(
            workspace_id=workspace_id,
            opportunity_id=opportunity_id,
            proposal_name=proposal_name,
            notes=notes,
            expiration_date=date.fromisoformat(expiration_date)
                if expiration_date else None,
            template_id=template_id,
        )
        token = await token_resolver.resolve(inp.workspace_id)
        body = {
            "opportunityId": inp.opportunity_id,
            "proposalName": inp.proposal_name,
        }
        if inp.notes:
            body["notes"] = inp.notes
        if inp.expiration_date:
            body["expirationDate"] = inp.expiration_date.isoformat()
        if inp.template_id:
            body["templateId"] = inp.template_id

        data = await aspire_client.post(token, "/proposals", json=body)
        proposal = Proposal.model_validate(data)
        return proposal.model_dump_json()


    @server.tool()
    async def aspire_update_proposal(
        workspace_id: str,
        proposal_id: int,
        proposal_name: str | None = None,
        notes: str | None = None,
        expiration_date: str | None = None,
    ) -> str:
        """
        Update fields on an existing Aspire proposal.

        Only proposal_name, notes, and expiration_date are exposed.
        Proposal status is intentionally not updateable via this tool —
        status changes trigger downstream Aspire automations and require
        explicit human confirmation (not yet implemented).

        Returns the updated proposal as JSON.
        """
        inp = UpdateProposalInput(
            workspace_id=workspace_id,
            proposal_id=proposal_id,
            proposal_name=proposal_name,
            notes=notes,
            expiration_date=date.fromisoformat(expiration_date)
                if expiration_date else None,
        )
        token = await token_resolver.resolve(inp.workspace_id)
        body = {}
        if inp.proposal_name:
            body["proposalName"] = inp.proposal_name
        if inp.notes:
            body["notes"] = inp.notes
        if inp.expiration_date:
            body["expirationDate"] = inp.expiration_date.isoformat()

        data = await aspire_client.patch(
            token, f"/proposals/{inp.proposal_id}", json=body
        )
        proposal = Proposal.model_validate(data)
        return proposal.model_dump_json()


    @server.tool()
    async def aspire_upload_attachment(
        workspace_id: str,
        file_name: str,
        file_url: str,
        parent_type: str,
        parent_id: int,
    ) -> str:
        """
        Download a file from file_url, base64-encode it, and attach it to
        an Aspire opportunity or proposal.

        parent_type: "opportunity" or "proposal"
        parent_id: the opportunityId or proposalId to attach to
        file_url: any accessible URL — typically the after-image URL from
                  the image generation node

        Returns JSON with success status and attachmentId if successful.
        """
        inp = UploadAttachmentInput(
            workspace_id=workspace_id,
            file_name=file_name,
            file_url=file_url,
            parent_type=parent_type,
            parent_id=parent_id,
        )
        token = await token_resolver.resolve(inp.workspace_id)

        # Download the file from the provided URL
        async with httpx.AsyncClient() as http:
            file_response = await http.get(inp.file_url, timeout=30.0)
            file_response.raise_for_status()
            file_content = base64.b64encode(file_response.content).decode()

        data = await aspire_client.post(
            token,
            "/attachments",
            json={
                "fileName": inp.file_name,
                "fileContent": file_content,
                "parentType": inp.parent_type,
                "parentId": inp.parent_id,
            },
        )
        return json.dumps({"success": True, "attachment": data})
```

---

## 10. MCP Server + FastAPI Mount (`main.py`)

```python
from mcp.server import Server
from mcp.server.fastapi import create_mcp_fastapi_app
from tools.read import register_read_tools
from tools.write import register_write_tools
from config import settings

# Create the MCP server
mcp_server = Server(
    name=settings.server_name,
    version=settings.server_version,
)

# Register all tools
register_read_tools(mcp_server)
register_write_tools(mcp_server)

# Mount as FastAPI app with Streamable HTTP transport
app = create_mcp_fastapi_app(mcp_server)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
```

---

## 11. Tool Summary

| MCP Tool Name              | Aspire Action                  | Type  | Guard                       |
| -------------------------- | ------------------------------ | ----- | --------------------------- |
| `aspire_fetch_opportunity` | `fetch_opportunity`            | read  | —                           |
| `aspire_list_attachments`  | `list_opportunity_attachments` | read  | —                           |
| `aspire_create_proposal`   | `create_proposal`              | write | —                           |
| `aspire_update_proposal`   | `update_proposal`              | write | `proposalStatusId` excluded |
| `aspire_upload_attachment` | `upload_attachment`            | write | —                           |

**Note on `proposalStatusId`:** The connector schema marks this as a guard field — changing it triggers downstream Aspire automations. It is deliberately excluded from `aspire_update_proposal` in v1. When human-in-the-loop approval is added to the platform, it can be re-exposed behind a confirmation gate.

---

## 12. Error Handling

All errors are surfaced as MCP tool errors with descriptive messages. The consuming agent receives the error text and decides whether to retry, continue, or abort.

| Scenario                          | HTTP status from Aspire | MCP tool response                                              |
| --------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Opportunity not found             | 404                     | Error: "Opportunity {id} not found in Aspire"                  |
| No credentials for workspace      | Auth service 404        | Error: "No Aspire credentials configured for workspace '{id}'" |
| Aspire rate limited               | 429                     | Retried with exponential backoff, then error if exhausted      |
| Aspire unavailable                | 503                     | Retried with exponential backoff, then error if exhausted      |
| File download fails (upload tool) | —                       | Error: "Failed to download file from {url}"                    |
| Invalid input (Pydantic)          | —                       | Error: validation message with field details                   |

---

## 13. Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install uv && uv sync

COPY . .

CMD ["python", "main.py"]
```

---

## 14. Dependencies (`pyproject.toml`)

```toml
[project]
name = "aspire-mcp-server"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    "mcp>=1.0",
    "fastapi>=0.111",
    "uvicorn>=0.29",
    "httpx>=0.27",
    "pydantic>=2.0",
    "pydantic-settings>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "respx>=0.21",
]
```

---

## 15. Testing

### Read tool — success path

```python
@pytest.mark.asyncio
@respx.mock
async def test_fetch_opportunity(mcp_client, opportunity_fixture):
    # Mock auth service
    respx.get("http://platform-auth-service:8001/token").mock(
        return_value=Response(200, json={"access_token": "test-token"})
    )
    # Mock Aspire API
    respx.get("https://api.youraspire.com/api/v1/opportunities/123").mock(
        return_value=Response(200, json=opportunity_fixture)
    )
    result = await mcp_client.call_tool(
        "aspire_fetch_opportunity",
        {"workspace_id": "ws_local", "opportunity_id": 123}
    )
    data = json.loads(result.content[0].text)
    assert data["opportunityId"] == 123
    assert data["property"] is not None
```

### Write tool — guard field absent

```python
async def test_update_proposal_no_status_field(mcp_client):
    # Confirm proposalStatusId is not accepted as input
    with pytest.raises(Exception, match="proposalStatusId"):
        await mcp_client.call_tool(
            "aspire_update_proposal",
            {
                "workspace_id": "ws_local",
                "proposal_id": 456,
                "proposalStatusId": 2,   # should be rejected
            }
        )
```

### Missing credentials

```python
@respx.mock
async def test_missing_credentials(mcp_client):
    respx.get("http://platform-auth-service:8001/token").mock(
        return_value=Response(404, json={"detail": "No credentials found"})
    )
    result = await mcp_client.call_tool(
        "aspire_fetch_opportunity",
        {"workspace_id": "ws_unknown", "opportunity_id": 123}
    )
    assert result.is_error
    assert "credentials" in result.content[0].text.lower()
```

---

## 16. Docker Compose (all three services)

This is the complete local stack — Platform Auth Service, Aspire MCP Server, and a placeholder for the Proposal Agent.

```yaml
# docker-compose.yml  (lives at monorepo root)
version: "3.9"

services:
  platform-auth-service:
    build: ./platform-auth-service
    ports:
      - "8001:8001"
    environment:
      - ENV=local
      - SQLITE_PATH=/data/credentials.db
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
    volumes:
      - auth-data:/data

  aspire-mcp-server:
    build: ./aspire-mcp-server
    ports:
      - "8002:8002"
    environment:
      - AUTH_SERVICE_URL=http://platform-auth-service:8001
      - AUTH_SERVICE_INTERNAL_KEY=${INTERNAL_API_KEY}
      - ASPIRE_BASE_URL=${ASPIRE_BASE_URL}
    depends_on:
      - platform-auth-service

  # proposal-agent:      ← added in next spec
  #   build: ./proposal-agent
  #   ports:
  #     - "8003:8003"
  #   depends_on:
  #     - aspire-mcp-server

volumes:
  auth-data:
```

`.env` at monorepo root:

```bash
ENCRYPTION_KEY=        # generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
INTERNAL_API_KEY=local-dev-key
ASPIRE_BASE_URL=https://api.youraspire.com/api/v1
```

---

## 17. How an Agent Consumes This Server

In PydanticAI, the Proposal Generation Agent connects to this MCP server with a single configuration block. No Aspire-specific code in the agent at all:

```python
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerHTTP

aspire_mcp = MCPServerHTTP(url="http://aspire-mcp-server:8002/mcp")

proposal_agent = Agent(
    "anthropic:claude-sonnet-4-5",
    mcp_servers=[aspire_mcp],
    # All aspire_* tools are now available to the agent automatically
)
```

When the agent calls `aspire_fetch_opportunity`, it passes `workspace_id` from its deps. The MCP server resolves the token, calls Aspire, and returns the typed result. The agent never sees a credential.

---

## 18. Open Questions

1. **MCP SDK version** — the `mcp` Python SDK is evolving quickly. Pin to a specific version in `pyproject.toml` and review on each upgrade. Streamable HTTP transport was introduced in spec version 2025-03-26 — confirm the installed SDK version supports it.
2. **`isBeforeImage` inference** — the connector schema flags this as agent-inferred. The MCP server returns raw attachment data with `isBeforeImage: null` for most attachments. The Proposal Agent is responsible for deciding which image to use as the before image, not this server.
3. **Pagination** — `aspire_list_attachments` currently returns all attachments in a single call. The connector schema defines an offset pagination strategy (`pageNumber` / `pageSize` / `totalCount`). If an opportunity has many attachments this will need pagination support. Acceptable to defer for v1.
4. **`fileUrl` TTL** — Aspire presigned URLs are short-lived. The `aspire_upload_attachment` tool downloads the file immediately. If there is any delay between `aspire_list_attachments` and `aspire_upload_attachment` in the agent workflow, the URL may have expired. Document this clearly for agent authors.
