from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    database_url: str = "sqlite+aiosqlite:///./chat.db"
    max_upload_size_mb: int = 20
    rate_limit: str = "60/minute"
    secret_key: str = "change-me-in-production"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
