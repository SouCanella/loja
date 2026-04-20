"""Armazenamento de imagens (MA-03) — local ou S3-compatível, isolado por loja."""

from __future__ import annotations

import uuid
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings

ALLOWED_PURPOSES = frozenset({"product", "vitrine_logo", "vitrine_hero"})
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

_CT_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _ext_for_content_type(ct: str) -> str | None:
    c = ct.split(";")[0].strip().lower()
    return _CT_EXT.get(c)


async def save_store_image(
    *,
    settings: Settings,
    store_id: UUID,
    purpose: str,
    upload: UploadFile,
) -> str:
    """Valida e grava a imagem; devolve URL pública https (para gravar em produto/tema)."""
    if purpose not in ALLOWED_PURPOSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de upload inválido (use product, vitrine_logo ou vitrine_hero).",
        )
    raw = await upload.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ficheiro demasiado grande (máx. {MAX_BYTES // (1024 * 1024)} MB).",
        )
    ct = upload.content_type or "application/octet-stream"
    ext = _ext_for_content_type(ct)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato não suportado (use JPEG, PNG ou WebP).",
        )

    file_id = uuid.uuid4().hex
    key_suffix = f"{purpose}/{file_id}{ext}"

    if settings.media_backend.lower() == "s3":
        return _save_s3(settings, store_id, key_suffix, raw, ct)

    return _save_local(settings, store_id, key_suffix, raw)


def _save_local(settings: Settings, store_id: UUID, relative_path: str, data: bytes) -> str:
    root = Path(settings.media_root)
    dest = root / str(store_id) / relative_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    # URL pública servida em GET /media/{store_id}/{path} — path pode ter subpastas
    safe_rel = relative_path.replace("\\", "/")
    return f"/media/{store_id}/{safe_rel}"


def _save_s3(settings: Settings, store_id: UUID, key_suffix: str, data: bytes, content_type: str) -> str:
    if not settings.s3_bucket:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Armazenamento S3 não configurado (S3_BUCKET).",
        )
    try:
        import boto3  # type: ignore[import-untyped]
        from botocore.exceptions import BotoCoreError, ClientError  # type: ignore[import-untyped]
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dependência boto3 não instalada para modo S3.",
        ) from e

    key = f"stores/{store_id}/{key_suffix}"
    session = boto3.session.Session(
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
        region_name=settings.aws_region,
    )
    client = session.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url or None,
    )
    try:
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    except (ClientError, BotoCoreError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao enviar para o armazenamento: {e!s}",
        ) from e

    if settings.s3_public_base_url.strip():
        base = settings.s3_public_base_url.strip().rstrip("/")
        return f"{base}/{key}"

    return f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def public_https_url(*, settings: Settings, request_base_url: str, path_or_url: str) -> str:
    """Garante URL https absoluta para a vitrine e o painel."""
    path_or_url = path_or_url.strip()
    if path_or_url.startswith("https://"):
        return path_or_url
    if path_or_url.startswith("http://"):
        # S3/MinIO pode devolver http em dev — aceitar
        return path_or_url
    # path relativo /media/...
    base = settings.public_base_url.strip().rstrip("/")
    if not base:
        base = request_base_url.rstrip("/")
    if path_or_url.startswith("/"):
        return f"{base}{path_or_url}"
    return f"{base}/{path_or_url}"


def local_file_path(settings: Settings, store_id: UUID, relative: str) -> Path | None:
    """Resolve caminho em disco para servir GET /media (apenas backend local)."""
    if settings.media_backend.lower() != "local":
        return None
    rel = relative.replace("\\", "/").strip("/")
    if not rel or ".." in rel.split("/"):
        return None
    root = Path(settings.media_root).resolve() / str(store_id)
    candidate = (root / rel).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    if not candidate.is_file():
        return None
    return candidate
