from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import subprocess
import asyncio
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Ollama CLI API Server with Streaming")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permite todos los headers
)

class PromptRequest(BaseModel):
    prompt: str
    model: str = "llama3.2"

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
                bufsize=1
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
    uvicorn.run(app, host="0.0.0.0", port=8000)