"""Database configuration and session management."""

import logging
from typing import AsyncGenerator, Generator

from sqlalchemy import create_engine, pool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Base class for SQLAlchemy models
Base = declarative_base()

# Synchronous database engine (for migrations and admin tasks)
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    poolclass=pool.QueuePool,
    echo=settings.is_development,  # Log SQL in development
)

# Synchronous session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Asynchronous database engine (for API requests)
async_engine = create_async_engine(
    str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    echo=settings.is_development,  # Log SQL in development
)

# Asynchronous session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency to get synchronous database session.
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get asynchronous database session.
    
    Yields:
        Async database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with async_engine.begin() as conn:
        # Import all models to ensure they're registered
        from app.models import audit, dossier, idea, user, workspace  # noqa: F401
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")


async def close_db() -> None:
    """Close database connections."""
    await async_engine.dispose()
    engine.dispose()
    logger.info("Database connections closed")


class DatabaseHealthCheck:
    """Database health check utility."""
    
    @staticmethod
    async def check() -> dict:
        """Check database connectivity.
        
        Returns:
            Health status dictionary
        """
        try:
            async with AsyncSessionLocal() as session:
                # Simple query to test connection
                result = await session.execute("SELECT 1")
                result.fetchone()
                
            return {
                "database": "healthy",
                "connection": "active",
                "pool_size": async_engine.pool.size(),
                "checked_out": async_engine.pool.checked_out(),
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "database": "unhealthy",
                "error": str(e),
                "connection": "failed",
            }


# Health check instance
db_health = DatabaseHealthCheck()
