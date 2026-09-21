"""
Configuration management for Platform Auth Service

Uses Pydantic Settings for environment variable management with validation.
"""

from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Environment
    env: str = Field(default="development", env="ENV")
    
    # Database
    sqlite_path: str = Field(default="/data/credentials.db", env="SQLITE_PATH")
    
    # Security
    encryption_key: str = Field(..., env="ENCRYPTION_KEY")
    internal_api_key: str = Field(default="local-dev-key", env="INTERNAL_API_KEY")
    
    # Redis (optional for token caching)
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # Token settings
    token_cache_ttl: int = Field(default=3600, env="TOKEN_CACHE_TTL")  # 1 hour
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get the current settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Validate encryption key format on startup
def validate_encryption_key(key: str) -> bool:
    """Validate that the encryption key is properly formatted."""
    try:
        from cryptography.fernet import Fernet
        Fernet(key.encode())
        return True
    except Exception:
        return False


def ensure_data_directory():
    """Ensure the data directory exists for SQLite database."""
    settings = get_settings()
    data_dir = os.path.dirname(settings.sqlite_path)
    if data_dir and not os.path.exists(data_dir):
        os.makedirs(data_dir, mode=0o755)


# Validate settings on module import
settings = get_settings()
if not validate_encryption_key(settings.encryption_key):
    raise ValueError(
        "Invalid ENCRYPTION_KEY. Generate with: "
        "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    )

ensure_data_directory()