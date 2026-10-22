from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch("app.routers.flashcards.generate_flashcards_with_ai")
def test_generate_flashcards_ai_failure(mock_ai_service):
    """Garante que a API lida graciosamente com falhas na IA (ex: Ollama fora do ar)."""
    
    # 1. Configuramos o mock para lançar uma exceção simulando erro no serviço de IA
    mock_ai_service.side_effect = Exception("Ollama connection failed")

    # 2. Enviamos uma requisição válida
    response = client.post(
        "/generate-flashcards",
        json={
            "title": "Redes de Computadores",
            "content": "O protocolo HTTP opera na camada de aplicação."
        }
    )

    # 3. Validamos que a aplicação trata o erro adequadamente (ex: Status 503 ou 500 tratada)
    assert response.status_code in [500, 503]
    data = response.json()
    assert "detail" in data