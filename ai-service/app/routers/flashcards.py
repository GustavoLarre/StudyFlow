from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import generate_flashcards_with_ai

router = APIRouter()

class NoteInput(BaseModel):
    title: str
    content: str

@router.post("/generate-flashcards")
def generate_flashcards(note: NoteInput):
    # Chama o serviço de IA que será mockado pelo nosso teste
    flashcards = generate_flashcards_with_ai(note.title, note.content)
    return flashcards