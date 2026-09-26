from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Frontend URL
    FRONTEND_URL: str

    # AES-256 key (base64, 32 bytes) for encrypting stored credentials
    ENCRYPTION_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
