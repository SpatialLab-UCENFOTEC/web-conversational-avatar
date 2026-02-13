# AI Avatar Demo — Talking Head + LLM + TTS + STT

## 📌 Project Description

This project is a **web-based demonstration built with Node.js, React, and Vite** that simulates interaction with an artificial intelligence agent through:

* An animated visual avatar
* A Large Language Model (LLM)
* Text-to-Speech (TTS)
* Speech-to-Text (STT)

The primary purpose of the application is to:

* Provide a tangible representation of an AI agent for non-technical audiences.
* Demonstrate a complete human–machine conversational workflow.
* Serve as a lightweight prototype for integration with real-world language models.
* Enable interaction through both text and voice input.

The demo prioritizes:

* Visual clarity
* Responsiveness
* Technical simplicity
* A smooth experience for live demonstrations

---

# Core Features

## Interactive Avatar (Talking Head)

The avatar:

* Is implemented using **HTML5 Canvas and vanilla JavaScript**.
* Includes four visual states:

  * **Idle** → Gently floats and blinks.
  * **Listening** → Indicates that the system is capturing voice input.
  * **Thinking** → Displays an animation while the LLM processes the request.
  * **Speaking** → Mouth movement synchronized with audio playback.

📁 Key file:
`src/Avatar.jsx`

---

## 💬 Manual Text Input

Users can:

* Type a message into a text field.
* Submit it by pressing **Enter** or clicking the **Send** button.
* View the conversation history within the interface.

📁 Key file:
`src/AvatarDemo.jsx`

---

# 🎤 Speech-to-Text (STT) — Voice Input

Speech-to-Text (STT) functionality was implemented to allow users to speak directly to the avatar instead of typing.

## Description

Voice input enhances:

* Interaction flow
* Accessibility
* Effectiveness during live demonstrations

---

## Technical Implementation

STT functionality is implemented using:

### puter.js

**puter.js** is used to manage audio capture and voice transcription in a lightweight and efficient manner.

Advantages:

* Simple frontend integration
* No complex backend required
* Compatible with modern browsers
* Simplified audio event handling

---

## 🔄 System Integration

The voice interaction flow operates as follows:

1. The user presses the microphone button.
2. The avatar switches to the **Listening** state.
3. **puter.js** captures the user's audio.
4. The message is transcribed.
5. The transcribed text is sent to the standard system flow.
6. The avatar switches to **Thinking**.
7. The LLM generates a response.
8. The system activates TTS.
9. The avatar switches to **Speaking**.
10. Once playback finishes, the avatar returns to **Idle**.

---

## State Management

The system handles:

* Listening start
* Manual stop
* Automatic completion
* Basic error handling (no microphone detected, permission denied, unrecognized audio)

---

## Result

✔ Fully functional voice input
✔ Clear visual feedback during listening
✔ Seamless integration with the existing conversation flow

📁 Key files:
`src/AvatarDemo.jsx`
`src/puter.jsx`

---

# 🤖 LLM-Generated Responses (Ollama Integration)

The demo connects to a **Large Language Model executed locally using Ollama** to generate dynamic responses in Spanish.

## Implementation

**Ollama** is integrated as the inference engine, enabling local execution of the language model. This provides greater control over the environment and avoids direct dependency on external cloud-based AI services.

The backend, implemented in **FastAPI**, acts as an intermediary between the frontend and the LLM running via Ollama.

---

## Features

* Integration with an LLM through **Ollama**
* Local model execution
* Context-aware conversation support (message history)
* Configurable endpoint
* Direct integration from `App.jsx` and `AvatarDemo.jsx` via `aiService.js`

---

## Response Generation Flow

1. The user submits a message (text or voice).
2. The frontend sends the request to the backend (FastAPI).
3. The backend queries the LLM running with **Ollama**.
4. A generated response is returned.
5. The response is sent back to the frontend.
6. The TTS system is activated to reproduce the response audibly.

This modular architecture allows the language model to be replaced without modifying the avatar interface.

---

# 🔊 Text-to-Speech (TTS)

Text-to-Speech (TTS) functionality enables the avatar to reproduce generated responses audibly.

## Description

Text-to-Speech enhances:

* The interactive experience
* Conversational naturalness
* Effectiveness during live demonstrations

---

## Technical Implementation

TTS is implemented using:

### puter.js

The **puter.js API** is used to dynamically convert LLM-generated text into playable audio directly within the browser.

Technical characteristics:

* Audio generation directly from the frontend
* No additional microservice required for voice synthesis
* Automatic playback of generated audio
* Programmatic handling of playback start and completion

📁 Key files:
`src/AvatarDemo.jsx`
`src/puter.jsx`

---

# 🛠️ Technologies Used

## Frontend

* Node.js
* React
* Vite
* HTML5 Canvas
* Modern CSS
* puter.js (STT and TTS integration)

## Artificial Intelligence

* Ollama (Local LLM execution)
* LLM via API

## Backend

* Python (FastAPI)
* Uvicorn

## Infrastructure

* Docker (multi-stage build)

---

# 📁 Project Structure

```
avatar-demo/
├── public/
├── src/
│    ├── assets/
│    │    └── react.svg
│    ├── services/
│    │    ├── aiService.js
│    │    ├── puterTTS.js
│    │    └── sttService.js
│    ├── App.css
│    ├── App.jsx
│    ├── Avatar.jsx
│    ├── AvatarDemo.jsx
│    ├── AvatarDemo.css
│    ├── PasswordGate.jsx
│    ├── PasswordGate.css
│    ├── index.css
│    └── main.jsx
├── .env.production
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── Dockerfile
└── README.md
```

---

# 🐳 Docker

The project includes a **multi-stage Dockerfile** that:

1. Builds the frontend using Node.
2. Runs the LLM server using Python.
3. Serves the generated static files.
4. Exposes port 8000.

### Build

```bash
docker build -t ai-avatar-demo .
```

### Run

```bash
docker run -p 8000:8000 ai-avatar-demo
```

---

# 🔐 Password Protection

A `PasswordGate.jsx` component was added to protect access to the demo.

Validation is performed against:

```
import.meta.env.VITE_DEMO_PASSWORD
```

Default password:

```
cenfotec2025
```

`.env` file:

```
VITE_DEMO_PASSWORD=cenfotec2025
```

Ensure that `.env` is included in `.gitignore`.

---

# 🚀 Deployment

Thanks to Docker containerization, the system can be deployed on:

* VPS
* Railway
* Render
* Azure / AWS / GCP
* Institutional servers

---

# 🎯 Conclusion

This project demonstrates a complete conversational agent architecture integrating:

* Animated avatar
* Speech-to-Text (puter.js)
* Ollama-based Large Language Model (LLM)
* Text-to-Speech
* Access protection
* Docker-based containerization

---

# ⚙️ Installation and Execution

## Clone the repository

```bash
git clone https://github.com/briam-mora/spatiallab-conversational-avatar.git
cd avatar-demo
```
