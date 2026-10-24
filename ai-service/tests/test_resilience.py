import pytest
from unittest.mock import patch
import requests
from fastapi import HTTPException
from app.services.ai_service import generate_flashcards_with_ai

@patch("app.services.ai_service.requests.post")
def test_ai_service_ollama_down(mock_requests_post):
    """Garante que o serviço de IA dispara HTTPException 503 quando o Ollama está inacessível."""
    
    # Simula uma falha de conexão de rede (Ollama fora do ar / container desligado)
    mock_requests_post.side_effect = requests.exceptions.RequestException("Connection refused")

    # Garante que a função dispara o erro HTTP 503 tratado corretamente pela arquitetura
    with pytest.raises(HTTPException) as exc_info:
        generate_flashcards_with_ai("Redes", "Conteúdo de teste")

    assert exc_info.value.status_code == 503
    assert "Ollama" in exc_info.value.detail or "conexão" in exc_info.value.detail.lower()