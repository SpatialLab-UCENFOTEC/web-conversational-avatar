# AI Avatar Demo — Talking Head + LLM + TTS

## 📌 Descripción del proyecto

Este proyecto es una *demostración web construida con Node.js, React y Vite* que simula la interacción con un agente de inteligencia artificial mediante un avatar visual y voz sintética.  

El propósito principal de la aplicación es:
- Mostrar de manera tangible el concepto de un “agente de IA” a audiencias no técnicas.
- Demostrar un flujo básico de conversación humano–máquina.
- Servir como prototipo ligero para integraciones con modelos de lenguaje reales (LLM).

La demo prioriza:
- *Claridad visual*
- *Responsividad*
- *Simplicidad técnica*
- *Experiencia fluida para demostraciones en vivo*

No busca realismo visual extremo ni precisión de lip-sync.

---

## 🎯 Funcionalidades principales

### ✅ Avatar interactivo (Talking Head)
El avatar:
- Está implementado con *HTML5 Canvas y JavaScript puro*.
- Tiene tres estados visuales:
  - *Idle (reposo)* → el avatar flota suavemente y parpadea.
  - *Thinking (pensando)* → aparece una animación de puntos mientras se “procesa” la respuesta.
  - *Speaking (hablando)* → la boca se mueve mientras el sistema reproduce audio.

📁 Archivo clave:
- `src/Avatar.jsx`

---

### 💬 Entrada de texto del usuario
El usuario puede:
- Escribir un mensaje en un campo de texto.
- Enviar la consulta presionando *Enter* o el botón *Enviar*.

El texto enviado queda registrado en un historial de conversación dentro de la interfaz.

📁 Archivo clave:
- `src/AvatarDemo.jsx`

---

### 🤖 Respuestas generadas por LLM

La demo se conecta a un **modelo de lenguaje real (LLM)** para generar respuestas dinámicas en español.

Características:
- Integración directa con un endpoint de LLM (configurable).
- Respuestas naturales y variadas.
- Soporte para conversación contextual.

📁 Archivo clave:
- `src/App.jsx`

---

### 🔊 Conversión de texto a voz (TTS)

La demo utiliza el *Web Speech API* del navegador para convertir texto a voz.

Características del TTS:
- Funciona directamente en Chrome (sin servicios externos).
- Usa voces disponibles en el sistema del usuario.
- No requiere streaming.
- Se sincroniza con la animación del avatar (cuando comienza a hablar, el avatar entra en estado “speaking”).

📁 Archivo clave:
- `src/App.jsx`

---

### 🔄 Flujo de interacción del sistema

1. El usuario escribe un mensaje.
2. El sistema cambia el avatar a *Thinking*.
3. El texto se envía al LLM y se recibe una respuesta.
4. La respuesta se envía al sistema de TTS.
5. El avatar cambia a *Speaking* mientras se reproduce el audio.
6. Al terminar la voz, el avatar vuelve a *Idle*.

---

## 🛠️ Tecnologías utilizadas

- **Node.js** (entorno de ejecución)
- **React** (Frontend principal)
- **Vite** (Herramienta de desarrollo y empaquetado)
- **HTML5 Canvas** (Renderizado del avatar)
- **Web Speech API** (Texto a voz en el navegador)
- **CSS moderno** (Estilización de la interfaz)

No se utiliza:
- Backend complejo
- Base de datos
- Servicios externos de animación pesada

---

## 📁 Estructura del proyecto
avatar-demo/ ├── public/ │    ├── avatar.png │    └── vite.svg ├── src/ │    ├── assets/ │    │    └── react.svg │    ├── App.css │    ├── App.jsx          # Lógica principal de la aplicación │    ├── Avatar.jsx       # Componente del avatar (talking head) │    ├── AvatarDemo.jsx   # Flujo de interacción y UI │    ├── index.css │    └── main.jsx         # Punto de entrada de React ├── index.html ├── package.json ├── vite.config.js └── README.md


📌 **Resumen de la estructura:**
- `public/` → recursos estáticos (imágenes base).
- `src/` → código fuente principal (componentes React, lógica del avatar, conexión al LLM).
- `App.jsx` → orquesta la interacción entre usuario, avatar y TTS.
- `Avatar.jsx` → renderiza y anima el avatar.
- `AvatarDemo.jsx` → gestiona la interfaz de conversación.
- `main.jsx` → inicializa la aplicación React.
- Configuración y dependencias en `package.json` y `vite.config.js`.

---

## ⚙️ Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/avatar-demo.git
cd avatar-demo
