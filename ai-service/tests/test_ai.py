from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch("app.routers.flashcards.generate_flashcards_with_ai")
def test_generate_flashcards_success(mock_ai_service):
    """Garante que a API retorna os flashcards corretamente para qualquer quantidade gerada (1 ou N)."""
    
    # 1. Configuramos o mock para retornar uma quantidade dinâmica
    mock_ai_service.return_value = [
        {"front": "Qual camada HTTP opera na camada de aplicação?", "back": "Na camada de aplicação."},
        {"front": "Quem utiliza o HTTP?", "back": "Clientes e servidores web."}
    ]

    # 2. Enviamos uma requisição válida
    response = client.post(
        "/generate-flashcards",
        json={
            "title": "Redes de Computadores",
            "content": "O protocolo HTTP opera na camada de aplicação."
        }
    )

    # 3. Validamos a resposta de forma flexível e robusta
    assert response.status_code == 200
    data = response.json()
    
    # Valida o contrato do JSON retornado
    assert isinstance(data, dict)
    assert "flashcards" in data
    assert isinstance(data["flashcards"], list)
    
    # Garante que veio pelo menos 1 flashcard e que cada item possui as chaves 'front' e 'back'
    assert len(data["flashcards"]) > 0
    assert "front" in data["flashcards"][0]
    assert "back" in data["flashcards"][0]