# Usa uma versão leve e oficial do Python
FROM python:3.10-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências para dentro do container
COPY requirements.txt .

# Instala as dependências listadas
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante dos arquivos da pasta para o container
COPY . .

# Expõe a porta onde o serviço vai rodar
EXPOSE 5000

# Comando padrão para iniciar o servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
