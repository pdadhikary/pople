#!/bin/bash

set -e

echo "Applying migrations..."

cd /workspace/packages/database && uv run alembic upgrade head

echo "Migrations completed successfully. Starting application..."

cd /workspace

exec "$@"
