# Ollama Chat

A production-ready ChatGPT-like web application powered by your local [Ollama](https://ollama.com) instance.

## Features

- **Real-time streaming** — token-by-token responses via WebSocket
- **Multi-turn conversations** — full context memory per session
- **Multiple models** — dynamically lists all models installed in Ollama
- **Image & file upload** — drag & drop, paste images; PDF/text extraction
- **Multimodal support** — send images to vision models (llava, etc.)
- **Markdown rendering** — with syntax-highlighted code blocks + copy buttons
- **Persistent chats** — SQLite storage; reload past conversations
- **Model settings** — temperature, top-p, max tokens, system prompt
- **Dark / light mode** — defaults to dark, toggle in sidebar
- **Stop generation** — cancel mid-stream at any time

## Prerequisites

- [Ollama](https://ollama.com) running locally on port 11434
- Python 3.11+
- Node.js 18+

## Quick Start (Local)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Docker Setup

```bash
# Make sure Ollama is running on your host
docker compose up --build
```

Open http://localhost:3000

## Architecture

```
Browser
  │
  ├── REST (axios)   → FastAPI /api/...
  └── WebSocket      → FastAPI /api/ws/chat
                              │
                              └── httpx streaming → Ollama :11434
```

### How Streaming Works

1. User sends a message → frontend opens a WebSocket to `/api/ws/chat`
2. Backend receives the payload, saves the user message to SQLite
3. Backend opens a streaming HTTP request to Ollama's `/api/chat` endpoint
4. Each JSON chunk from Ollama contains a `message.content` token
5. Backend forwards each token as `{"type": "token", "content": "..."}` over WebSocket
6. Frontend appends each token to the live assistant bubble in real-time
7. When Ollama signals `done`, backend saves the full assistant message and sends `{"type": "done", ...}`

### How Image Upload Works

1. User selects / drags / pastes an image
2. Frontend calls `POST /api/upload` with the file as multipart form data
3. Backend reads the image bytes and returns a base64-encoded string + MIME type
4. Frontend stores the base64 string; on send it is included in the WebSocket payload under `images`
5. Backend includes the `images` array in the Ollama `/api/chat` request body
6. Vision models (llava, bakllava, etc.) receive and process the image

## Project Structure

```
ollama-chat/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, rate limiting
│   │   ├── config.py        # Pydantic settings (.env)
│   │   ├── database.py      # Async SQLAlchemy + aiosqlite
│   │   ├── models.py        # Conversation & Message ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── chat.py      # Conversations CRUD + WebSocket
│   │       ├── models.py    # Ollama model listing
│   │       └── files.py     # File/image upload
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── store/chatStore.js   # Zustand global state
        ├── hooks/
        │   ├── useChat.js       # WebSocket chat hook
        │   └── useModels.js     # React Query model list
        └── components/
            ├── Sidebar.jsx
            ├── ChatWindow.jsx
            ├── MessageBubble.jsx
            ├── MessageInput.jsx
            ├── ModelSettings.jsx
            └── TypingIndicator.jsx
```
