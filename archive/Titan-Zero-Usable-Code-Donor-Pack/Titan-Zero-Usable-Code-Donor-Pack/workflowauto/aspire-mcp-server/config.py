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

    # Server identity
    server_name: str = "aspire-field-management"
    server_version: str = "1.0.0"

    class Config:
        env_file = ".env"


settings = Settings()
