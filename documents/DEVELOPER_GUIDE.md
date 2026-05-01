# Project Engagement Tracker - Developer Guide

## Overview

PS Engagement Tracker is a secure, Databricks-integrated application for manual RAG (Red/Amber/Green) project health tracking and mitigation management. This guide covers setting up the development environment, understanding the architecture, and contributing to the project.

## Project Structure

```
ps-engagement-tracker/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py               # Application entry point
│   │   ├── config.py             # Configuration management
│   │   ├── database.py           # Database setup
│   │   ├── models/               # SQLAlchemy models
│   │   │   └── __init__.py
│   │   ├── schemas/              # Pydantic schemas
│   │   │   └── __init__.py
│   │   ├── routers/
│   │   │   ├── projects.py       # Project endpoints
│   │   │   └── health.py         # Health check endpoints
│   │   └── utils/
│   │       └── auth.py           # Authentication (mock/Azure AD)
│   ├── requirements.txt
│   ├── tests/                    # Pytest tests
│   │   └── test_projects_api.py
│   ├── main.py                   # Uvicorn entry point
│   └── .env.example
├── frontend/          # React + TypeScript
│   ├── src/
│   │   ├── main.tsx              # Application entry point
│   │   ├── App.tsx               # Main app component
│   │   ├── types/index.ts        # TypeScript definitions
│   │   ├── config.ts             # Frontend configuration
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Main layout
│   │   │   ├── Header.tsx        # Header component
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── HealthBadge.tsx   # RAG status badge
│   │   │   └── HealthUpdateModal.tsx  # Update form
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx  # Dashboard
│   │   │   └── ProjectDetailPage.tsx  # Project detail
│   │   ├── api/
│   │   │   └── client.ts         # API client
│   │   ├── store/
│   │   │   └── ui.ts             # Zustand store
│   │   └── index.css             # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
├── documents/
│   ├── ARCHITECTURE.md
│   └── DEVELOPER_GUIDE.md
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+ (or use Docker)
- Git

### Backend Setup

1. **Create virtual environment:**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations (if using Alembic):**

   ```bash
   alembic upgrade head
   ```

5. **Start development server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Technology Stack

### Backend

- **Framework:** FastAPI (async Python web framework)
- **Database ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL (production) / SQLite (development)
- **Data Validation:** Pydantic v2
- **Integration:** Databricks SQL Connector

### Frontend

- **Framework:** React 18
- **Language:** TypeScript
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

## API Endpoints

### Projects

- `GET /api/projects/` - List all projects with optional pagination, search, and filtering by status, PM, client, and SLT.
- `GET /api/projects/{project_id}` - Get detailed information for a single project.
- `POST /api/projects/{project_id}/status-update` - Create a new health status update for a project.
- `GET /api/projects/{project_id}/change-history` - Get the full health status history for a project.
- `GET /api/projects/{project_id}/rag-trend` - Get the recent RAG trend for a project.
- `GET /api/projects/{project_id}/team` - Get the team members for a project.

### Health

- `GET /api/projects/overview/rag-project-health` - Get RAG distribution by project count.
- `GET /api/projects/overview/rag-project-revenue` - Get RAG distribution by revenue
- `GET /api/projects/overview/engagements-by-pm` - Get a summary of project counts per project manager.
- `GET /api/projects/overview/engagements-by-client` - Get a summary of project counts per client.
- `GET /api/projects/overview/closing-projects` - Get counts of projects closing in 30 and 45 days.
- `GET /api/projects/overview/delivery-cycle` - Get summary by delivery cycle
- `GET /health` - Health check

## Database Models

### ProjectHealthUpdate

Stores RAG status updates with full audit trail.

```python
- id: Primary key
- project_code: Reference to Float project
- health_status: RAG (red/amber/green)
- rag_by_revenue: RAG status for revenue
- delivery_cycle: Stage of the project (initiation, execution, etc.)
- risk_area: Description of risks
- mitigation_plan: Mitigation strategy
- comments: Additional notes
- created_by: User identifier
- created_at: Timestamp
```

### ProjectCache

Caches read-only project data from Databricks.

```python
- id: Primary key
- project_code: Unique identifier
- project_name, client_name, stage, etc.
- last_updated: Cache timestamp
```

## Configuration

### Environment Variables

**Backend (.env):**

```
DATABASE_URL=postgresql://user:pass@localhost/db
DEBUG=False
```

**Frontend (.env):**

```
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=PS Engagement Tracker
```

## Development Workflow

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
pylint app/

# Frontend linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Backend
cd backend
# Run with gunicorn or uvicorn in production mode

# Frontend
cd frontend
npm run build
# Output in dist/ directory
```

## Databricks Integration

### Data Flow

1. **Float** → Raw project data
2. **Databricks** → Sanitized delta tables
3. **Application** → Reads from Databricks, stores RAG data in PostgreSQL

### Querying Databricks

The application connects to Databricks using the Databricks SQL Connector, with connection logic integrated into the backend's data access layer rather than a separate utility file. For development, this connection can be mocked to return sample data.

To enable real Databricks integration:

1. Set `DATABRICKS_TOKEN` and `DATABRICKS_WORKSPACE_URL`
2. Ensure your Databricks token has access to the specified catalog/schema

## Authentication

Currently using mock authentication for development. To integrate Azure AD:

1. Install `python-jose`, `cryptography`
2. Update `backend/app/utils/auth.py` with Azure AD validation
3. Update frontend API client to send auth tokens
4. Configure Azure AD app in Azure Portal

## Deployment

### Docker

```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/tracker
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ps_engagement_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Troubleshooting

### Backend Issues

**Port already in use:**

```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>
```

**Database connection errors:**

- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check credentials

### Frontend Issues

**API connection errors:**

- Verify VITE_API_URL in .env
- Ensure backend is running on the specified port
- Check browser console for CORS errors

**Module not found:**

```bash
npm install
npm run build
```

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test
3. Submit pull request with description

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Databricks SQL Connector](https://docs.databricks.com/en/dev-tools/python-sql-connector.html)
