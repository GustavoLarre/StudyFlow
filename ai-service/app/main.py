from fastapi import FastAPI
from app.routers import flashcards

app = FastAPI()

app.include_router(flashcards.router)
