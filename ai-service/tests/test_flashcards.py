from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_flashcards_missing_title():
    """Garante que a API rejeita requisições sem o campo 'title' (Retorna 422)."""
    response = client.post(
        "/generate-flashcards",
        json={"content": "O protocolo HTTP opera na camada de aplicação."}
    )
    assert response.status_code == 422

def test_generate_flashcards_missing_content():
    """Garante que a API rejeita requisições sem o campo 'content' (Retorna 422)."""
    response = client.post(
        "/generate-flashcards",
        json={"title": "Redes de Computadores"}
    )
    assert response.status_code == 422
