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

    # POST /public/stores/{slug}/orders — por chave IP|store_id
    public_order_rate_limit_max_attempts: int = 30
    public_order_rate_limit_window_seconds: int = 120

    # CORS — origens extra (vírgulas), ex.: vitrine no telemóvel na LAN
    # `http://192.168.1.10:3000`
    cors_extra_origins: str = ""

    # Media / MA-03 — upload de imagens (prefixo por loja)
    media_backend: str = "local"
    media_root: str = "var/media"
    # Base URL pública (sem / final) para URLs https dos uploads locais; vazio = derivar do pedido HTTP
    public_base_url: str = ""
    s3_bucket: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_endpoint_url: str = ""
    s3_public_base_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
