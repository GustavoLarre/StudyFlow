from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import generate_flashcards_with_ai

router = APIRouter()

class NoteInput(BaseModel):
    title: str
    content: str

@router.post("/generate-flashcards")
async def generate_flashcards(note: NoteInput):
    try:
        flashcards = generate_flashcards_with_ai(note.title, note.content)
        return {"flashcards": flashcards}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))