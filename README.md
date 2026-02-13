# AI Avatar Demo — Talking Head + LLM + TTS + STT

##  📌 Descripción del proyecto

Este proyecto es una **demostración web construida con Node.js, React y Vite** que simula la interacción con un agente de inteligencia artificial mediante:

* Un avatar visual animado
* Un modelo de lenguaje (LLM)
* Conversión de texto a voz (TTS)
* Conversión de voz a texto (STT)

El propósito principal de la aplicación es:

* Mostrar de manera tangible el concepto de un “agente de IA” a audiencias no técnicas.
* Demostrar un flujo completo de conversación humano–máquina.
* Servir como prototipo ligero para integraciones con modelos de lenguaje reales (LLM).
* Permitir interacción tanto por texto como por voz.

La demo prioriza:

* Claridad visual
* Responsividad
* Simplicidad técnica
* Experiencia fluida para demostraciones en vivo

 ----

#  Funcionalidades principales

###  Avatar interactivo (Talking Head)


El avatar:

* Está implementado con **HTML5 Canvas y JavaScript puro**.
* Tiene cuatro estados visuales:

  * **Idle (reposo)** → flota suavemente y parpadea.
  * **Listening (escuchando)** → indica que el sistema está captando voz.
  * **Thinking (pensando)** → animación mientras el LLM procesa.
  * **Speaking (hablando)** → la boca se mueve durante la reproducción de audio.

📁 Archivo clave:

* `src/Avatar.jsx`

---

## 💬 Entrada de texto manual

El usuario puede

* Escribir un mensaje en un campo de texto.
* Enviar presionando **Enter** o el botón **Enviar**.
* Visualizar el historial de conversación.

📁 Archivo clave:

* `src/AvatarDemo.jsx`

---

# 🎤 Speech-to-Text (STT) — Entrada por Voz

Se agregó funcionalidad de **Speech-to-Text (STT)** para permitir que los usuarios hablen directamente con el avatar en lugar de escribir.

###  Descripción

Se implementó entrada por voz para mejorar:

* Fluidez de interacción
* Accesibilidad
* Experiencia en demostraciones en vivo

---


##  Implementación técnica

La funcionalidad STT se implementó utilizando:

###  puter.js

Se utilizó **puter.js** para gestionar la captura y transcripción de voz de forma ligera y eficiente.

Ventajas:

* Integración sencilla en frontend.
* No requiere backend complejo adicional.
* Compatible con navegadores modernos.
* Manejo simplificado de eventos de audio.

---

## 🔄 Integración con el sistema

El flujo de voz funciona de la siguiente manera:

1. El usuario presiona el botón de micrófono.
2. El avatar cambia al estado **Listening**.
3. **puter.js** captura el audio del usuario.
4. Se obtiene la transcripción del mensaje.
5. El texto transcrito se envía al flujo normal del sistema.
6. El avatar pasa a **Thinking**.
7. El LLM genera respuesta.
8. El sistema activa TTS.
9. El avatar pasa a **Speaking**.
10. Finaliza y vuelve a **Idle**.

---

##  Manejo de estados 

El sistema controla:

* Inicio de escucha
* Detención manual
* Finalización automática
* Errores básicos (sin micrófono, permiso denegado, audio no reconocido)

---

##  Resultado

✔ Entrada por voz completamente funcional
✔ Retroalimentación visual clara cuando el avatar está escuchando
✔ Integración perfecta con el flujo existente

---

# Respuestas generadas por LLM

La demo se conecta a un **modelo de lenguaje real (LLM)** para generar respuestas dinámicas en español.

Características:

* Endpoint configurable.
* Soporte para conversación contextual.
* Integración directa desde `App.jsx`.

---

# 🔊 Text-to-Speech (TTS)

Se utiliza la **Web Speech API** del navegador para convertir texto a voz.

Características:

* Funciona en Chrome sin servicios externos.
* Usa voces locales del sistema.
* Sincronizado con el estado del avatar (Speaking).
* No requiere streaming.
📁 Archivo clave:
`src/App.jsx`

---

# 🔄 Flujo completo del sistema

1. Usuario escribe o habla.
2. Si habla → STT convierte voz en texto.
3. Avatar entra en **Thinking**.
4. Se consulta el LLM.
5. Se recibe respuesta.
6. Se activa TTS.
7. Avatar entra en **Speaking**.
8. Finaliza y vuelve a **Idle**.

---

# 🛠️ Tecnologías utilizadas

**Frontend:**

* Node.js 
* React
* Vite
* HTML5 Canvas
* CSS moderno
* puter.js (Speech-to-Text)

**IA:**

* LLM vía API
* Web Speech API (Text-to-Speech)

**Backend:**

* Python (FastAPI)
* Uvicorn

**Infraestructura:**

* Docker (multi-stage build)

---

## 📁 Estructura del proyecto

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

## 📌 Resumen de la estructura

* `public/` → recursos estáticos públicos.

* `src/` → código fuente principal del frontend en React.

  * `assets/` → imágenes e íconos utilizados por la aplicación.

  * `services/` → capa de servicios que encapsula integraciones externas:

    * `aiService.js` → comunicación con el modelo de lenguaje (LLM).
    * `puterTTS.js` → conversión de texto a voz.
    * `sttService.js` → implementación de Speech-to-Text usando **puter.js**.

  * `App.jsx` → componente principal que orquesta toda la lógica del sistema (usuario, avatar, LLM, TTS, STT y autenticación).

  * `Avatar.jsx` → renderiza y anima el avatar (estados: Idle, Listening, Thinking, Speaking).

  * `AvatarDemo.jsx` → gestiona la interfaz de conversación y el flujo de interacción.

  * `PasswordGate.jsx` → controla el acceso mediante validación de contraseña.

  * Archivos `.css` → estilos globales y específicos de cada componente.

  * `main.jsx` → punto de entrada de la aplicación React.

* `.env.production` → variables de entorno para despliegue.

* `Dockerfile` → configuración de contenedor multi-stage para build y ejecución.

* `package.json` → dependencias y scripts del proyecto.

* `eslint.config.js` → configuración de calidad de código.

* `README.md` → documentación oficial del proyecto.

---
# 🐳 Docker

El proyecto incluye un **Dockerfile multi-stage** que:

1. Construye el frontend con Node.
2. Ejecuta el servidor LLM con Python.
3. Sirve archivos estáticos generados.
4. Expone el puerto 8000.

Construcción:

```bash
docker build -t ai-avatar-demo .
```

Ejecución:

```bash
docker run -p 8000:8000 ai-avatar-demo
```

---

# 🔐 Protección por Contraseña

Se agregó un componente `PasswordGate.jsx` para proteger la demo.

Validación contra:

```
import.meta.env.VITE_DEMO_PASSWORD
```

Contraseña por defecto:

```
cenfotec2025
```

Archivo `.env`:

```
VITE_DEMO_PASSWORD=cenfotec2025
```

Agregar `.env` a `.gitignore`.

---

# 🚀 Despliegue

Gracias a Docker, el sistema puede desplegarse fácilmente en:

* VPS
* Railway
* Render
* Azure / AWS / GCP
* Servidores institucionales

---

# 🎯 Conclusión

Este proyecto demuestra una arquitectura completa de agente conversacional que integra:

* Avatar animado
* Speech-to-Text (puter.js)
* Modelo de lenguaje (LLM)
* Text-to-Speech
* Protección de acceso
* Contenerización con Docker

---

## ⚙️ Instalación y ejecución

### Clonar el repositorio
```bash
git clone https://github.com/briam-mora/spatiallab-conversational-avatar.git
cd avatar-demo
