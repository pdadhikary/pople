from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from .settings import get_settings

engine = create_engine(get_settings().database_url)

async_engine: AsyncEngine = create_async_engine(get_settings().database_url)

__all__ = ["async_engine", "engine"]
