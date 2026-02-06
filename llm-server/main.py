from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import subprocess
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Ollama CLI API Server with Streaming")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permite todos los headers
)

# Montar la carpeta dist para archivos estáticos
dist_path = "dist"
if os.path.exists(dist_path):
    app.mount("/static", StaticFiles(directory=dist_path), name="static")

class PromptRequest(BaseModel):
    prompt: str
    model: str = "llama3.2"

# Servir el archivo index.html desde la carpeta dist
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ollama API Server</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                }
                .info {
                    background-color: #e8f4fd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .endpoint {
                    background-color: #f8f9fa;
                    padding: 10px;
                    border-left: 4px solid #007bff;
                    margin: 10px 0;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Ollama CLI API Server</h1>
                <p>El servidor está funcionando correctamente.</p>
                <div class="info">
                    <p><strong>Información:</strong> Coloca tu archivo <code>index.html</code> en la carpeta <code>dist</code> en la misma ubicación que este script.</p>
                    <p>Endpoints disponibles:</p>
                    <div class="endpoint">POST /generate/stream - Generar respuesta con streaming</div>
                    <div class="endpoint">POST /generate - Generar respuesta completa</div>
                </div>
            </div>
        </html>
        """)

# También manejar rutas de SPA (Single Page Application)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Si se solicita un archivo específico, intentar servirlo
    file_path = os.path.join(dist_path, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Si no existe el archivo, servir index.html para SPA routing
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # Si no hay index.html, devolver 404
    raise HTTPException(status_code=404, detail="File not found")

# Endpoint con streaming
@app.post("/generate/stream")
async def generate_stream(request: PromptRequest):
    async def stream_generator():
        try:
            process = subprocess.Popen(
                ["ollama", "run", request.model, request.prompt],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                encoding="utf-8"
            )
            
            # Leer la salida línea por línea
            for line in process.stdout:
                if line:
                    yield f"data: {line}\n\n"
            
            process.wait()
            
            if process.returncode != 0:
                error = process.stderr.read()
                yield f"data: ERROR: {error}\n\n"
        
        except Exception as e:
            yield f"data: ERROR: {str(e)}\n\n"
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"
    )

# Endpoint sin streaming (respuesta completa)
@app.post("/generate")
async def generate_response(request: PromptRequest):
    try:
        result = subprocess.run(
            ["ollama", "run", request.model, request.prompt],
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8"
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Error: {result.stderr}"
            )
        
        return {
            "response": result.stdout.strip(),
            "model": request.model
        }
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    # Crear la carpeta dist si no existe
    if not os.path.exists(dist_path):
        os.makedirs(dist_path)
        print(f"Se ha creado la carpeta '{dist_path}'. Coloca tu archivo index.html allí.")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)