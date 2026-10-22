from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch("app.routers.flashcards.generate_flashcards_with_ai")
def test_generate_flashcards_success(mock_ai_service):
    """Garante que a API retorna os flashcards corretamente quando a IA responde com sucesso."""
    
    # 1. Configuramos o mock para retornar uma lista de flashcards simulada
    mock_ai_service.return_value = [
        {"front": "O que é HTTP?", "back": "Protocolo da camada de aplicação."},
        {"front": "Onde opera?", "back": "Na camada de aplicação do modelo OSI."}
    ]

    # 2. Enviamos uma requisição válida
    response = client.post(
        "/generate-flashcards",
        json={
            "title": "Redes de Computadores",
            "content": "O protocolo HTTP opera na camada de aplicação."
        }
    )

    # 3. Validamos a resposta
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["front"] == "O que é HTTP?"
    assert data[0]["back"] == "Protocolo da camada de aplicação."