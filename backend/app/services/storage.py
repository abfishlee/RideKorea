"""Pluggable media storage.

The diary photo upload path depends only on the :class:`StorageBackend`
interface, not on the local filesystem directly. Today the sole implementation
is :class:`LocalStorage` (FastAPI StaticFiles), but the deployment docs call for
migrating to MinIO / S3-compatible object storage. When that happens, add an
``S3Storage`` backend and switch ``settings.STORAGE_BACKEND`` -- no service or
router changes required.
"""
from __future__ import annotations

import os
import uuid
from abc import ABC, abstractmethod
from typing import BinaryIO

from ..config import settings
from ..core.constants import ALLOWED_IMAGE_EXTENSIONS
from ..core.exceptions import ValidationError


class StorageBackend(ABC):
    @abstractmethod
    def save_image(self, file_obj: BinaryIO, original_filename: str) -> str:
        """Persist an uploaded image and return a publicly accessible URL/path."""
        raise NotImplementedError

    @staticmethod
    def _validate_and_ext(original_filename: str) -> str:
        ext = os.path.splitext(original_filename or "")[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise ValidationError(f"Unsupported file type: {ext or '(none)'}")
        return ext


class LocalStorage(StorageBackend):
    """Stores files under ``settings.UPLOAD_DIR`` served at ``/uploads/<name>``."""

    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_image(self, file_obj: BinaryIO, original_filename: str) -> str:
        ext = self._validate_and_ext(original_filename)
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(self.upload_dir, unique_name)
        written = 0
        with open(file_path, "wb") as buffer:
            while chunk := file_obj.read(1024 * 1024):
                written += len(chunk)
                if written > settings.MAX_IMAGE_UPLOAD_BYTES:
                    buffer.close()
                    os.remove(file_path)
                    raise ValidationError("Uploaded image is too large")
                buffer.write(chunk)
        return f"/uploads/{unique_name}"


_BACKENDS = {
    "local": LocalStorage,
    # "s3": S3Storage,  # future: MinIO / S3-compatible object storage
}


def get_storage() -> StorageBackend:
    backend_cls = _BACKENDS.get(settings.STORAGE_BACKEND, LocalStorage)
    return backend_cls()
