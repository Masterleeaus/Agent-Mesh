# Platform Auth Service — Technical Specification

**Version:** 1.0.0  
**Status:** Ready for Implementation  
**Author:** Platform Team  
**Date:** 2026-03-05  
**Environment:** Local (Docker) → Production (hosted service)

---

## 1. Overview

The Platform Auth Service is a core platform component responsible for two things:

1. **Credential storage** — securely storing workspace-level connector credentials (client IDs, secrets, API keys)
2. **Token lifecycle management** — fetching, caching, refreshing, and vending live tokens to connector MCP servers on demand

Every connector MCP server in the platform calls this service to get a live token before making an API call. No connector ever stores credentials or manages token state itself.

---

## 2. Goals & Non-Goals

### Goals

- Provide a single `/token` endpoint that any connector can call to get a live token
- Support multiple auth strategies (OAuth2 client credentials, API key, more later)
- Abstract token caching so connectors are fully stateless
- Be swappable between local (SQLite + in-memory) and prod (Secrets Manager + Redis) via environment config
- Be runnable locally via Docker with zero external dependencies

### Non-Goals

- OAuth2 authorization code flow / PKCE (user-facing OAuth — future milestone)
- Token revocation
- Multi-region or HA deployment (local and single-region prod only for now)
- User authentication (this service authenticates connectors to third-party APIs, not users to the platform)

---

## 3. Tech Stack

| Concern                | Local                               | Prod (future)         |
| ---------------------- | ----------------------------------- | --------------------- |
| Framework              | FastAPI                             | FastAPI               |
| Credential store       | SQLite via `aiosqlite`              | AWS Secrets Manager   |
| Token cache            | In-memory dict                      | Redis via `redis-py`  |
| Auth strategy dispatch | Plugin pattern keyed on `auth_type` | Same                  |
| Config                 | `pydantic-settings` + `.env`        | Environment variables |
| Containerisation       | Docker                              | Docker / Lambda       |

---

## 4. Project Structure

```
platform-auth-service/
├── pyproject.toml
├── Dockerfile
├── .env.example
├── README.md
│
├── main.py                        # FastAPI app entrypoint
├── config.py                      # Settings via pydantic-settings
│
├── store/
│   ├── __init__.py
│   ├── base.py                    # Abstract CredentialStore interface
│   ├── sqlite_store.py            # Local SQLite implementation
│   └── secrets_manager_store.py  # Prod AWS implementation (stub for now)
│
├── cache/
│   ├── __init__.py
│   ├── base.py                    # Abstract TokenCache interface
│   ├── memory_cache.py            # Local in-memory implementation
│   └── redis_cache.py             # Prod Redis implementation (stub for now)
│
├── strategies/
│   ├── __init__.py
│   ├── base.py                    # Abstract AuthStrategy interface
│   ├── oauth2_client_credentials.py
│   └── api_key.py
│
├── routers/
│   ├── __init__.py
│   ├── token.py                   # GET /token endpoint
│   └── credentials.py             # CRUD endpoints for credential management
│
└── tests/
    ├── conftest.py
    ├── test_token_endpoint.py
    ├── test_oauth2_strategy.py
    └── test_credential_store.py
```

---

## 5. Configuration

```python
# config.py
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Environment
    env: Literal["local", "prod"] = "local"
    port: int = 8001

    # Credential store
    credential_store: Literal["sqlite", "secrets_manager"] = "sqlite"
    sqlite_path: str = "./data/credentials.db"

    # Token cache
    token_cache: Literal["memory", "redis"] = "memory"
    redis_url: str = "redis://localhost:6379"

    # Security
    # Internal shared secret — MCP servers present this to authenticate
    # requests to the auth service. Simple for local; rotate in prod.
    internal_api_key: str = "local-dev-key"

    # Token buffer — refresh tokens this many seconds before expiry
    token_refresh_buffer_seconds: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 6. Data Models

### 6.1 Stored Credential

The unit of storage. One record per workspace per connector.

```python
# models.py
from pydantic import BaseModel
from typing import Literal, Any
from datetime import datetime

class StoredCredential(BaseModel):
    workspace_id: str
    connector_id: str
    auth_type: Literal["oauth2_client_credentials", "api_key"]
    # Encrypted at rest. Contents depend on auth_type:
    # oauth2_client_credentials: { client_id, client_secret, token_url, scopes }
    # api_key: { api_key }
    credential_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class CachedToken(BaseModel):
    access_token: str
    expires_at: float   # Unix timestamp
    token_type: str = "Bearer"
```

### 6.2 API Request / Response

```python
class TokenRequest(BaseModel):
    workspace_id: str
    connector_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    connector_id: str
    workspace_id: str

class CredentialUpsertRequest(BaseModel):
    workspace_id: str
    connector_id: str
    auth_type: Literal["oauth2_client_credentials", "api_key"]
    credential_data: dict[str, Any]
    # Examples:
    # oauth2: { "client_id": "...", "client_secret": "...",
    #           "token_url": "https://...", "scopes": ["read", "write"] }
    # api_key: { "api_key": "sk-..." }
```

---

## 7. Credential Store

### 7.1 Abstract Interface (`store/base.py`)

```python
from abc import ABC, abstractmethod
from models import StoredCredential

class CredentialStore(ABC):

    @abstractmethod
    async def get(self, workspace_id: str, connector_id: str) -> StoredCredential | None:
        """Retrieve credentials for a workspace+connector pair."""
        ...

    @abstractmethod
    async def upsert(self, credential: StoredCredential) -> None:
        """Create or update credentials for a workspace+connector pair."""
        ...

    @abstractmethod
    async def delete(self, workspace_id: str, connector_id: str) -> None:
        """Remove credentials for a workspace+connector pair."""
        ...
```

### 7.2 SQLite Implementation (`store/sqlite_store.py`)

```python
import json
import aiosqlite
from datetime import datetime, timezone
from models import StoredCredential
from .base import CredentialStore
from crypto import encrypt, decrypt   # see Section 9

class SQLiteCredentialStore(CredentialStore):
    def __init__(self, db_path: str):
        self._db_path = db_path

    async def _init_db(self):
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS credentials (
                    workspace_id TEXT NOT NULL,
                    connector_id TEXT NOT NULL,
                    auth_type TEXT NOT NULL,
                    credential_data TEXT NOT NULL,  -- encrypted JSON
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (workspace_id, connector_id)
                )
            """)
            await db.commit()

    async def get(self, workspace_id: str, connector_id: str) -> StoredCredential | None:
        async with aiosqlite.connect(self._db_path) as db:
            async with db.execute(
                "SELECT * FROM credentials WHERE workspace_id=? AND connector_id=?",
                (workspace_id, connector_id)
            ) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                return StoredCredential(
                    workspace_id=row[0],
                    connector_id=row[1],
                    auth_type=row[2],
                    credential_data=json.loads(decrypt(row[3])),
                    created_at=datetime.fromisoformat(row[4]),
                    updated_at=datetime.fromisoformat(row[5]),
                )

    async def upsert(self, credential: StoredCredential) -> None:
        encrypted = encrypt(json.dumps(credential.credential_data))
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute("""
                INSERT INTO credentials
                    (workspace_id, connector_id, auth_type, credential_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(workspace_id, connector_id) DO UPDATE SET
                    auth_type=excluded.auth_type,
                    credential_data=excluded.credential_data,
                    updated_at=excluded.updated_at
            """, (
                credential.workspace_id,
                credential.connector_id,
                credential.auth_type,
                encrypted,
                now,
                now,
            ))
            await db.commit()

    async def delete(self, workspace_id: str, connector_id: str) -> None:
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                "DELETE FROM credentials WHERE workspace_id=? AND connector_id=?",
                (workspace_id, connector_id)
            )
            await db.commit()
```

---

## 8. Token Cache

### 8.1 Abstract Interface (`cache/base.py`)

```python
from abc import ABC, abstractmethod
from models import CachedToken

class TokenCache(ABC):

    @abstractmethod
    async def get(self, workspace_id: str, connector_id: str) -> CachedToken | None:
        """Return a cached token if one exists and is still valid."""
        ...

    @abstractmethod
    async def set(
        self,
        workspace_id: str,
        connector_id: str,
        token: CachedToken
    ) -> None:
        """Cache a token."""
        ...

    @abstractmethod
    async def invalidate(self, workspace_id: str, connector_id: str) -> None:
        """Remove a cached token, forcing a fresh fetch on next request."""
        ...
```

### 8.2 In-Memory Implementation (`cache/memory_cache.py`)

```python
import time
from models import CachedToken
from .base import TokenCache
from config import settings

class MemoryTokenCache(TokenCache):
    def __init__(self):
        self._store: dict[str, CachedToken] = {}

    def _key(self, workspace_id: str, connector_id: str) -> str:
        return f"{workspace_id}:{connector_id}"

    async def get(self, workspace_id: str, connector_id: str) -> CachedToken | None:
        token = self._store.get(self._key(workspace_id, connector_id))
        if not token:
            return None
        # Treat as expired if within buffer window
        if time.time() >= (token.expires_at - settings.token_refresh_buffer_seconds):
            return None
        return token

    async def set(self, workspace_id: str, connector_id: str, token: CachedToken) -> None:
        self._store[self._key(workspace_id, connector_id)] = token

    async def invalidate(self, workspace_id: str, connector_id: str) -> None:
        self._store.pop(self._key(workspace_id, connector_id), None)
```

---

## 9. Auth Strategies

### 9.1 Abstract Interface (`strategies/base.py`)

```python
from abc import ABC, abstractmethod
from models import CachedToken

class AuthStrategy(ABC):

    @abstractmethod
    async def fetch_token(self, credential_data: dict) -> CachedToken:
        """
        Use the provided credential data to obtain a fresh token.
        Returns a CachedToken with access_token and expires_at populated.
        """
        ...
```

### 9.2 OAuth2 Client Credentials (`strategies/oauth2_client_credentials.py`)

```python
import time
import httpx
from models import CachedToken
from .base import AuthStrategy

class OAuth2ClientCredentialsStrategy(AuthStrategy):

    async def fetch_token(self, credential_data: dict) -> CachedToken:
        """
        credential_data expected keys:
          - client_id: str
          - client_secret: str
          - token_url: str
          - scopes: list[str]  (optional)
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                credential_data["token_url"],
                data={
                    "grant_type": "client_credentials",
                    "client_id": credential_data["client_id"],
                    "client_secret": credential_data["client_secret"],
                    **(
                        {"scope": " ".join(credential_data["scopes"])}
                        if credential_data.get("scopes") else {}
                    ),
                },
            )
            response.raise_for_status()
            data = response.json()

        return CachedToken(
            access_token=data["access_token"],
            expires_at=time.time() + data.get("expires_in", 3600),
            token_type=data.get("token_type", "Bearer"),
        )
```

### 9.3 API Key (`strategies/api_key.py`)

```python
import time
from models import CachedToken
from .base import AuthStrategy

class ApiKeyStrategy(AuthStrategy):

    async def fetch_token(self, credential_data: dict) -> CachedToken:
        """
        API keys don't expire. We model them as tokens with a very long TTL
        so they flow through the same interface as OAuth tokens.

        credential_data expected keys:
          - api_key: str
        """
        return CachedToken(
            access_token=credential_data["api_key"],
            expires_at=time.time() + (365 * 24 * 3600),  # 1 year TTL
            token_type="ApiKey",
        )
```

### 9.4 Strategy Registry (`strategies/__init__.py`)

```python
from .oauth2_client_credentials import OAuth2ClientCredentialsStrategy
from .api_key import ApiKeyStrategy
from .base import AuthStrategy

STRATEGY_REGISTRY: dict[str, type[AuthStrategy]] = {
    "oauth2_client_credentials": OAuth2ClientCredentialsStrategy,
    "api_key": ApiKeyStrategy,
}

def get_strategy(auth_type: str) -> AuthStrategy:
    cls = STRATEGY_REGISTRY.get(auth_type)
    if not cls:
        raise ValueError(f"Unsupported auth_type: {auth_type}")
    return cls()
```

---

## 10. API Endpoints

### 10.1 Token Endpoint (`routers/token.py`)

The primary endpoint. Called by every connector MCP server before making an API call.

```
GET /token?workspace_id={workspace_id}&connector_id={connector_id}
Authorization: Bearer {internal_api_key}
```

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from models import TokenResponse
from store.base import CredentialStore
from cache.base import TokenCache
from strategies import get_strategy
from dependencies import get_credential_store, get_token_cache, verify_internal_key

router = APIRouter()

@router.get("/token", response_model=TokenResponse)
async def get_token(
    workspace_id: str = Query(...),
    connector_id: str = Query(...),
    _: None = Depends(verify_internal_key),
    store: CredentialStore = Depends(get_credential_store),
    cache: TokenCache = Depends(get_token_cache),
):
    # 1. Check cache
    cached = await cache.get(workspace_id, connector_id)
    if cached:
        return TokenResponse(
            access_token=cached.access_token,
            token_type=cached.token_type,
            connector_id=connector_id,
            workspace_id=workspace_id,
        )

    # 2. Load credentials
    credential = await store.get(workspace_id, connector_id)
    if not credential:
        raise HTTPException(
            status_code=404,
            detail=f"No credentials found for workspace={workspace_id} connector={connector_id}"
        )

    # 3. Fetch fresh token via appropriate strategy
    strategy = get_strategy(credential.auth_type)
    try:
        token = await strategy.fetch_token(credential.credential_data)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch token from connector auth endpoint: {str(e)}"
        )

    # 4. Cache and return
    await cache.set(workspace_id, connector_id, token)
    return TokenResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        connector_id=connector_id,
        workspace_id=workspace_id,
    )
```

### 10.2 Credential Management Endpoints (`routers/credentials.py`)

Used by the platform UI (or CLI locally) to register connector credentials per workspace.

```
POST   /credentials                         Register or update credentials
GET    /credentials/{workspace_id}          List all connectors for a workspace
DELETE /credentials/{workspace_id}/{connector_id}   Remove credentials
```

```python
@router.post("/credentials", status_code=201)
async def upsert_credential(
    body: CredentialUpsertRequest,
    _: None = Depends(verify_internal_key),
    store: CredentialStore = Depends(get_credential_store),
    cache: TokenCache = Depends(get_token_cache),
):
    credential = StoredCredential(
        workspace_id=body.workspace_id,
        connector_id=body.connector_id,
        auth_type=body.auth_type,
        credential_data=body.credential_data,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    await store.upsert(credential)
    # Invalidate any cached token so next request gets a fresh one
    await cache.invalidate(body.workspace_id, body.connector_id)
    return {"status": "ok"}
```

---

## 11. Credential Encryption at Rest

Even locally, credentials are encrypted before being written to SQLite. Uses `cryptography` Fernet (AES-128-CBC + HMAC-SHA256).

```python
# crypto.py
import os
from cryptography.fernet import Fernet

# ENCRYPTION_KEY must be set in .env
# Generate locally with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
_fernet = Fernet(os.environ["ENCRYPTION_KEY"].encode())

def encrypt(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    return _fernet.decrypt(ciphertext.encode()).decode()
```

---

## 12. Internal Authentication

MCP servers authenticate to the auth service using a shared internal API key passed as a Bearer token. Simple for local dev; in prod this would be mTLS or a short-lived service token.

```python
# dependencies.py
from fastapi import Header, HTTPException
from config import settings

async def verify_internal_key(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal API key")
```

---

## 13. FastAPI App (`main.py`)

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from store.sqlite_store import SQLiteCredentialStore
from cache.memory_cache import MemoryTokenCache
from routers import token, credentials
from config import settings

store = SQLiteCredentialStore(settings.sqlite_path)
cache = MemoryTokenCache()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await store._init_db()
    yield

app = FastAPI(title="Platform Auth Service", lifespan=lifespan)
app.include_router(token.router)
app.include_router(credentials.router)

# Inject store and cache into request state
@app.middleware("http")
async def inject_dependencies(request, call_next):
    request.state.store = store
    request.state.cache = cache
    return await call_next(request)
```

---

## 14. Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install uv && uv sync

COPY . .

RUN mkdir -p /app/data

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 15. Dependencies (`pyproject.toml`)

```toml
[project]
name = "platform-auth-service"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    "fastapi>=0.111",
    "uvicorn>=0.29",
    "pydantic>=2.0",
    "pydantic-settings>=2.0",
    "aiosqlite>=0.20",
    "httpx>=0.27",
    "cryptography>=42.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "httpx>=0.27",   # for FastAPI TestClient
]
```

---

## 16. Testing

### Token endpoint — cache hit

```python
async def test_token_cache_hit(client, seeded_cache):
    response = await client.get(
        "/token?workspace_id=ws_test&connector_id=aspire-field-management",
        headers={"Authorization": "Bearer local-dev-key"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"] == "cached-token"
```

### Token endpoint — cache miss, fetch fresh

```python
@respx.mock
async def test_token_fresh_fetch(client, seeded_credentials):
    respx.post("https://api.youraspire.com/oauth/token").mock(
        return_value=Response(200, json={
            "access_token": "fresh-token",
            "expires_in": 3600,
            "token_type": "Bearer"
        })
    )
    response = await client.get(
        "/token?workspace_id=ws_test&connector_id=aspire-field-management",
        headers={"Authorization": "Bearer local-dev-key"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"] == "fresh-token"
```

### Missing credentials — 404

```python
async def test_token_missing_credentials(client):
    response = await client.get(
        "/token?workspace_id=ws_unknown&connector_id=aspire-field-management",
        headers={"Authorization": "Bearer local-dev-key"}
    )
    assert response.status_code == 404
```

---

## 17. Local Setup — Seeding Aspire Credentials

On first run, register Aspire credentials for your local workspace via curl or a seed script:

```bash
curl -X POST http://localhost:8001/credentials \
  -H "Authorization: Bearer local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws_local",
    "connector_id": "aspire-field-management",
    "auth_type": "oauth2_client_credentials",
    "credential_data": {
      "client_id": "your-aspire-client-id",
      "client_secret": "your-aspire-client-secret",
      "token_url": "https://api.youraspire.com/oauth/token",
      "scopes": ["read", "write"]
    }
  }'
```

---

## 18. What Changes for Production

| Component         | Local                    | Prod                        |
| ----------------- | ------------------------ | --------------------------- |
| `CredentialStore` | `SQLiteCredentialStore`  | `SecretsManagerStore`       |
| `TokenCache`      | `MemoryTokenCache`       | `RedisTokenCache`           |
| Internal auth     | Shared API key in `.env` | mTLS or service token       |
| Encryption key    | `.env` file              | AWS KMS or equivalent       |
| Deployment        | Docker container         | Always-on service or Lambda |

The swap is entirely in `main.py` — the store and cache implementations are injected at startup based on `settings.env`. No other code changes.

---

## 19. Open Questions

1. **Workspace identity** — for local dev `workspace_id` is a hardcoded string. When the platform has real workspaces, this comes from the agent request context. No change needed in the auth service itself.
2. **Token refresh for long-running agents** — if an agent run exceeds the token TTL (Aspire tokens are ~1hr), the MCP server will call `/token` again mid-run and get a fresh one automatically. No special handling needed.
3. **Secret rotation** — if a workspace rotates their Aspire credentials, they call `POST /credentials` again. The cache is invalidated automatically on upsert.
