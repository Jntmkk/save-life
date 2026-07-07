FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src

RUN pip install --no-cache-dir -e .

ENV PYTHONUNBUFFERED=1
ENV III_URL=ws://backend:49134

CMD ["python", "src/math_worker.py"]
