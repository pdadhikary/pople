from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pople_logging import RequestLoggingMiddleware, get_logger, setup_logging

from routes.jobs import JOBS_DIR, jobs_router
from settings import settings

setup_logging("api", level=settings.log_level)

logger = get_logger("api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("API starting")
    yield
    logger.info("API stopped")


app = FastAPI(lifespan=lifespan)

app.add_middleware(RequestLoggingMiddleware, service="api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])

JOBS_DIR.mkdir(exist_ok=True)


@app.get("/", include_in_schema=False)
def root():
    return "Pople API: Hello!"


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("/workspace/apps/api/static/images/favicon.png")
