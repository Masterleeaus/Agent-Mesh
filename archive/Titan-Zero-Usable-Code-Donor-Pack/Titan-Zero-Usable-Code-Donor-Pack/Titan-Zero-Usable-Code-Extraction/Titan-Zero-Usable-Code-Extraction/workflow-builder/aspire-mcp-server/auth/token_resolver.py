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

    async def resolve_from_credentials(self, credentials: dict) -> str:
        """
        Resolve a token directly from client_id/client_secret credentials
        (bypasses Platform Auth Service — for direct credential injection).
        """
        token_url = "https://api.youraspire.com/oauth/token"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": credentials["client_id"],
                    "client_secret": credentials["client_secret"],
                    "scope": "read write",
                },
                timeout=10.0,
            )
        response.raise_for_status()
        return response.json()["access_token"]


# Module-level singleton
token_resolver = TokenResolver()
