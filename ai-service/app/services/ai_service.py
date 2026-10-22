import os
import json
import requests
from typing import List
from pydantic import BaseModel, Field, ValidationError
from fastapi import HTTPException

# URL do Ollama configurada via variável de ambiente ou padrão do Docker Compose
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen")

# Modelo Pydantic para validar cada flashcard individualmente
class FlashcardSchema(BaseModel):
    front: str = Field(..., description="A pergunta ou conceito na frente do flashcard")
    back: str = Field(..., description="A resposta ou explicação no verso do flashcard")

def generate_flashcards_with_ai(title: str, content: str) -> List[dict]:
    prompt = f"""
Você é um assistente educacional especialista em criar flashcards de estudo.
Com base no título e no conteúdo fornecidos abaixo, crie uma lista de flashcards (perguntas e respostas diretas).
O seu retorno DEVE ser estritamente um array JSON válido de objetos, contendo apenas as chaves "front" e "back". Não inclua nenhum texto adicional, markdown extra ou explicações fora do JSON.

Título: {title}
Conteúdo: {content}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json" # Força o Ollama a retornar um JSON estruturado
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        raw_text = data.get("response", "[]")

        # Garante que o texto retornado pela LLM seja parseado como JSON
        parsed_data = json.loads(raw_text)

        if not isinstance(parsed_data, list):
            raise ValueError("A IA não retornou uma lista válida de flashcards.")

        # Valida cada item usando Pydantic para garantir conformidade do schema
        validated_flashcards = []
        for item in parsed_data:
            validated_card = FlashcardSchema(**item)
            validated_flashcards.append(validated_card.model_dump())

        return validated_flashcards

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Erro de comunicação com o Ollama: {str(e)}")
    except (json.JSONDecodeError, ValidationError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o formato da resposta da IA: {str(e)}")