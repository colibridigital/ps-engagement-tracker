# PS Engagement Tracker - Architecture Guide

## System Overview

PS Engagement Tracker is a three‑tier web application that uses a PostgreSQL database to consume project data synchronized from an external source such as Float via Databricks. This synchronization is handled by a separate process and the data is treated as read‑only within the application.
The application maintains its own PostgreSQL tables to manage engagement‑specific information, including project health statuses, delivery cycle details, mitigation actions, comments, and related tracking data.

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser / Client                      │
│                   (React + TypeScript)                       │
└──────────────────────────────────┬──────────────────────────┘
                                   │
                    HTTP/REST API (JSON)
                                   │
┌──────────────────────────────────▼──────────────────────────┐
│              FastAPI Backend Server                          │
│  (Port 8000, async Python web framework)                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Authentication Layer (Azure AD)          │  │
│  │            CORS Middleware                          │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes (FastAPI routers)           │  │
│  │  ├─ GET /api/projects/                             │  │
│  │  ├─ GET /api/projects/{code}                       │  │
│  │  ├─ POST /api/projects/{project_id}/status-update  │  │
│  │  ├─ GET /api/projects/{project_id}/health-history  │  │
│  │  ├─ GET /api/projects/overview/health-distribution │  │
│  │  └─ GET /api/projects/overview/rag-project-revenue │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                   │  │
│  │  ├─ Project Service                                │  │
│  │  ├─ Health Update Service                          │  │
│  │  └─ Statistics & Reporting                         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Data Access Layer (SQLAlchemy ORM)     │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   PostgreSQL                    Databricks
   Database                      (Read-only)
   (App Data)                    (Float Data)
        │                             │
   ┌────▼─────┐              ┌───────▼────────┐
   │ Project  │              │ prd_bronze.    │
   │ Health   │              │ abit_ps_       │
   │ Updates  │              │ engagement.    │
   │ (RAG,    │              │ float_project_ │
   │ Risks,   │              │ data    │
   │ etc.)    │              │                │
   │          │              │ (Read-only,    │
   │ Insert   │              │ sourced from   │
   │ only     │              │ Float)         │
   │ model    │              │                │
   └──────────┘              └────────────────┘
```

## Component Architecture

### Frontend (React + TypeScript)

#### Technology Stack

- **Framework**: React 18
- **Language**: TypeScript for type safety
- **State Management**: Zustand for lightweight global state
- **Data Fetching**: TanStack Query for server state management
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Build**: Vite for fast development and production builds

#### Structure

```
src/
├── main.tsx                 # React entry point with Query Client
├── App.tsx                  # Routes and layout setup
├── types.ts                 # TypeScript definitions
├── config.ts                # Frontend configuration
├── components/
│   ├── Layout.tsx           # Main layout with sidebar
│   ├── Header.tsx           # Top navigation bar
│   ├── Sidebar.tsx          # Navigation menu
│   ├── HealthBadge.tsx      # RAG status display component
│   └── HealthUpdateModal.tsx # Form for health updates
├── pages/
│   ├── OverviewPage.tsx     # Dashboard/project list
│   └── ProjectDetailPage.tsx # Detailed project view
├── api/
│   └── client.ts            # HTTP client with Axios
├── store/
│   └── ui.ts                # Zustand UI state store
└── index.css                # Global Tailwind styles
```

#### Key Components

**OverviewPage**

- Displays project list with RAG status
- Health distribution statistics
- Search and filtering
- Quick update buttons

**ProjectDetailPage**

- Comprehensive project information
- Team member display
- Health history timeline
- Detailed update form

**HealthUpdateModal**

- RAG status selection
- Risk area input
- Mitigation plan textarea
- Comments field

#### State Management (Zustand)

```typescript
UIState
├── includeInternalProjects: boolean
├── searchTerm: string
├── selectedProjectCode: string | null
├── showHealthModal: boolean
└── selectedHealthStatus: HealthStatus | null
```

#### Data Flow

```
API Client (Axios)
       ↓
TanStack Query (React Query)
       ↓
Component State
       ↓
UI Render
```

### Backend (FastAPI)

#### Technology Stack

- **Framework**: FastAPI (async Python)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (production), SQLite (dev)
- **Validation**: Pydantic v2
- **Async Runtime**: Uvicorn
- **External Data**: Databricks SQL Connector

#### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app setup
│   ├── config.py            # Settings with Pydantic
│   ├── database.py          # SQLAlchemy session factory
│   ├── models/              # ORM models package
│   │   └── __init__.py
│   ├── schemas/             # Pydantic schemas package
│   │   └── __init__.py
│   ├── routers/
│   │   ├── projects.py      # Project endpoints
│   │   └── health.py        # Health check endpoint
│   └── utils/
│       └── auth.py          # Auth utilities (mock/Azure AD)
├── main.py                  # Uvicorn entry
├── tests/                   # Pytest tests
│   └── test_projects_api.py
├── requirements.txt         # Python dependencies
└── .env.example             # Configuration template
```

#### API Routes

```
GET    /api/projects/                          List projects
GET    /api/projects/{project_code}            Get project detail
POST   /api/projects/health-update             Create health update
GET    /api/projects/{project_code}/health-history   Get history
GET    /api/projects/overview/rag-project-revenue    Get revenue distribution
GET    /api/projects/overview/health-distribution    Get distribution
GET    /health                                 Health check
```

#### Database Models

**ProjectHealthUpdate**

- Insert-only model for audit trail
- Stores RAG updates with timestamps
- Links to Float project via project_code
- Created_by tracks user identity

```python
class ProjectHealthUpdate(Base):
    __tablename__ = "project_health_updates"

    id: int                    # Primary key
    project_code: str          # Reference to Float
    project_name: str
    client_name: str
    health_status: HealthStatus  # RED, AMBER, GREEN
    risk_area: str             # Risk description
    mitigation_plan: str       # Mitigation strategy
    comments: str              # Additional notes
    created_by: str            # User identifier
    created_at: datetime       # Insert timestamp
    float_last_sync: datetime  # Last sync time
```

**ProjectCache**

- Caches read-only data from Databricks
- Refreshed periodically
- Improves query performance

```python
class ProjectCache(Base):
    __tablename__ = "project_cache"

    id: int
    project_code: str (unique)
    project_name: str
    client_name: str
    stage: str
    project_manager: str
    team_members: str          # JSON or concatenated
    tags: str                  # JSON
    total_budget: str
    budget_type: str
    project_state: str
    start_date: datetime
    end_date: datetime
    last_updated: datetime
    last_sync_from_databricks: datetime
```

#### Request/Response Schemas (Pydantic)

```python
ProjectHealthUpdateCreate
├── project_code: str
├── project_name: str
├── client_name: str
├── health_status: HealthStatus
├── risk_area: str (optional)
├── mitigation_plan: str (optional)
└── comments: str (optional)

ProjectHealthUpdateResponse
├── id: int
├── project_code: str
├── health_status: HealthStatus
├── created_by: str
├── created_at: datetime
└── [same fields as above]

ProjectDetailResponse
├── project: ProjectCacheResponse
├── current_health_update: ProjectHealthUpdateResponse | None
└── health_history: [ProjectHealthUpdateResponse]

HealthStatusDistribution
├── red_count: int
├── amber_count: int
├── green_count: int
└── total_count: int
```

### Databricks Integration

#### Architecture

```
Float (System of Record)
        ↓
        ↓ Export/Sync
        ↓
Databricks Delta Lake
└── prd_bronze.abit_ps_engagement.float_project_sample_data
        ↓
        ↓ SQL Read
        ↓
Backend Data Access Layer (SQLAlchemy)
        ↓
        ↓ In-memory or cache
        ↓
Backend API
        ↓
Frontend
```

#### DatabricksConnector

```python
class DatabricksConnector:
    def get_all_projects(exclude_internal: bool)
    def get_project_by_code(project_code: str)

    # For development:
    def _mock_projects()  # Returns test data
```

#### Data Mapping

| Databricks Field     | Model Field          | Usage                    |
| -------------------- | -------------------- | ------------------------ |
| project_code         | project_code         | Primary identifier       |
| project_name         | project_name         | Display name             |
| client_name          | client_name          | Client filter            |
| stage                | stage                | Project phase            |
| project_manager_name | project_manager      | Display only             |
| project_team_members | team_members         | Team list                |
| tags                 | tags                 | Categorization           |
| total_budget         | total_budget         | Financial                |
| project_state        | project_state        | Status (Confirmed, etc.) |
| start_date, end_date | start_date, end_date | Timeline                 |

### Database Design

#### Insert-Only Architecture

All health updates follow an immutable, insert-only pattern:

1. **New records only** - Never update or delete
2. **Timestamps** - Every record has created_at
3. **User tracking** - created_by identifies who made the update
4. **Full history** - Complete audit trail maintained
5. **Latest determination** - Query by MAX(created_at) per project

#### Indexes

```sql
-- ProjectHealthUpdate
CREATE INDEX idx_project_code ON project_health_updates(project_code);
CREATE INDEX idx_created_at ON project_health_updates(created_at);
CREATE INDEX idx_project_code_created_at ON project_health_updates(project_code, created_at);

-- ProjectCache
CREATE INDEX idx_project_code_cache ON project_cache(project_code);
```

## Data Flow

### Get Project List

```
Frontend Request
├─ GET /api/projects/?include_internal=false&search="term"
│
Backend Processing
├─ Query ProjectHealthUpdate for latest per project
├─ Query DatabricksConnector.get_all_projects()
├─ Filter by search term
├─ Filter by client != "colibri" if exclude_internal
├─ Combine data (Databricks + latest health)
│
Response
└─ [ProjectListResponse]
```

### Update Health Status

```
Frontend Request
├─ POST /api/projects/health-update
├─ {project_code, health_status, risk_area, mitigation_plan, comments}
│
Backend Processing
├─ Authenticate user (Azure AD)
├─ Validate project exists in Databricks
├─ Create new ProjectHealthUpdate record
├─ Insert into database (no updates)
├─ Return created record with id and timestamp
│
Response
└─ ProjectHealthUpdateResponse
```

### Get Project Detail

```
Frontend Request
├─ GET /api/projects/{project_code}
│
Backend Processing
├─ Query Databricks for project metadata
├─ Query ProjectHealthUpdate history (ordered by created_at DESC)
├─ Get current = first record
├─ Combine into ProjectDetailResponse
│
Response
├─ project: ProjectCacheResponse
├─ current_health_update: ProjectHealthUpdateResponse | None
└─ health_history: [ProjectHealthUpdateResponse]
```

## Security Architecture

### Authentication

- **Method**: Azure AD Single Sign-On (SSO)
- **Token**: JWT (mock in development)
- **Implementation**: middleware in FastAPI

### Authorization

- **Level**: Databricks group-based
- **Model**: Project-level via Databricks groups
- **Enforcement**: Application validates via Databricks SDK

### Data Protection

- **Transport**: HTTPS in production
- **Storage**: Encrypted database connections
- **Audit**: Insert-only model provides full audit trail

## Deployment Architecture

### Development

```
┌─────────────────────┐
│  Frontend (Vite)    │
│  localhost:5173     │
├─────────────────────┤
│  Backend (Uvicorn)  │
│  localhost:8000     │
├─────────────────────┤
│  PostgreSQL         │
│  localhost:5432     │
└─────────────────────┘
```

### Production (Docker Compose)

```
┌────────────────────────────────────────────────┐
│         Docker Compose                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Frontend  │  │  Backend   │  │ Postgres │ │
│  │  (Nginx)   │  │ (Uvicorn)  │  │          │ │
│  │  Port 80   │  │ Port 8000  │  │ Port 5432│ │
│  └────────────┘  └────────────┘  └──────────┘ │
└────────────────────────────────────────────────┘
```

### Kubernetes (Optional)

```
Ingress
  ├─ /api  → backend-service:8000
  └─ /     → frontend-service:80

Services
  ├─ backend-deployment (3 replicas)
  ├─ frontend-deployment (2 replicas)
  └─ postgres-statefulset (1 replica)
```

## Monitoring & Logging

### Endpoints

- `/health` - Health check
- `/docs` - FastAPI auto-generated documentation
- `/redoc` - ReDoc documentation

### Logging

- Backend: Python logging module
- Frontend: Console and error tracking

### Metrics (Future)

- Project health distribution over time
- Update frequency analytics
- Performance metrics

## Scalability Considerations

1. **Database**
   - Index on (project_code, created_at) for efficient queries
   - Archive old records if table grows large

2. **Caching**
   - Project list can be cached (5-10 min)
   - Health distribution cached separately
   - Invalidate on new updates

3. **API Rate Limiting**
   - Implement per-user rate limits
   - Throttle Databricks queries

4. **Frontend**
   - Lazy load project list
   - Virtual scrolling for large tables
   - Progressive data loading

## Future Enhancements

1. **Real-time Updates** - WebSocket for live health updates
2. **Advanced Analytics** - Trend analysis, predictive alerts
3. **Notifications** - Email/Slack alerts for status changes
4. **Mobile Support** - Mobile-optimized interface
5. **Advanced Reporting** - Custom report generation
6. **Integration** - Slack, Teams, Jira integration
7. **Automation** - Automated escalation rules
