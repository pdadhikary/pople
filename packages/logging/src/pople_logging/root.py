import tomllib
from pathlib import Path

_WORKSPACE_MARKER = ("tool", "uv", "workspace")


def find_workspace_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    for candidate in [current, *current.parents]:
        pyproject = candidate / "pyproject.toml"
        if not pyproject.is_file():
            continue
        try:
            data = tomllib.loads(pyproject.read_text(encoding="utf-8"))
        except Exception:
            continue
        node: object = data
        for key in _WORKSPACE_MARKER:
            if not isinstance(node, dict) or key not in node:
                node = None
                break
            node = node[key]
        if node is not None:
            return candidate
    return Path.cwd().resolve()


def resolve_log_dir(log_dir: str | Path | None = None) -> Path:
    path = Path(str(log_dir)).expanduser().resolve() if log_dir else find_workspace_root() / "logs"
    path.mkdir(parents=True, exist_ok=True)
    return path


__all__ = ["find_workspace_root", "resolve_log_dir"]
