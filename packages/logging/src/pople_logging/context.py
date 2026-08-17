from contextvars import ContextVar, Token

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    return request_id_var.get()


def set_request_id(value: str) -> Token[str]:
    return request_id_var.set(value)


__all__ = ["get_request_id", "request_id_var", "set_request_id"]
