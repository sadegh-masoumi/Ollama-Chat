from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    role: str
    content: str
    images: Optional[list[str]] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    images: Optional[list[str]] = None
    created_at: datetime
    token_count: Optional[int] = None

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: str
    system_prompt: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    model: str
    system_prompt: Optional[str] = None
    messages: Optional[list[MessageResponse]] = None

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    images: Optional[list[str]] = None
    model: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    stream: bool = True


class ModelInfo(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None
    details: Optional[dict] = None
