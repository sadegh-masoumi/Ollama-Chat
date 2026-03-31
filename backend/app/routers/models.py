import httpx
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.config import settings
from app.schemas import ModelInfo

router = APIRouter(tags=["models"])


class PullRequest(BaseModel):
    name: str


@router.get("/models", response_model=list[ModelInfo])
async def list_models():
    """List all available Ollama models."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            models = []
            for m in data.get("models", []):
                models.append(
                    ModelInfo(
                        name=m.get("name", ""),
                        size=m.get("size"),
                        modified_at=m.get("modified_at"),
                        details=m.get("details"),
                    )
                )
            return models
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="Cannot connect to Ollama. Make sure Ollama is running at "
                + settings.ollama_base_url,
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))


@router.get("/models/{name:path}", response_model=ModelInfo)
async def get_model(name: str):
    """Get detailed info about a specific model."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{settings.ollama_base_url}/api/show",
                json={"name": name},
            )
            response.raise_for_status()
            data = response.json()
            return ModelInfo(
                name=name,
                size=data.get("size"),
                modified_at=data.get("modified_at"),
                details=data.get("details"),
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Cannot connect to Ollama.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))


@router.post("/models/pull")
async def pull_model(req: PullRequest):
    """Pull a model from Ollama registry (streaming response)."""

    async def stream_pull():
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{settings.ollama_base_url}/api/pull",
                    json={"name": req.name},
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line + "\n"
            except httpx.ConnectError:
                yield json.dumps({"error": "Cannot connect to Ollama."}) + "\n"
            except httpx.HTTPStatusError as e:
                yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(stream_pull(), media_type="application/x-ndjson")
