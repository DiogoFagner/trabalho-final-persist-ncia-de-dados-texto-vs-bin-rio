"""
Backend de Persistência — Trabalho Final (Texto vs Binário)
============================================================

API FastAPI que:
  - Baixa dados de uma API externa (PokéAPI) e devolve ao frontend (/carregar)
  - Salva os dados em 4 formatos simultaneamente: JSON, CSV, Pickle, Struct (/salvar)
  - Lê os dados a partir do arquivo salvo localmente (/offline)
  - Compara metadados (tamanho em KB e tempo) + amostras texto/hexdump (/comparar)

Como rodar:
    python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\\Scripts\\activate)
    pip install fastapi "uvicorn[standard]" httpx
    python main.py
    # API em http://localhost:8000  (docs: http://localhost:8000/docs)

Os arquivos são gravados em ./dados/  (criada automaticamente).
"""
from __future__ import annotations

import csv
import io
import json
import os
import pickle
import struct
import time
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent / "dados"
BASE_DIR.mkdir(exist_ok=True)

FILE_JSON   = BASE_DIR / "dados.json"
FILE_CSV    = BASE_DIR / "dados.csv"
FILE_PICKLE = BASE_DIR / "dados.pkl"
FILE_STRUCT = BASE_DIR / "dados.bin"

# layout do registro binário (struct):
#   - label: 32 bytes ASCII (padded com \0)
#   - value: double (8 bytes)
# total: 40 bytes por registro
STRUCT_FORMAT = "32sd"
STRUCT_SIZE = struct.calcsize(STRUCT_FORMAT)

POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon"
DEFAULT_LIMIT = 50

# ---------------------------------------------------------------------------
# FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(title="Persistência: Texto vs Binário", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # libera tudo (apenas para o trabalho acadêmico)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DataItem(BaseModel):
    label: str
    value: float
    image: str | None = None


class SaveBody(BaseModel):
    items: list[DataItem]


# ---------------------------------------------------------------------------
# Helpers de persistência
# ---------------------------------------------------------------------------
def _save_json(items: list[dict]) -> float:
    t0 = time.perf_counter()
    with open(FILE_JSON, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    return (time.perf_counter() - t0) * 1000


def _load_json() -> tuple[list[dict], float]:
    t0 = time.perf_counter()
    with open(FILE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data, (time.perf_counter() - t0) * 1000


def _save_csv(items: list[dict]) -> float:
    t0 = time.perf_counter()
    with open(FILE_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["label", "value", "image"])
        writer.writeheader()
        for it in items:
            writer.writerow({"label": it["label"], "value": it["value"], "image": it.get("image") or ""})
    return (time.perf_counter() - t0) * 1000


def _load_csv() -> tuple[list[dict], float]:
    t0 = time.perf_counter()
    with open(FILE_CSV, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = [{"label": r["label"], "value": float(r["value"]), "image": r["image"] or None} for r in reader]
    return rows, (time.perf_counter() - t0) * 1000


def _save_pickle(items: list[dict]) -> float:
    t0 = time.perf_counter()
    with open(FILE_PICKLE, "wb") as f:
        pickle.dump(items, f, protocol=pickle.HIGHEST_PROTOCOL)
    return (time.perf_counter() - t0) * 1000


def _load_pickle() -> tuple[list[dict], float]:
    t0 = time.perf_counter()
    with open(FILE_PICKLE, "rb") as f:
        data = pickle.load(f)
    return data, (time.perf_counter() - t0) * 1000


def _save_struct(items: list[dict]) -> float:
    t0 = time.perf_counter()
    with open(FILE_STRUCT, "wb") as f:
        for it in items:
            label_bytes = it["label"].encode("utf-8")[:32].ljust(32, b"\0")
            f.write(struct.pack(STRUCT_FORMAT, label_bytes, float(it["value"])))
    return (time.perf_counter() - t0) * 1000


def _load_struct() -> tuple[list[dict], float]:
    t0 = time.perf_counter()
    items: list[dict] = []
    with open(FILE_STRUCT, "rb") as f:
        while chunk := f.read(STRUCT_SIZE):
            if len(chunk) < STRUCT_SIZE:
                break
            label_bytes, value = struct.unpack(STRUCT_FORMAT, chunk)
            label = label_bytes.rstrip(b"\0").decode("utf-8", errors="replace")
            items.append({"label": label, "value": value, "image": None})
    return items, (time.perf_counter() - t0) * 1000


def _hexdump(path: Path, length: int = 256) -> str:
    """Hexdump clássico: offset | bytes em hex | representação ASCII."""
    if not path.exists():
        return "(arquivo não existe)"
    with open(path, "rb") as f:
        data = f.read(length)
    lines: list[str] = []
    for offset in range(0, len(data), 16):
        chunk = data[offset:offset + 16]
        hex_part = " ".join(f"{b:02x}" for b in chunk).ljust(16 * 3 - 1)
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        lines.append(f"{offset:08x}  {hex_part}  |{ascii_part}|")
    if path.stat().st_size > length:
        lines.append(f"... ({path.stat().st_size - length} bytes restantes)")
    return "\n".join(lines)


def _text_preview(path: Path, max_chars: int = 800) -> str:
    if not path.exists():
        return "(arquivo não existe)"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read(max_chars + 1)
    if len(content) > max_chars:
        return content[:max_chars] + "\n... (truncado)"
    return content


def _kb(path: Path) -> float:
    return round(path.stat().st_size / 1024, 3) if path.exists() else 0.0


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "ok": True,
        "service": "Persistência Texto vs Binário",
        "endpoints": ["/carregar", "/salvar", "/offline", "/comparar"],
        "data_dir": str(BASE_DIR),
    }


@app.get("/carregar")
def carregar(limit: int = DEFAULT_LIMIT):
    """Baixa dados da PokéAPI, devolve ao frontend e salva em cache JSON."""
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(POKEAPI_URL, params={"limit": limit})
            r.raise_for_status()
            results = r.json()["results"]

            items: list[dict] = []
            for p in results:
                d = client.get(p["url"]).json()
                items.append({
                    "label": d["name"],
                    "value": float(d.get("weight", 0)),
                    "image": (d.get("sprites") or {}).get("front_default"),
                })
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Falha ao consultar API externa: {e}")

    # cache automático em JSON para permitir modo offline
    try:
        _save_json(items)
    except OSError as e:
        # cache não é crítico — segue o jogo
        print(f"[warn] não consegui salvar cache JSON: {e}")

    return items


@app.post("/salvar")
def salvar(body: SaveBody):
    """Grava os dados em disco nos 4 formatos simultaneamente."""
    if not body.items:
        raise HTTPException(status_code=400, detail="Lista de itens vazia.")

    items = [it.model_dump() for it in body.items]
    try:
        _save_json(items)
        _save_csv(items)
        _save_pickle(items)
        _save_struct(items)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gravar arquivos: {e}")

    return {"ok": True, "count": len(items), "dir": str(BASE_DIR)}


@app.get("/offline")
def offline():
    """Lê os dados do arquivo salvo localmente (JSON)."""
    if not FILE_JSON.exists():
        raise HTTPException(
            status_code=404,
            detail="Arquivo dados.json ainda não existe. Chame /carregar ou /salvar primeiro.",
        )
    try:
        data, _ = _load_json()
        return data
    except (OSError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler arquivo offline: {e}")


@app.get("/comparar")
def comparar():
    """Retorna metadados (tamanho/tempo) + amostras texto e hexdump."""
    if not FILE_JSON.exists():
        raise HTTPException(
            status_code=404,
            detail="Nenhum arquivo salvo. Chame /salvar antes de comparar.",
        )

    # tempos de carregamento (re-mede agora) e tempos de salvamento (re-grava)
    try:
        items, _ = _load_json()  # carrega os dados atuais para regravar
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Não consegui ler dados.json: {e}")

    save_json_ms   = _save_json(items)
    save_csv_ms    = _save_csv(items)
    save_pickle_ms = _save_pickle(items)
    save_struct_ms = _save_struct(items)

    _, load_json_ms   = _load_json()
    _, load_csv_ms    = _load_csv()
    _, load_pickle_ms = _load_pickle()
    _, load_struct_ms = _load_struct()

    formats = [
        {"format": "json",   "kind": "texto",   "filename": FILE_JSON.name,
         "size_kb": _kb(FILE_JSON),   "save_ms": save_json_ms,   "load_ms": load_json_ms},
        {"format": "csv",    "kind": "texto",   "filename": FILE_CSV.name,
         "size_kb": _kb(FILE_CSV),    "save_ms": save_csv_ms,    "load_ms": load_csv_ms},
        {"format": "pickle", "kind": "binario", "filename": FILE_PICKLE.name,
         "size_kb": _kb(FILE_PICKLE), "save_ms": save_pickle_ms, "load_ms": load_pickle_ms},
        {"format": "struct", "kind": "binario", "filename": FILE_STRUCT.name,
         "size_kb": _kb(FILE_STRUCT), "save_ms": save_struct_ms, "load_ms": load_struct_ms},
    ]

    return {
        "formats": formats,
        "text_preview": _text_preview(FILE_JSON),
        "csv_preview": _text_preview(FILE_CSV),
        "hex_preview": _hexdump(FILE_STRUCT),
        "pickle_hex_preview": _hexdump(FILE_PICKLE),
    }


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
