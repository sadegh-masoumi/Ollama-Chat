import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models import Conversation, Message
from app.schemas import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageResponse,
)

router = APIRouter(tags=["chat"])


# ---------------------------------------------------------------------------
# Conversation CRUD
# ---------------------------------------------------------------------------


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return conversations


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    data: ConversationCreate, db: AsyncSession = Depends(get_db)
):
    conversation = Conversation(
        id=str(uuid.uuid4()),
        title=data.title or "New Chat",
        model=data.model,
        system_prompt=data.system_prompt,
    )
    db.add(conversation)
    await db.commit()
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation.id)
    )
    return result.scalar_one()


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Parse images JSON for each message
    for msg in conversation.messages:
        if msg.images:
            try:
                msg.images = json.loads(msg.images)
            except Exception:
                msg.images = None

    return conversation


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conversation)
    await db.commit()


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if data.title is not None:
        conversation.title = data.title
    if data.system_prompt is not None:
        conversation.system_prompt = data.system_prompt

    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    return result.scalar_one()


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def add_message(
    conversation_id: str,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
        images=json.dumps(data.images) if data.images else None,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    response = MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        role=message.role,
        content=message.content,
        images=data.images,
        created_at=message.created_at,
        token_count=message.token_count,
    )
    return response


# ---------------------------------------------------------------------------
# WebSocket streaming chat
# ---------------------------------------------------------------------------


def _build_ollama_messages(
    db_messages: list[Message], system_prompt: Optional[str]
) -> list[dict]:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    for msg in db_messages:
        entry: dict = {"role": msg.role, "content": msg.content}
        if msg.images:
            try:
                images_list = json.loads(msg.images) if isinstance(msg.images, str) else msg.images
                if images_list:
                    entry["images"] = images_list
            except Exception:
                pass
        messages.append(entry)

    return messages


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    await websocket.accept()

    try:
        while True:
            try:
                raw = await websocket.receive_text()
            except WebSocketDisconnect:
                break

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "content": "Invalid JSON"})
                continue

            # Extract parameters
            conversation_id: Optional[str] = data.get("conversation_id")
            user_message: str = data.get("message", "")
            images: Optional[list] = data.get("images")
            model: str = data.get("model", "llama3")
            temperature: float = float(data.get("temperature", 0.7))
            top_p: float = float(data.get("top_p", 0.9))
            max_tokens: Optional[int] = data.get("max_tokens")
            system_prompt: Optional[str] = data.get("system_prompt")

            # Create or load conversation
            if not conversation_id:
                # Auto-generate title from first message
                title = user_message[:50] if user_message else "New Chat"
                conversation = Conversation(
                    id=str(uuid.uuid4()),
                    title=title,
                    model=model,
                    system_prompt=system_prompt,
                )
                db.add(conversation)
                await db.flush()
                conversation_id = conversation.id
            else:
                result = await db.execute(
                    select(Conversation).where(Conversation.id == conversation_id)
                )
                conversation = result.scalar_one_or_none()
                if not conversation:
                    await websocket.send_json(
                        {"type": "error", "content": "Conversation not found"}
                    )
                    continue

            # Save user message
            user_msg = Message(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="user",
                content=user_message,
                images=json.dumps(images) if images else None,
            )
            db.add(user_msg)
            await db.flush()

            # Load full conversation history
            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .where(Message.id != user_msg.id)
                .order_by(Message.created_at)
            )
            history_messages = result.scalars().all()

            # Build Ollama message list
            ollama_messages = _build_ollama_messages(history_messages, system_prompt)

            # Add current user message
            current_entry: dict = {"role": "user", "content": user_message}
            if images:
                current_entry["images"] = images
            ollama_messages.append(current_entry)

            # Build Ollama request body
            ollama_payload: dict = {
                "model": model,
                "messages": ollama_messages,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                },
            }
            if max_tokens:
                ollama_payload["options"]["num_predict"] = max_tokens

            # Stream response from Ollama
            assistant_content = ""
            token_count = 0
            error_occurred = False

            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    async with client.stream(
                        "POST",
                        f"{settings.ollama_base_url}/api/chat",
                        json=ollama_payload,
                    ) as response:
                        if response.status_code != 200:
                            error_body = await response.aread()
                            await websocket.send_json(
                                {
                                    "type": "error",
                                    "content": f"Ollama error {response.status_code}: {error_body.decode()}",
                                }
                            )
                            error_occurred = True
                        else:
                            async for line in response.aiter_lines():
                                if not line:
                                    continue
                                try:
                                    chunk = json.loads(line)
                                except json.JSONDecodeError:
                                    continue

                                if chunk.get("done"):
                                    # Extract token counts if available
                                    eval_count = chunk.get("eval_count", 0)
                                    prompt_eval = chunk.get("prompt_eval_count", 0)
                                    token_count = eval_count + prompt_eval
                                    break

                                token = chunk.get("message", {}).get("content", "")
                                if token:
                                    assistant_content += token
                                    try:
                                        await websocket.send_json(
                                            {"type": "token", "content": token}
                                        )
                                    except Exception:
                                        # Client disconnected
                                        break

            except httpx.ConnectError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "content": "Cannot connect to Ollama. Make sure Ollama is running.",
                    }
                )
                error_occurred = True
            except WebSocketDisconnect:
                # Client disconnected mid-stream; still save what we have
                pass
            except Exception as e:
                await websocket.send_json({"type": "error", "content": str(e)})
                error_occurred = True

            # Save assistant message
            if assistant_content:
                assistant_msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                    token_count=token_count if token_count > 0 else None,
                )
                db.add(assistant_msg)

            # Update conversation timestamp
            conversation.updated_at = datetime.now(timezone.utc)

            try:
                await db.commit()
            except Exception:
                await db.rollback()

            if not error_occurred:
                try:
                    await websocket.send_json(
                        {
                            "type": "done",
                            "conversation_id": conversation_id,
                            "message_id": assistant_msg.id if assistant_content else None,
                            "token_count": token_count,
                        }
                    )
                except Exception:
                    pass

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.send_json({"type": "error", "content": "Internal server error"})
        except Exception:
            pass
