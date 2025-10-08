# Launchloom Backend

Production-ready FastAPI backend for Launchloom.

## Architecture Overview

- **API Framework**: FastAPI with async/await patterns
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis for session and query caching
- **Authentication**: JWT-based with RBAC
- **Background Jobs**: Celery with Redis broker
- **Deployment**: Docker containers with health checks

## Quick Start

```bash
# Development setup
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Start services
docker compose up -d postgres redis
python -m alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Background worker (separate terminal)
celery -A app.celery worker --loglevel=info
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://i2s_user:password@localhost:5432/i2s_db
DATABASE_TEST_URL=postgresql://i2s_user:password@localhost:5432/i2s_test_db

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=3600

# Security
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
PASSWORD_HASH_ALGORITHM=bcrypt

# Rate limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# AI Services (optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Monitoring
LOG_LEVEL=INFO
SENTRY_DSN=your-sentry-dsn
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `DELETE /auth/logout` - Logout user

### Ideas & Projects
- `POST /api/v1/ideas` - Create new idea
- `GET /api/v1/ideas` - List user's ideas
- `GET /api/v1/ideas/{id}` - Get specific idea
- `PUT /api/v1/ideas/{id}` - Update idea
- `DELETE /api/v1/ideas/{id}` - Delete idea

### Dossier Generation
- `POST /api/v1/dossiers` - Generate dossier from idea
- `GET /api/v1/dossiers/{id}` - Get dossier status/results
- `POST /api/v1/dossiers/{id}/regenerate` - Regenerate specific sections

### Export & Integration
- `GET /api/v1/dossiers/{id}/export` - Export dossier as JSON/ZIP
- `POST /api/v1/github/create-repo` - Create GitHub repository

### System
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/status` - System status and version

## Database Schema

See `app/models/` for complete SQLAlchemy models:
- Users with role-based permissions
- Ideas with versioning and scoring
- Dossiers with generated artifacts
- Audit logs for compliance
- Background job tracking

## Development

```bash
# Run tests
pytest tests/ -v --cov=app

# Format code
black app/ tests/
isort app/ tests/

# Type checking
mypy app/

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Load test data
python scripts/seed_data.py
```

## Production Deployment

See `docker-compose.prod.yml` and `k8s/` for production configurations.

## Security Features

- JWT authentication with refresh tokens
- Rate limiting per IP and user
- Input validation with Pydantic
- SQL injection prevention
- XSS protection headers
- CORS configuration
- Request/response logging
- Password hashing with bcrypt

## Performance Features

- Redis caching for frequent queries
- Database connection pooling
- Async request handling
- Background job processing
- Response compression
- CDN-ready static serving
- Query optimization with indexes

## Monitoring & Observability

- Health checks for all dependencies
- Structured JSON logging
- Prometheus metrics export
- Error tracking with Sentry
- Request tracing
- Performance monitoring