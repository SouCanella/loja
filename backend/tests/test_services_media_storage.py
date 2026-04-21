"""Testes unitários — `app.services.media_storage` (local, S3, URLs públicas)."""

from __future__ import annotations

import asyncio
import uuid
from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings
from app.services import media_storage as ms
from botocore.exceptions import ClientError
from fastapi import HTTPException
from starlette.datastructures import UploadFile


def _upload(content: bytes, content_type: str, filename: str = "f.jpg") -> UploadFile:
    return UploadFile(BytesIO(content), filename=filename, headers={"content-type": content_type})


def _run(coro):
    return asyncio.run(coro)


def test_save_store_image_rejects_invalid_purpose(tmp_path) -> None:
    settings = Settings(media_backend="local", media_root=str(tmp_path))
    with pytest.raises(HTTPException) as ei:
        _run(
            ms.save_store_image(
                settings=settings,
                store_id=uuid.uuid4(),
                purpose="invalid",
                upload=_upload(b"x", "image/jpeg"),
            )
        )
    assert ei.value.status_code == 400


def test_save_store_image_rejects_oversize(tmp_path) -> None:
    settings = Settings(media_backend="local", media_root=str(tmp_path))
    big = b"x" * (5 * 1024 * 1024 + 1)
    with pytest.raises(HTTPException) as ei:
        _run(
            ms.save_store_image(
                settings=settings,
                store_id=uuid.uuid4(),
                purpose="product",
                upload=_upload(big, "image/jpeg"),
            )
        )
    assert ei.value.status_code == 400


def test_save_store_image_dispatches_to_s3(monkeypatch, tmp_path) -> None:
    settings = Settings(
        media_backend="s3",
        media_root=str(tmp_path),
        s3_bucket="b",
        aws_region="us-east-1",
    )

    def _fake_s3(s, store_id, key_suffix, data, ct):
        assert "product/" in key_suffix
        return "https://cdn/x"

    monkeypatch.setattr(ms, "_save_s3", _fake_s3)
    up = _upload(b"\xff\xd8\xff\xd9", "image/jpeg")
    sid = uuid.uuid4()
    out = _run(
        ms.save_store_image(settings=settings, store_id=sid, purpose="product", upload=up)
    )
    assert out == "https://cdn/x"


def test_save_store_image_rejects_unsupported_mime(tmp_path) -> None:
    settings = Settings(media_backend="local", media_root=str(tmp_path))
    with pytest.raises(HTTPException) as ei:
        _run(
            ms.save_store_image(
                settings=settings,
                store_id=uuid.uuid4(),
                purpose="product",
                upload=_upload(b"x", "image/gif"),
            )
        )
    assert ei.value.status_code == 400


def test_save_store_image_accepts_mime_with_charset(tmp_path) -> None:
    settings = Settings(media_backend="local", media_root=str(tmp_path))
    up = UploadFile(
        BytesIO(b"\xff\xd8\xff\xd9"),
        filename="a.jpg",
        headers={"content-type": "image/jpeg; charset=utf-8"},
    )
    sid = uuid.uuid4()
    url = _run(ms.save_store_image(settings=settings, store_id=sid, purpose="product", upload=up))
    assert url.startswith(f"/media/{sid}/")


def test_save_local_writes_file_and_normalizes_backslashes(tmp_path) -> None:
    settings = Settings(media_backend="local", media_root=str(tmp_path))
    sid = uuid.uuid4()
    url = ms._save_local(settings, sid, r"product\abc.jpg", b"hi")
    assert "/product/abc.jpg" in url.replace("\\", "/")
    # Em POSIX o segmento com `\` é um único nome de ficheiro (não é subpasta).
    written = Path(settings.media_root) / str(sid) / r"product\abc.jpg"
    assert written.read_bytes() == b"hi"


def test_save_s3_missing_bucket_raises_503() -> None:
    settings = Settings(
        media_backend="s3",
        media_root="var/media",
        s3_bucket="",
        aws_region="us-east-1",
    )
    with pytest.raises(HTTPException) as ei:
        ms._save_s3(settings, uuid.uuid4(), "product/x.jpg", b"d", "image/jpeg")
    assert ei.value.status_code == 503


def test_save_s3_success_with_public_base_url() -> None:
    settings = Settings(
        media_backend="s3",
        s3_bucket="myb",
        aws_region="eu-west-1",
        s3_public_base_url=" https://cdn.example.com/ ",
    )
    sid = uuid.uuid4()
    mock_client = MagicMock()
    mock_session = MagicMock()
    mock_session.client.return_value = mock_client
    with patch("boto3.session.Session", return_value=mock_session):
        url = ms._save_s3(settings, sid, "product/x.jpg", b"d", "image/jpeg")
    assert url == f"https://cdn.example.com/stores/{sid}/product/x.jpg"
    mock_client.put_object.assert_called_once()


def test_save_s3_success_default_aws_host() -> None:
    settings = Settings(
        media_backend="s3",
        s3_bucket="buck",
        aws_region="sa-east-1",
        s3_public_base_url="",
    )
    sid = uuid.uuid4()
    mock_client = MagicMock()
    mock_session = MagicMock()
    mock_session.client.return_value = mock_client
    with patch("boto3.session.Session", return_value=mock_session):
        url = ms._save_s3(settings, sid, "hero/y.png", b"d", "image/png")
    assert url == f"https://buck.s3.sa-east-1.amazonaws.com/stores/{sid}/hero/y.png"


def test_save_s3_put_object_failure_502() -> None:
    settings = Settings(media_backend="s3", s3_bucket="b", aws_region="us-east-1")
    mock_client = MagicMock()
    mock_client.put_object.side_effect = ClientError({"Error": {"Code": "500"}}, "PutObject")
    mock_session = MagicMock()
    mock_session.client.return_value = mock_client
    with patch("boto3.session.Session", return_value=mock_session):
        with pytest.raises(HTTPException) as ei:
            ms._save_s3(settings, uuid.uuid4(), "p/x.jpg", b"d", "image/jpeg")
    assert ei.value.status_code == 502


def test_public_https_url_variants() -> None:
    s = Settings(public_base_url="https://api.app")
    got = ms.public_https_url(
        settings=s, request_base_url="http://x", path_or_url="https://z/c"
    )
    assert got == "https://z/c"
    got2 = ms.public_https_url(
        settings=s, request_base_url="http://x", path_or_url="http://local/minio/x"
    )
    assert got2 == "http://local/minio/x"
    got3 = ms.public_https_url(
        settings=s, request_base_url="http://x", path_or_url="  /media/a  "
    )
    assert got3 == "https://api.app/media/a"
    s2 = Settings(public_base_url="")
    assert (
        ms.public_https_url(settings=s2, request_base_url="https://req", path_or_url="rel/x")
        == "https://req/rel/x"
    )


def test_local_file_path_non_local_returns_none(tmp_path) -> None:
    s = Settings(media_backend="s3", media_root=str(tmp_path))
    assert ms.local_file_path(s, uuid.uuid4(), "a/b.jpg") is None


def test_local_file_path_rejects_symlink_outside_store_root(tmp_path) -> None:
    media = tmp_path / "media"
    sid = uuid.uuid4()
    store_dir = media / str(sid)
    store_dir.mkdir(parents=True)
    outside = tmp_path / "outside"
    outside.mkdir()
    f = outside / "a.jpg"
    f.write_bytes(b"x")
    (store_dir / "esc").symlink_to(f.resolve())
    s = Settings(media_backend="local", media_root=str(media))
    assert ms.local_file_path(s, sid, "esc") is None


def test_local_file_path_rejects_traversal_and_missing(tmp_path) -> None:
    root = tmp_path / "mr"
    root.mkdir()
    sid = uuid.uuid4()
    safe = root / str(sid) / "p"
    safe.mkdir(parents=True)
    f = safe / "ok.jpg"
    f.write_bytes(b"x")
    s = Settings(media_backend="local", media_root=str(root))
    assert ms.local_file_path(s, sid, "p/ok.jpg") == f.resolve()
    assert ms.local_file_path(s, sid, "") is None
    assert ms.local_file_path(s, sid, "../x") is None
    assert ms.local_file_path(s, sid, "p/nope.jpg") is None
    (safe / "subdir").mkdir()
    assert ms.local_file_path(s, sid, "p/subdir") is None
