// types.ts
export interface PromptRequest {
  prompt: string;
  model?: string; // Opcional, por defecto "llama3.2"
}

export interface PromptResponse {
  response: string;
  model: string;
}

// api.ts
const API_BASE_URL = 'http://localhost:8000';

// Función para streaming
export async function generateStream(
  request: PromptRequest,
  onData: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Procesar las líneas de Server-Sent Events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Mantener la última línea incompleta

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Eliminar "data: "
          if (data.startsWith('ERROR: ')) {
            onError(data.slice(7));
          } else {
            onData(data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Función sin streaming
export async function generate(
  request: PromptRequest
): Promise<PromptResponse> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }

  return response.json();
}