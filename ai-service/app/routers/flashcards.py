from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import generate_flashcards_with_ai

router = APIRouter()

class NoteInput(BaseModel):
    title: str
    content: str

@router.post("/generate-flashcards")
def generate_flashcards(note: NoteInput):
    try:
        flashcards = generate_flashcards_with_ai(note.title, note.content)
        return flashcards
    except Exception as e:
        # Tratamento resiliente: se a IA falhar, retornamos 503 com detalhes do erro
        raise HTTPException(
            status_code=503, 
            detail=f"Falha ao comunicar com o serviço de IA: {str(e)}"
        )