"""API FastAPI — loja (multi-tenant)."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router as api_router_v1
from app.api.v2.router import api_router as api_router_v2
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    description=(
        "Backend multi-tenant — `/api/v1` JSON directo; `/api/v2` piloto envelope DEC-06."
    ),
    openapi_url="/openapi.json",
    docs_url=None,  # sem Swagger UI; ver `doc/api/` (offline) ou `/redoc` com API no ar
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def envelope_http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if request.url.path.startswith("/api/v2"):
        detail = exc.detail
        msg = detail if isinstance(detail, str) else str(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "data": None,
                "errors": [{"message": msg, "code": str(exc.status_code), "field": None}],
            },
        )
    return await http_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def envelope_validation_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    if request.url.path.startswith("/api/v2"):
        errors: list[dict[str, str | None]] = []
        for e in exc.errors():
            loc = e.get("loc") or ()
            field = ".".join(str(x) for x in loc if x != "body")
            errors.append(
                {
                    "message": str(e.get("msg", "validation error")),
                    "code": str(e.get("type", "")),
                    "field": field or None,
                }
            )
        return JSONResponse(
            status_code=422,
            content={"success": False, "data": None, "errors": errors},
        )
    return await request_validation_exception_handler(request, exc)


app.include_router(api_router_v1, prefix="/api/v1")
app.include_router(api_router_v2, prefix="/api/v2")


@app.get("/health")
def health() -> dict[str, str]:
    """Smoke check (compatível com Fase 0 / Docker)."""
    return {"status": "ok"}
