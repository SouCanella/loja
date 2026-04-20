"""Limite por IP + loja para POST pedido público (vitrine)."""

from collections import defaultdict
from threading import Lock
from time import time

from fastapi import HTTPException, status

_lock = Lock()
_attempts: dict[str, list[float]] = defaultdict(list)


def register_public_order_attempt(
    key: str,
    *,
    max_attempts: int,
    window_seconds: int,
) -> None:
    now = time()
    with _lock:
        win = _attempts[key]
        win[:] = [t for t in win if now - t < window_seconds]
        if len(win) >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados pedidos. Aguarde e tente novamente.",
            )
        win.append(now)
