#!/usr/bin/env python3
"""Gera `doc/api/openapi.json` a partir do `app` FastAPI (sem servidor HTTP)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Raiz do pacote `backend/` no path
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402


def main() -> None:
    repo_root = BACKEND_ROOT.parent
    out = repo_root / "doc" / "api" / "openapi.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    out.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Escrito: {out}")


if __name__ == "__main__":
    main()
