from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    supabase_url: str = ""
    supabase_key: str = ""
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,https://*.vercel.app"

    class Config:
        env_file = ".env"


settings = Settings()
