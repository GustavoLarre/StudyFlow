import json
from unittest.mock import patch, MagicMock
from app.services.ai_service import generate_flashcards_with_ai

@patch("app.services.ai_service.requests.post")
def test_ai_service_success(mock_requests_post):
    """Garante que o serviço de IA chama o Ollama corretamente e mapeia a resposta."""
    
    # Simulamos a resposta que o Ollama retornaria (um JSON contendo o texto gerado em formato JSON string)
    mock_response_data = [
        {"front": "O que é FastAPI?", "back": "Um framework web moderno e rápido para Python."},
        {"front": "O que é Ollama?", "back": "Ferramenta para rodar LLMs localmente."}
    ]
    
    mock_res_instance = MagicMock()
    mock_res_instance.status_code = 200
    mock_res_instance.json.return_value = {
        "response": json.dumps(mock_response_data)
    }
    mock_requests_post.return_value = mock_res_instance

    # Executamos a função do serviço
    result = generate_flashcards_with_ai("Introdução ao FastAPI", "FastAPI é rápido e usa Pydantic.")

    # Validamos se o resultado veio estruturado como esperado
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["front"] == "O que é FastAPI?"
    assert result[1]["back"] == "Ferramenta para rodar LLMs localmente."