from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import os
import re
import base64

app = FastAPI(title="Ollama + Kokoro TTS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dist_path = "dist"
if os.path.exists(dist_path):
    app.mount("/static", StaticFiles(directory=dist_path), name="static")

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

KOKORO_URL    = os.getenv("KOKORO_URL",   "http://localhost:8880")
OLLAMA_URL    = os.getenv("OLLAMA_URL",   "http://localhost:11434")
DEFAULT_VOICE = os.getenv("KOKORO_VOICE", "ef_dora")

# Fin de oración: punto, interrogación, exclamación, o salto de línea
SENTENCE_END = re.compile(r'(?<=[.?!\n])\s*')


class PromptRequest(BaseModel):
    prompt: str
    model:  str = "llama3.2"
    tts:    bool = False
    voice:  str = DEFAULT_VOICE


@app.on_event("startup")
async def startup():
    app.state.http = httpx.AsyncClient(timeout=120.0)

@app.on_event("shutdown")
async def shutdown():
    await app.state.http.aclose()


# ─────────────────────────────────────────────
# UTILIDADES TTS
# ─────────────────────────────────────────────

async def kokoro_tts_bytes(text: str, voice: str) -> bytes:
    """Sintetiza una oración y devuelve PCM raw como bytes."""
    res = await app.state.http.post(
        f"{KOKORO_URL}/v1/audio/speech",
        json={
            "model": "kokoro",
            "input": text.strip(),
            "voice": voice,
            "response_format": "pcm",
            "speed": 1.0,
        },
    )
    res.raise_for_status()
    return res.content


def split_sentences(text: str) -> tuple[list[str], str]:
    """Extrae oraciones completas del buffer. Devuelve (completas, resto)."""
    parts = SENTENCE_END.split(text)
    if not parts:
        return [], text
    if text and text[-1] in ".?!\n":
        return [p for p in parts if p.strip()], ""
    return [p for p in parts[:-1] if p.strip()], parts[-1]


# ─────────────────────────────────────────────
# ENDPOINT 1: /generate — respuesta completa
# ─────────────────────────────────────────────

@app.post("/generate")
async def generate_response(request: PromptRequest):
    try:
        res = await app.state.http.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": request.model, "prompt": request.prompt, "stream": False},
        )
        res.raise_for_status()
        text = res.json()["response"].strip()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")

    if not request.tts:
        return {"response": text, "model": request.model}

    try:
        audio = await app.state.http.post(
            f"{KOKORO_URL}/v1/audio/speech",
            json={"model": "kokoro", "input": text, "voice": request.voice,
                  "response_format": "wav", "speed": 1.0},
        )
        audio.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Kokoro error: {e}")

    return StreamingResponse(iter([audio.content]), media_type="audio/wav",
                             headers={"X-Generated-Text": text[:300]})


# ─────────────────────────────────────────────
# ENDPOINT 2: /generate/stream — solo texto SSE
# ─────────────────────────────────────────────

@app.post("/generate/stream")
async def generate_stream(request: PromptRequest):
    async def sse_generator():
        try:
            async with app.state.http.stream(
                "POST", f"{OLLAMA_URL}/api/generate",
                json={"model": request.model, "prompt": request.prompt, "stream": True},
            ) as res:
                res.raise_for_status()
                async for line in res.aiter_lines():
                    if not line:
                        continue
                    try:
                        token = json.loads(line).get("response", "")
                        if token:
                            yield f"data: {token}\n\n"
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            yield f"data: [ERROR] {e}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ─────────────────────────────────────────────
# ENDPOINT 3: /generate/stream/both
#
# Un solo stream SSE que lleva DOS tipos de eventos:
#
#   event: text          → token de texto (igual que /generate/stream)
#   data: <token>
#
#   event: audio         → chunk de audio PCM codificado en base64
#   data: <base64>
#
#   event: done          → señal de fin
#   data: done
#
# Ventaja: Ollama se llama UNA sola vez. El servidor acumula
# tokens en un buffer, y cuando completa una oración la manda
# a Kokoro. Mientras espera el audio, el texto sigue llegando.
# ─────────────────────────────────────────────

@app.post("/generate/stream/both")
async def generate_stream_both(request: PromptRequest):
    async def both_generator():
        text_buffer = ""
        try:
            async with app.state.http.stream(
                "POST", f"{OLLAMA_URL}/api/generate",
                json={"model": request.model, "prompt": request.prompt, "stream": True},
            ) as res:
                res.raise_for_status()

                async for line in res.aiter_lines():
                    if not line:
                        continue
                    try:
                        token = json.loads(line).get("response", "")
                    except json.JSONDecodeError:
                        continue

                    if not token:
                        continue

                    # 1. Enviar el token de texto inmediatamente
                    yield f"event: text\ndata: {token}\n\n"

                    # 2. Acumular en buffer y detectar oraciones completas
                    text_buffer += token
                    sentences, text_buffer = split_sentences(text_buffer)

                    # 3. Sintetizar cada oración completa y enviar el audio
                    for sentence in sentences:
                        sentence = sentence.strip()
                        if not sentence:
                            continue
                        try:
                            pcm_bytes = await kokoro_tts_bytes(sentence, request.voice)
                            b64 = base64.b64encode(pcm_bytes).decode("ascii")
                            yield f"event: audio\ndata: {b64}\n\n"
                        except Exception as tts_err:
                            # Si Kokoro falla, simplemente omitimos ese chunk de audio
                            print(f"[TTS error] {tts_err}")

        except Exception as e:
            yield f"event: text\ndata: [ERROR] {e}\n\n"
            return

        # Sintetizar texto restante (sin puntuación al final)
        if text_buffer.strip():
            try:
                pcm_bytes = await kokoro_tts_bytes(text_buffer.strip(), request.voice)
                b64 = base64.b64encode(pcm_bytes).decode("ascii")
                yield f"event: audio\ndata: {b64}\n\n"
            except Exception:
                pass

        yield "event: done\ndata: done\n\n"

    return StreamingResponse(
        both_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ─────────────────────────────────────────────
# SPA routing
# ─────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    p = os.path.join(dist_path, "index.html")
    return FileResponse(p) if os.path.exists(p) else HTTPException(404)

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    p = os.path.join(dist_path, full_path)
    if os.path.exists(p) and os.path.isfile(p):
        return FileResponse(p)
    idx = os.path.join(dist_path, "index.html")
    return FileResponse(idx) if os.path.exists(idx) else HTTPException(404)


if __name__ == "__main__":
    import uvicorn
    os.makedirs(dist_path, exist_ok=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)