from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import subprocess
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Ollama CLI API Server with Streaming")

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


class PromptRequest(BaseModel):
    prompt: str
    model: str = "llama3.2"


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="index.html not found in dist/")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = os.path.join(dist_path, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="File not found")


# ─────────────────────────────────────────────
# ENDPOINT DE STREAM CORREGIDO
# ─────────────────────────────────────────────
@app.post("/generate/stream")
async def generate_stream(request: PromptRequest):
    async def stream_generator():
        try:
            # Usamos asyncio.create_subprocess_exec para no bloquear el event loop
            process = await asyncio.create_subprocess_exec(
                "ollama", "run", request.model, request.prompt,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            # Leer chunk a chunk (1024 bytes) sin esperar newlines
            while True:
                chunk = await process.stdout.read(1024)
                if not chunk:
                    break
                text = chunk.decode("utf-8", errors="replace")
                # Formato SSE: cada mensaje debe terminar con \n\n
                yield f"data: {text}\n\n"

            await process.wait()

            if process.returncode != 0:
                error = await process.stderr.read()
                yield f"data: [ERROR] {error.decode('utf-8', errors='replace')}\n\n"

        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            # Estas cabeceras son críticas para que proxies/nginx no bufferice
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Desactiva buffering en nginx
            "Connection": "keep-alive",
        },
    )


# ─────────────────────────────────────────────
# ENDPOINT COMPLETO (sin cambios importantes)
# ─────────────────────────────────────────────
@app.post("/generate")
async def generate_response(request: PromptRequest):
    try:
        result = subprocess.run(
            ["ollama", "run", request.model, request.prompt],
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error: {result.stderr}")
        return {"response": result.stdout.strip(), "model": request.model}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    if not os.path.exists(dist_path):
        os.makedirs(dist_path)
        print(f"Carpeta '{dist_path}' creada. Coloca tu index.html allí.")

    uvicorn.run(app, host="0.0.0.0", port=8000)