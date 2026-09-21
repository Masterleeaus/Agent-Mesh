"""
Tests for Platform Auth Service main application

Tests API endpoints and authentication functionality.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
import tempfile
import os

# Import the FastAPI app
from main import app
from config import Settings


@pytest.fixture
def test_settings():
    """Create test settings with temporary database."""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as tmp:
        temp_db_path = tmp.name
    
    return Settings(
        env="test",
        sqlite_path=temp_db_path,
        encryption_key="test-key-32-bytes-base64-encoded==",
        internal_api_key="test-internal-key",
        redis_url=None  # Use memory cache for tests
    )


@pytest.fixture
async def client(test_settings):
    """Create test client with mocked settings."""
    with patch('main.get_settings', return_value=test_settings):
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac
    
    # Cleanup temp database
    if os.path.exists(test_settings.sqlite_path):
        os.unlink(test_settings.sqlite_path)


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "platform-auth-service"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_create_credential_success(client: AsyncClient):
    """Test successful credential creation."""
    headers = {"Authorization": "Bearer test-internal-key"}
    payload = {
        "workspace_id": "test-workspace",
        "connector_id": "test-connector",
        "auth_type": "oauth2_client_credentials",
        "credential_data": {
            "client_id": "test-client-id",
            "client_secret": "test-client-secret",
            "token_url": "https://api.test.com/oauth/token",
            "scopes": ["read", "write"]
        }
    }
    
    response = await client.post("/credentials", json=payload, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["workspace_id"] == "test-workspace"
    assert data["connector_id"] == "test-connector"
    assert data["auth_type"] == "oauth2_client_credentials"


@pytest.mark.asyncio
async def test_create_credential_unauthorized(client: AsyncClient):
    """Test credential creation with invalid auth."""
    headers = {"Authorization": "Bearer invalid-key"}
    payload = {
        "workspace_id": "test-workspace",
        "connector_id": "test-connector", 
        "auth_type": "oauth2_client_credentials",
        "credential_data": {
            "client_id": "test-client-id",
            "client_secret": "test-client-secret",
            "token_url": "https://api.test.com/oauth/token"
        }
    }
    
    response = await client.post("/credentials", json=payload, headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_credential_invalid_data(client: AsyncClient):
    """Test credential creation with invalid data."""
    headers = {"Authorization": "Bearer test-internal-key"}
    payload = {
        "workspace_id": "test-workspace",
        "connector_id": "test-connector",
        "auth_type": "oauth2_client_credentials",
        "credential_data": {
            # Missing required fields
            "client_id": "test-client-id"
        }
    }
    
    response = await client.post("/credentials", json=payload, headers=headers)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_get_credentials(client: AsyncClient):
    """Test getting workspace credentials."""
    # First create a credential
    headers = {"Authorization": "Bearer test-internal-key"}
    payload = {
        "workspace_id": "test-workspace",
        "connector_id": "test-connector",
        "auth_type": "api_key",
        "credential_data": {
            "api_key": "test-api-key"
        }
    }
    
    await client.post("/credentials", json=payload, headers=headers)
    
    # Now get credentials for the workspace
    response = await client.get("/credentials/test-workspace", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["workspace_id"] == "test-workspace"
    assert len(data["credentials"]) == 1
    assert data["credentials"][0]["connector_id"] == "test-connector"


@pytest.mark.asyncio 
async def test_get_token_no_credential(client: AsyncClient):
    """Test getting token when no credential exists."""
    headers = {"Authorization": "Bearer test-internal-key"}
    
    response = await client.get(
        "/token?workspace_id=nonexistent&connector_id=nonexistent",
        headers=headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_credential(client: AsyncClient):
    """Test credential deletion."""
    headers = {"Authorization": "Bearer test-internal-key"}
    
    # First create a credential
    payload = {
        "workspace_id": "test-workspace",
        "connector_id": "test-connector",
        "auth_type": "api_key", 
        "credential_data": {
            "api_key": "test-api-key"
        }
    }
    await client.post("/credentials", json=payload, headers=headers)
    
    # Delete the credential
    response = await client.delete(
        "/credentials/test-workspace/test-connector",
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify it's gone
    response = await client.get("/credentials/test-workspace", headers=headers)
    data = response.json()
    assert len(data["credentials"]) == 0


@pytest.mark.asyncio
async def test_missing_auth_header(client: AsyncClient):
    """Test request without authorization header."""
    response = await client.get("/credentials/test-workspace")
    assert response.status_code == 422  # Missing header


@pytest.mark.asyncio
async def test_invalid_auth_header_format(client: AsyncClient):
    """Test request with invalid authorization header format."""
    headers = {"Authorization": "Invalid format"}
    
    response = await client.get("/credentials/test-workspace", headers=headers)
    assert response.status_code == 401