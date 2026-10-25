import json
from unittest.mock import MagicMock, patch

import pytest
import requests
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_service import generate_flashcards_with_ai

PATCH_TARGET = "app.services.ai_service.requests.post"


# ---------- helpers ----------

def ollama_ok(body):
    """Simula uma resposta 200 do Ollama cujo campo 'response' carrega `body`."""
    res = MagicMock()
    res.status_code = 200
    res.raise_for_status.return_value = None
    raw = body if isinstance(body, str) else json.dumps(body)
    res.json.return_value = {"response": raw}
    return res


def ollama_http_error(status_code):
    """Simula o Ollama respondendo com erro HTTP (404 modelo ausente, 500 etc.)."""
    res = MagicMock()
    res.status_code = status_code
    res.raise_for_status.side_effect = requests.exceptions.HTTPError(
        f"{status_code} error", response=res
    )
    return res


def call_service():
    return generate_flashcards_with_ai("Redes", "Conteúdo de teste")


# ---------- Ollama inacessível (503) ----------

@pytest.mark.parametrize(
    "error",
    [
        requests.exceptions.ConnectionError("Connection refused"),
        requests.exceptions.Timeout("Read timed out"),
        requests.exceptions.RequestException("Erro genérico de rede"),
    ],
    ids=["connection_refused", "timeout", "generic_request_error"],
)
@patch(PATCH_TARGET)
def test_ollama_unreachable_returns_503(mock_post, error):
    """Falhas de rede com o Ollama devem virar HTTPException 503."""
    mock_post.side_effect = error

    with pytest.raises(HTTPException) as exc_info:
        call_service()

    assert exc_info.value.status_code == 503
    assert "Ollama" in exc_info.value.detail


@patch(PATCH_TARGET)
def test_missing_model_returns_503_with_pull_hint(mock_post):
    """Modelo não baixado (404 do Ollama) deve orientar o usuário a rodar 'ollama pull'."""
    mock_post.return_value = ollama_http_error(404)

    with pytest.raises(HTTPException) as exc_info:
        call_service()

    assert exc_info.value.status_code == 503
    assert "ollama pull" in exc_info.value.detail


@patch(PATCH_TARGET)
def test_ollama_internal_error_returns_503(mock_post):
    """Erro 500 do próprio Ollama continua sendo falha de comunicação (503)."""
    mock_post.return_value = ollama_http_error(500)

    with pytest.raises(HTTPException) as exc_info:
        call_service()

    assert exc_info.value.status_code == 503
    assert "ollama pull" not in exc_info.value.detail


# ---------- Resposta inválida da IA (500) ----------

@pytest.mark.parametrize(
    "body",
    [
        "isso não é um json",                      # texto solto
        '{"flashcards": [',                        # JSON truncado
        {"flashcards": [{"front": "Só pergunta"}]},  # falta o campo 'back'
        {"cards": [{"front": "a", "back": "b"}]},    # chave errada
        {"flashcards": "não é uma lista"},         # tipo errado
        "texto json válido mas string",            # JSON válido porém não objeto/lista
    ],
    ids=[
        "texto_solto",
        "json_truncado",
        "campo_back_ausente",
        "chave_errada",
        "flashcards_nao_lista",
        "json_string",
    ],
)
@patch(PATCH_TARGET)
def test_invalid_ai_output_returns_500(mock_post, body):
    """Qualquer saída fora do contrato deve virar HTTPException 500, nunca um erro não tratado."""
    if body == "texto json válido mas string":
        body = json.dumps("apenas uma string")  # raw_text = '"apenas uma string"'
    mock_post.return_value = ollama_ok(body)

    with pytest.raises(HTTPException) as exc_info:
        call_service()

    assert exc_info.value.status_code == 500
    assert "formato da resposta da IA" in exc_info.value.detail


@patch(PATCH_TARGET)
def test_empty_flashcards_list_returns_500(mock_post):
    """Lista vazia deve gerar erro claro em vez de sucesso silencioso."""
    mock_post.return_value = ollama_ok({"flashcards": []})

    with pytest.raises(HTTPException) as exc_info:
        call_service()

    assert exc_info.value.status_code == 500
    assert "nenhum flashcard" in exc_info.value.detail


# ---------- Caminhos de sucesso tolerantes ----------

@patch(PATCH_TARGET)
def test_accepts_bare_list_from_ai(mock_post):
    """Se a IA devolver uma lista direta, o serviço adapta e valida normalmente."""
    mock_post.return_value = ollama_ok([{"front": "P?", "back": "R."}])

    result = call_service()

    assert result == [{"front": "P?", "back": "R."}]


# ---------- Contrato da chamada ao Ollama ----------

@patch(PATCH_TARGET)
def test_request_sent_to_ollama_has_expected_shape(mock_post):
    """Garante parâmetros importantes da requisição: modelo, JSON mode, timeout e prompt."""
    mock_post.return_value = ollama_ok({"flashcards": [{"front": "a", "back": "b"}]})

    generate_flashcards_with_ai("Título X", "Conteúdo Y")

    _, kwargs = mock_post.call_args
    payload = kwargs["json"]

    assert payload["stream"] is False
    assert payload["format"] == "json"
    assert "context" not in payload["options"]
    assert payload["options"]["temperature"] <= 0.2
    assert "Título X" in payload["prompt"]
    assert "Conteúdo Y" in payload["prompt"]
    assert kwargs["timeout"] >= 60


# ---------- Ponta a ponta pela API ----------

@pytest.mark.parametrize(
    "side_effect, expected_status",
    [
        (requests.exceptions.ConnectionError("Connection refused"), 503),
        (None, 500),  # resposta inválida, definida abaixo
    ],
    ids=["ollama_down", "ai_output_invalid"],
)
@patch(PATCH_TARGET)
def test_api_propagates_service_error_status(mock_post, side_effect, expected_status):
    """O status do erro do serviço deve chegar ao cliente HTTP sem ser reescrito."""
    if side_effect is not None:
        mock_post.side_effect = side_effect
    else:
        mock_post.return_value = ollama_ok("lixo que não é json")

    client = TestClient(app)
    response = client.post(
        "/generate-flashcards",
        json={"title": "Redes", "content": "Conteúdo de teste"},
    )

    assert response.status_code == expected_status
    assert "detail" in response.json()