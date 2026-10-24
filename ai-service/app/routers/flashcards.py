from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import generate_flashcards_with_ai

router = APIRouter()

class NoteInput(BaseModel):
    title: str
    content: str

from fastapi import APIRouter, HTTPException

@router.post("/generate-flashcards")
async def generate_flashcards(note: NoteInput):
    try:
        flashcards = generate_flashcards_with_ai(note.title, note.content)
        return {"flashcards": flashcards}
    except HTTPException as he:
        raise he  # Propaga o erro HTTP gerado pelo serviço
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))