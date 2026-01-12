FROM python:3.11-slim

#zależności systemowe dla PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc

WORKDIR /app

# Instalacja bibliotek Pythona
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Uruchomienie serwera Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]