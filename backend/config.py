from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql://localhost:5432/crm_pipeline"
    api_key: str = ""
    public_demo: bool = False
    cors_origins: list[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()

