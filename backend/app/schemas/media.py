"""Upload de media (MA-03)."""

from pydantic import BaseModel, Field


class MediaUploadOut(BaseModel):
    public_url: str = Field(..., description="URL do ficheiro (https ou http em dev; gravar em image_url ou tema)")