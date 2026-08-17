# pople-logging

Shared logging configuration for pople services (FastAPI apps and workers).

Logs are written under `<workspace root>/logs/`:

- `<service>.log`   — human-readable text (rotating)
- `<service>.jsonl` — one JSON object per line (rotating)

## Usage

```python
from pople_logging import setup_logging, get_logger

logger = get_logger("worker")
setup_logging("worker")  # reads env, logs go to logs/worker.log
```

FastAPI request logging:

```python
from pople_logging import RequestLoggingMiddleware, setup_logging

setup_logging("api")
app.add_middleware(RequestLoggingMiddleware, service="api")
```

## Settings (env or kwargs to `setup_logging`)

- `POPLE_LOG_DIR`          — override logs directory (default `<root>/logs`)
- `POPLE_LOG_LEVEL`        — e.g. `INFO` (default `INFO`)
- `POPLE_LOG_CONSOLE`      — mirror to stdout (default `1`)
- `POPLE_LOG_TEXT`         — write `<service>.log` text file (default `1`)
- `POPLE_LOG_JSON`         — write `<service>.jsonl` JSON file (default `1`)
- `POPLE_LOG_MAX_BYTES`   — rotate size, bytes (default `10485760`)
- `POPLE_LOG_BACKUP_COUNT` — rotated files to keep (default `5`)