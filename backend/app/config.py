from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    DATABASE_URL: str = "postgresql://user:password@localhost/ps_engagement_tracker"

    class Config:
        env_file = ".env"


settings = Settings()