from sqlalchemy import create_engine

from .settings import get_settings

engine = create_engine(get_settings().database_url)


__all__ = ["engine"]
