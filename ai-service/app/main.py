from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Importa a função correta do nosso ai_service.py
from .services.ai_service import generate_flashcards_with_ai

app = FastAPI(title="StudyFlow AI Service", version="1.0.0")

class NoteInput(BaseModel):
    title: str
    content: str

@app.post("/generate-flashcards")
async def generate_flashcards(note: NoteInput):
    try:
        # Chama a função passando o título e o conteúdo exigidos
        flashcards = generate_flashcards_with_ai(note.title, note.content)
        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))