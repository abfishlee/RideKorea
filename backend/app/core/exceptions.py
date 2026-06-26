"""Domain exception hierarchy and FastAPI handler registration.

Services raise semantic exceptions (``NotFoundError``, ``PermissionDeniedError``,
``ValidationError``, ``UnauthorizedError``) that carry no HTTP knowledge. A single
set of handlers maps them to HTTP responses, so routers stay thin and error
shapes stay consistent across the API.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base class for all application/domain errors."""
    status_code: int = status.HTTP_400_BAD_REQUEST
    default_detail: str = "Application error"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found"


class PermissionDeniedError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action"


class ValidationError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid request"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Could not validate credentials"


def register_exception_handlers(app) -> None:
    """Attach a single handler that renders any AppError uniformly."""

    @app.exception_handler(AppError)
    async def _handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        headers = None
        if isinstance(exc, UnauthorizedError):
            headers = {"WWW-Authenticate": "Bearer"}
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=headers,
        )
