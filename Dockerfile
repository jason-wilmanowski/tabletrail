FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt
RUN apt-get update && apt-get install -y curl

COPY . .

CMD ["uvicorn", "table_trail_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]