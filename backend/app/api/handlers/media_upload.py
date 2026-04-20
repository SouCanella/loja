"""Upload autenticado — imagens por loja (MA-03)."""

from fastapi import UploadFile

from app.core.config import get_settings
from app.models.user import User
from app.services.media_storage import public_https_url, save_store_image


async def upload_store_image(
    current: User,
    *,
    purpose: str,
    file: UploadFile,
    request_base_url: str,
) -> str:
    settings = get_settings()
    path_or_url = await save_store_image(
        settings=settings,
        store_id=current.store_id,
        purpose=purpose,
        upload=file,
    )
    return public_https_url(settings=settings, request_base_url=request_base_url, path_or_url=path_or_url)
