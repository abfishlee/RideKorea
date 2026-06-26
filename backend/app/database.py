from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from .config import settings

# Create async engine for PostgreSQL connection
engine = create_async_engine(
    settings.public_db_url_async,
    echo=settings.SQL_ECHO,  # Toggle SQL logging via SQL_ECHO env (default: on)
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Base class for SQLAlchemy ORM models
Base = declarative_base()

# FastAPI dependency for getting DB session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
