"""假 395：/health、/v1/ocr/page（延迟可调、记每页哈希、记被断开次数）、/stats、/cfg。只听 127.0.0.1。"""
import asyncio
import hashlib
import sys
import time

import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

S = {"delay": 2.0, "calls": [], "cancelled": 0, "started": 0, "done": 0}


async def health(r):
    return JSONResponse({"status": "ok"})


async def page(r: Request):
    if r.headers.get("authorization") != "Bearer sk-lab-fake-c18":
        return JSONResponse({"error": {"code": "K", "message": "k"}}, status_code=401)
    body = await r.body()
    sha = hashlib.sha256(body).hexdigest()
    S["started"] += 1
    S["calls"].append({"sha": sha[:12], "t": time.time()})
    try:
        await asyncio.sleep(S["delay"])
    except asyncio.CancelledError:
        S["cancelled"] += 1
        raise
    if await r.is_disconnected():
        S["cancelled"] += 1
    S["done"] += 1
    return JSONResponse({"markdown": f"识别文本 {sha[:12]}", "unclear": 0, "elapsed_ms": 1, "backend": "fake",
                         "image_png_base64": None})


async def stats(r):
    return JSONResponse(S)


async def cfg(r: Request):
    d = await r.json()
    S.update(d)
    return JSONResponse(S)


app = Starlette(routes=[Route("/health", health), Route("/v1/ocr/page", page, methods=["POST"]),
                        Route("/stats", stats), Route("/cfg", cfg, methods=["POST"])])
uvicorn.run(app, host="127.0.0.1", port=int(sys.argv[1]), log_level="warning", access_log=False, log_config=None)
