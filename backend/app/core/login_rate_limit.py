"""Limite simples por IP para POST /auth/login (anti brute-force)."""

from collections import defaultdict
from threading import Lock
from time import time

from fastapi import HTTPException, status

_lock = Lock()
_attempts: dict[str, list[float]] = defaultdict(list)


def register_login_attempt(client_ip: str, *, max_attempts: int, window_seconds: int) -> None:
    now = time()
    with _lock:
        win = _attempts[client_ip]
        win[:] = [t for t in win if now - t < window_seconds]
        if len(win) >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas tentativas de login. Aguarde e tente novamente.",
            )
        win.append(now)
