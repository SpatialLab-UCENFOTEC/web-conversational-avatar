# AI Avatar Demo — Live2D + LLM + Google Cloud TTS/STT

# Project Description

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

## Interactive Avatar (Live2D Cubism)

The avatar:

* Is implemented using **Live2D Cubism**, a technology designed to animate 2D characters in real time.
* The avatar model is rendered in the browser and controlled through **React components**.
* Includes four visual states:

  * **Idle** → Subtle breathing and blinking animation.
  * **Listening** → Indicates that the system is capturing voice input.
  * **Thinking** → Animation indicating the AI is processing the request.
  * **Speaking** → Mouth movement synchronized with generated speech audio.

📁 Key file:
`src/Avatar.jsx`

Live2D allows:

* Real-time facial animation
* Parameter control for mouth, eyes, and expressions
* Smooth character motion without requiring full 3D rendering

---

## Manual Text Input

Users can:

* Type a message into a text field.
* Submit it by pressing **Enter** or clicking the **Send** button.
* View the conversation history within the interface.

📁 Key file:
`src/AvatarDemo.jsx`

---

# Speech-to-Text (STT) — Voice Input

Speech-to-Text (STT) functionality allows users to speak directly to the avatar instead of typing.

## Description

Voice input enhances:

* Interaction flow
* Accessibility
* Effectiveness during live demonstrations

---

## Technical Implementation

Speech recognition is implemented using:

### Google Cloud Speech-to-Text

The **Google Cloud Speech-to-Text API** is used to convert spoken audio into text.

Advantages:

* High transcription accuracy
* Support for multiple languages
* Scalable cloud infrastructure
* Reliable speech recognition models

The frontend captures the user's audio input and sends it to the backend service, which forwards the audio to the Google Cloud Speech-to-Text API for transcription.

---

## System Integration

The voice interaction flow operates as follows:

1. The user presses the microphone button.
2. The avatar switches to the **Listening** state.
3. The browser captures the user's audio.
4. The audio is sent to the backend service.
5. The backend sends the audio to **Google Cloud Speech-to-Text**.
6. The spoken message is transcribed.
7. The transcribed text is sent to the standard system flow.
8. The avatar switches to **Thinking**.
9. The LLM generates a response.
10. The system activates TTS.
11. The avatar switches to **Speaking**.
12. Once playback finishes, the avatar returns to **Idle**.

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
`src/services/sttService.js`

---

# LLM-Generated Responses (Ollama Integration)

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

### Google Cloud Text-to-Speech

The **Google Cloud Text-to-Speech API** converts the LLM-generated text responses into natural-sounding speech.

Technical characteristics:

* High-quality neural voices
* Multiple language options
* Configurable voice parameters
* Audio returned as playable output for the frontend

The backend requests audio generation from Google Cloud TTS and returns the audio to the frontend for playback while the avatar enters the **Speaking** state.

📁 Key files:
`src/AvatarDemo.jsx`
`src/services/ttsService.js`

---

# Technologies Used

## Frontend

* Node.js
* React
* Vite
* Live2D Cubism
* Modern CSS

---

## Artificial Intelligence

* Ollama (Local LLM execution)
* LLM via API

---

## Backend

* Python (FastAPI)
* Uvicorn
* Google Cloud Speech-to-Text
* Google Cloud Text-to-Speech

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
│    │    ├── ttsService.js
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
2. Runs the backend API using Python.
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

# Conclusion

This project demonstrates a complete conversational agent architecture integrating:

* **Live2D animated avatar**
* **Google Cloud Speech-to-Text**
* **Ollama-based Large Language Model (LLM)**
* **Google Cloud Text-to-Speech**
* **Access protection**
* **Docker-based containerization**

---

# Installation and Execution

## Clone the repository

git clone https://github.com/briam-mora/spatiallab-conversational-avatar.git

