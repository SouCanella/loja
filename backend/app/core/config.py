"""Configuração da aplicação (variáveis de ambiente)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Loja API"
    debug: bool = False

    database_url: str = "postgresql+psycopg://loja:loja@localhost:5432/loja_dev"

    # JWT access (DEC-16); usar segredo forte em produção
    jwt_secret: str = "change-me-in-production-use-openssl-rand"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 14

    # POST /auth/login — tentativas por IP e janela (segundos)
    login_rate_limit_max_attempts: int = 20
    login_rate_limit_window_seconds: int = 120


@lru_cache
def get_settings() -> Settings:
    return Settings()
