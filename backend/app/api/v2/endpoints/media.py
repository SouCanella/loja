"""Upload de imagens (MA-03) — envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile

from app.api.deps import get_current_user
from app.api.handlers import media_upload as media_handlers
from app.models.user import User
from app.schemas.envelope import MediaUploadEnvelope
from app.schemas.media import MediaUploadOut

router = APIRouter(tags=["media-v2"])


@router.post("/media/upload", response_model=MediaUploadEnvelope)
async def upload_media_v2(
    purpose: Annotated[str, Form(description="product | vitrine_logo | vitrine_hero")],
    file: Annotated[UploadFile, File()],
    request: Request,
    current: Annotated[User, Depends(get_current_user)],
) -> MediaUploadEnvelope:
    base = str(request.base_url)
    url = await media_handlers.upload_store_image(
        current,
        purpose=purpose.strip(),
        file=file,
        request_base_url=base,
    )
    return MediaUploadEnvelope(success=True, data=MediaUploadOut(public_url=url), errors=None)
