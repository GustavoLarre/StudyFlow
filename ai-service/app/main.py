from fastapi import FastAPI
from app.routers.flashcards import router as flashcards_router

app = FastAPI(title="StudyFlow AI Service", version="1.0.0")
app.include_router(flashcards_router)
