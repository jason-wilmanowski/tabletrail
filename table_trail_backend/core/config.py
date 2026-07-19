from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # Database
    DATABASE_URL : str

    # Frontend URL
    FRONTEND_URL : str

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()