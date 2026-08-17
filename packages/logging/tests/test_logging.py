import json
import logging
from pathlib import Path

import pytest

from pople_logging import (
    JsonFormatter,
    TextFormatter,
    get_logger,
    setup_logging,
)
from pople_logging.context import request_id_var
from pople_logging.root import find_workspace_root


@pytest.fixture(autouse=True)
def _reset_logging():
    yield
    root = logging.getLogger()
    for handler in list(root.handlers):
        root.removeHandler(handler)
        handler.close()
    root.setLevel(logging.WARNING)
    request_id_var.set("-")


def _record(msg: str = "hello", *, name: str = "worker") -> logging.LogRecord:
    return logging.LogRecord(
        name=name, level=logging.INFO, pathname=__file__, lineno=1, msg=msg, args=(), exc_info=None
    )


def test_text_formatter_includes_level_and_message():
    out = TextFormatter().format(_record("hi"))
    assert " INFO " in out
    assert "hi" in out
    assert "[" in out  # req_id bracket


def test_json_formatter_outputs_valid_json():
    out = JsonFormatter().format(_record("hi"))
    obj = json.loads(out)
    assert obj["msg"] == "hi"
    assert obj["level"] == "INFO"
    assert "ts" in obj and "req_id" in obj and "service" in obj


def test_request_id_appears_in_records():
    request_id_var.set("abc123")
    out = TextFormatter().format(_record("hi"))
    assert "[abc123]" in out
    obj = json.loads(JsonFormatter().format(_record("hi")))
    assert obj["req_id"] == "abc123"


def test_setup_logging_writes_text_and_json_files(tmp_path):
    logger = setup_logging("worker", log_dir=tmp_path, level="DEBUG")
    logger.info("ordered %d", 42)

    text_lines = (tmp_path / "worker.log").read_text(encoding="utf-8")
    assert "ordered 42" in text_lines

    json_lines = [
        json.loads(line)
        for line in (tmp_path / "worker.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    assert any(obj["msg"] == "ordered 42" for obj in json_lines)


def test_setup_logging_can_disable_console(tmp_path, capsys):
    setup_logging("worker", log_dir=tmp_path, level="INFO", console=False)
    logging.getLogger("worker").info("no stdout")
    captured = capsys.readouterr()
    assert "no stdout" not in captured.out + captured.err


def test_find_workspace_root_locates_pople_root():
    root = find_workspace_root(Path(__file__))
    assert (root / "pyproject.toml").is_file()
    assert (root / "packages" / "logging").is_dir()


def test_get_logger_defaults_to_configured_service(tmp_path):
    setup_logging("worker", log_dir=tmp_path)
    assert get_logger().name == "worker"
