import base64
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(tags=["files"])

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
}


class UploadResponse(BaseModel):
    type: str  # "image" | "pdf" | "text"
    content: str  # base64 for images, extracted text for pdf/text
    mime_type: str
    filename: str
    size: int


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (image, PDF, or text) for use in chat."""
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB.",
        )

    mime_type = file.content_type or "application/octet-stream"

    # Normalize mime type
    if mime_type not in ALLOWED_MIME_TYPES:
        # Try to guess from filename
        filename = file.filename or ""
        if filename.endswith(".pdf"):
            mime_type = "application/pdf"
        elif filename.endswith((".txt", ".md", ".csv")):
            mime_type = "text/plain"
        elif filename.endswith((".jpg", ".jpeg")):
            mime_type = "image/jpeg"
        elif filename.endswith(".png"):
            mime_type = "image/png"
        elif filename.endswith(".gif"):
            mime_type = "image/gif"
        elif filename.endswith(".webp"):
            mime_type = "image/webp"
        else:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {mime_type}",
            )

    # Handle images
    if mime_type.startswith("image/"):
        encoded = base64.b64encode(content).decode("utf-8")
        return UploadResponse(
            type="image",
            content=encoded,
            mime_type=mime_type,
            filename=file.filename or "image",
            size=len(content),
        )

    # Handle PDFs
    if mime_type == "application/pdf":
        try:
            import pdfplumber

            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                extracted = "\n\n".join(pages_text)
                if not extracted.strip():
                    extracted = "[No text could be extracted from this PDF]"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

        return UploadResponse(
            type="pdf",
            content=extracted,
            mime_type=mime_type,
            filename=file.filename or "document.pdf",
            size=len(content),
        )

    # Handle text files
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text_content = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Cannot decode file as text.")

    return UploadResponse(
        type="text",
        content=text_content,
        mime_type=mime_type,
        filename=file.filename or "file.txt",
        size=len(content),
    )
