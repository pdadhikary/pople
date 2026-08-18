FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN groupadd --gid 1000 pople \
    && useradd --uid 1000 --gid pople --create-home --shell /bin/bash pople

WORKDIR /workspace

COPY pyproject.toml .python-version uv.lock ./

# Workspace dependencies
COPY apps/api/pyproject.toml apps/api/pyproject.toml
COPY packages/database/pyproject.toml packages/database/pyproject.toml
COPY packages/logging/pyproject.toml packages/logging/pyproject.toml
COPY packages/orca/pyproject.toml packages/orca/pyproject.toml

# Copy source for workspace dependencies
COPY packages/database/ packages/database/
COPY packages/logging/ packages/logging/

RUN uv sync --package api --frozen --no-dev

# Copy API source
COPY apps/api/ apps/api/

RUN chown -R pople:pople /workspace

USER pople

RUN chmod +x /workspace/apps/api/entrypoint.sh
ENTRYPOINT ["/workspace/apps/api/entrypoint.sh"]

CMD ["uv", "run", "--directory", "apps/api", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
