import os
import json
import requests
from typing import List
from pydantic import BaseModel, Field, ValidationError
from fastapi import HTTPException

# Se OLLAMA_URL não estiver definido, usa o localhost por padrão para desenvolvimento local
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))


class FlashcardSchema(BaseModel):
    front: str = Field(..., description="A pergunta ou conceito na frente do flashcard")
    back: str = Field(..., description="A resposta ou explicação no verso do flashcard")


class FlashcardResponse(BaseModel):
    flashcards: List[FlashcardSchema] = Field(..., description="Lista de flashcards gerados pela IA")


def generate_flashcards_with_ai(title: str, content: str) -> List[dict]:
    prompt = f"""
Você é um professor especialista em criar flashcards de estudo rigorosos e 100% fiéis ao material fornecido.
Com base no título e no conteúdo abaixo, crie uma lista de flashcards focados em conceitos-chave.

REGRAS CRÍTICAS:
1. Baseie-se APENAS nas informações explícitas do texto abaixo. NUNCA invente definições científicas, termos ou conceitos que não estejam escritos no texto.
2. Cada flashcard deve ser direto ao ponto (Front: pergunta clara / Back: resposta curta baseada estritamente no texto).
3. O seu retorno DEVE ser estritamente um objeto JSON válido contendo uma chave "flashcards" que seja um array de objetos com as chaves "front" e "back".
4. Não inclua nenhum texto adicional, markdown extra ou explicações fora do JSON.

Exemplo de bom comportamento:
Texto: "A glicólise ocorre no citoplasma e quebra a glicose em piruvato."
Saída JSON:
{{
  "flashcards": [
    {{"front": "Onde ocorre a glicólise?", "back": "No citoplasma."}},
    {{"front": "O que a glicólise faz com a glicose?", "back": "A quebra em piruvato."}}
  ]
}}

Agora, com base no título e no conteúdo abaixo, crie flashcards seguindo rigorosamente este mesmo padrão de precisão e usando APENAS o texto fornecido (sem inventar termos):
Título: {title}
Conteúdo: {content}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1  # baixa temperatura para máxima fidelidade ao texto
        },
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=OLLAMA_TIMEOUT)
        response.raise_for_status()

        data = response.json()
        raw_text = data.get("response", "{}")

        parsed_data = json.loads(raw_text)

        # Se a LLM retornar uma lista direta, adaptamos para o formato esperado
        if isinstance(parsed_data, list):
            parsed_data = {"flashcards": parsed_data}

        validated_response = FlashcardResponse.model_validate(parsed_data)

        if not validated_response.flashcards:
            raise HTTPException(
                status_code=500,
                detail="A IA não gerou nenhum flashcard para este conteúdo.",
            )

        return [card.model_dump() for card in validated_response.flashcards]

    except HTTPException:
        raise
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 404:
            raise HTTPException(
                status_code=503,
                detail=f"Modelo '{OLLAMA_MODEL}' não encontrado no Ollama. Rode: ollama pull {OLLAMA_MODEL}",
            )
        raise HTTPException(status_code=503, detail=f"Erro de comunicação com o Ollama: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Erro de comunicação com o Ollama: {str(e)}")
    except (json.JSONDecodeError, ValidationError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o formato da resposta da IA: {str(e)}")