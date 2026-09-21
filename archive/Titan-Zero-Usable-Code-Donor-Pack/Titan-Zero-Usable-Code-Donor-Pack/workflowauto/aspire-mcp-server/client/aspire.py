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

    async def _request(self, method: str, token: str, path: str, **kwargs) -> dict:
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
