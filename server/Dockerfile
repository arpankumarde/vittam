FROM python:3.13.11-alpine3.23
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy the application into the container.
COPY . /app

# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen
# RUN uv sync --frozen --no-cache

# Run the application.
# CMD ["uv", "run", "app/app.py", "--port", "80", "--host", "0.0.0.0"]
CMD ["uv", "run", "runner.py"]
