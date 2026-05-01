# PS Engagement Tracker - Databricks App Deployment Guide

## Overview

Yes, the PS Engagement Tracker can be deployed as a **Databricks App** (or as a set of integrated services within Databricks). This document covers multiple deployment approaches within the Databricks ecosystem.

## Deployment Architecture Options

### Option 1: Databricks Apps (Recommended for Frontend)

Deploy the React frontend as a Databricks App with backend services running separately.

### Option 2: Full Stack on Databricks

- Frontend: Databricks App
- Backend: Databricks Jobs (for API endpoints via Databricks API)
- Database: Databricks SQL Warehouse + Delta Tables
- Project Data: Float data synced to Databricks

### Option 3: Hybrid Deployment

- Frontend: Databricks App
- Backend: External compute (EC2, AKS, GCP Compute)
- Database: Databricks SQL Warehouse or external PostgreSQL
- Project Data: Databricks Delta Tables (read-only)

## Option 1: Databricks Apps Deployment (Recommended)

### Prerequisites

- Databricks Workspace (Premium or higher tier required for Apps)
- Workspace admin access
- Databricks CLI configured
- The PS Engagement Tracker built and ready

### Step 1: Prepare the Frontend Build

```bash
# Build the React application
cd ps-engagement-tracker/frontend
npm install
npm run build

# Output will be in dist/ directory
```

### Step 2: Create Databricks App Structure

Create the following directory structure in your workspace:

```
ps-engagement-tracker-app/
├── app.yaml              # Databricks App configuration
├── dist/                 # React build output
│   ├── index.html
│   ├── assets/
│   └── ...
└── src/                  # Optional: source files
```

### Step 3: Create app.yaml Configuration

Create `app.yaml` in the root of your app directory:

```yaml
name: PS Engagement Tracker
description: Project health tracking and mitigation management

# Define where your frontend files are served from
path: /

# Configure the app environment
env:
  DATABRICKS_HOST: ${DATABRICKS_HOST}
  DATABRICKS_TOKEN: ${DATABRICKS_TOKEN}
  VITE_API_URL: ${VITE_API_URL} # Point to your backend

# Serving configuration
serve:
  type: STATIC
  path: dist
  enable_cors: true
  default_file: index.html

# Optional: Configure backend proxy
proxy:
  /api:
    target: ${BACKEND_URL} # External backend URL
    changeOrigin: true
```

### Step 4: Configure Backend API Endpoint

Create a backend configuration file or set environment variables pointing to your FastAPI backend:

**Option A: External Backend (Recommended)**

```bash
# Set backend URL environment variable
export BACKEND_URL="https://your-fastapi-backend.example.com"
```

**Option B: Databricks-Hosted Backend using Jobs**

Create a Databricks Job to run the FastAPI backend:

```python
# Job notebook: /Workspace/ps_engagement_tracker/api_server

%pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic databricks-sdk

# Run FastAPI in Databricks
import subprocess
import sys

subprocess.run([
    sys.executable, "-m", "uvicorn",
    "app.main:app",
    "--host", "0.0.0.0",
    "--port", "8000"
], cwd="/Workspace/ps_engagement_tracker/backend")
```

### Step 5: Deploy Using Databricks CLI

```bash
# Install Databricks CLI if not already installed
pip install databricks-cli

# Configure Databricks host and token
databricks configure --host https://your-workspace.cloud.databricks.com \
                     --token your_token_here

# Deploy the app
databricks apps create --name ps-engagement-tracker \
                       --source-code-path ./ps-engagement-tracker-app \
                       --config-path ./ps-engagement-tracker-app/app.yaml
```

### Step 6: Access Your App

Once deployed, your app will be available at:

```
https://your-workspace.cloud.databricks.com/apps/ps-engagement-tracker
```

## Option 2: Full Stack on Databricks

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Databricks Workspace                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Databricks App (Frontend)                             │
│  └─ React SPA served from Workspace                    │
│                                                         │
│  Databricks Jobs (Backend)                             │
│  └─ FastAPI endpoint running on cluster                │
│                                                         │
│  Databricks SQL Warehouse                              │
│  ├─ RAG Status Tables (app-owned)                      │
│  └─ Float Data (read-only, synced)                     │
│                                                         │
│  Delta Lake (Project Data)                             │
│  └─ prd_bronze.abit_ps_engagement.float_data           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Setup Steps

#### Step 1: Create SQL Warehouse

In Databricks UI:

1. Go to **SQL** → **SQL Warehouses**
2. Create new warehouse (minimum: Small, 2-4 cores)
3. Note the connection string and HTTP path

#### Step 2: Migrate Database to Databricks

```sql
-- Create catalog (if not exists)
CREATE CATALOG IF NOT EXISTS ps_engagement;

-- Create schema
CREATE SCHEMA IF NOT EXISTS ps_engagement.tracking;

-- Create project health updates table
CREATE TABLE ps_engagement.tracking.project_health_updates (
    id INT AUTO_INCREMENT,
    project_code STRING NOT NULL,
    project_name STRING NOT NULL,
    client_name STRING NOT NULL,
    health_status STRING NOT NULL, -- RED, AMBER, GREEN
    risk_area STRING,
    mitigation_plan STRING,
    comments STRING,
    created_by STRING NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    float_last_sync TIMESTAMP
)
USING DELTA;

-- Create indexes
CREATE INDEX idx_project_code ON ps_engagement.tracking.project_health_updates(project_code);
CREATE INDEX idx_created_at ON ps_engagement.tracking.project_health_updates(created_at);
```

#### Step 3: Update Backend Configuration

Modify `backend/app/database.py`:

```python
from databricks import sql

def get_databricks_connection():
    """Connect to Databricks SQL Warehouse"""
    return sql.connect(
        server_hostname=os.getenv("DATABRICKS_SERVER_HOSTNAME"),
        http_path=os.getenv("DATABRICKS_HTTP_PATH"),
        access_token=os.getenv("DATABRICKS_TOKEN"),
        catalog="ps_engagement",
        schema="tracking"
    )
```

#### Step 4: Deploy Backend as Databricks Job

Create a Job notebook:

```python
# /Workspace/ps_engagement_tracker/backend_api

%pip install fastapi uvicorn sqlalchemy pydantic databricks-sdk

# Import and run the app
import sys
sys.path.insert(0, "/Workspace/ps_engagement_tracker/backend")

from app.main import app
import uvicorn

# Run the API
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
```

In Databricks UI:

1. Go to **Jobs** → **Create Job**
2. Configure:
   - Job name: `ps-engagement-tracker-api`
   - Type: All-purpose cluster
   - Notebook path: `/ps_engagement_tracker/backend_api`
   - Trigger: Continuous
3. Click **Create**

#### Step 5: Get Backend Endpoint

Once the job is running:

1. Check the job status for the compute URL
2. The API will be available at: `http://<cluster-ip>:8000`

#### Step 6: Deploy Frontend App

Update `app.yaml` with the Databricks SQL Warehouse and backend:

```yaml
name: PS Engagement Tracker
description: Full stack on Databricks

path: /

env:
  VITE_API_URL: http://<your-cluster-endpoint>:8000
  DATABRICKS_WAREHOUSE_ID: <warehouse-id>

serve:
  type: STATIC
  path: dist
  enable_cors: true
  default_file: index.html
```

Deploy:

```bash
databricks apps create --name ps-engagement-tracker \
                       --source-code-path ./ps-engagement-tracker-app
```

## Option 3: Hybrid Deployment (External Backend + Databricks Frontend)

This is often the most practical approach for production.

### Architecture

```
┌──────────────────────────────────┐
│  Databricks App (Frontend)       │
│  - React SPA                     │
│  - Databricks Workspace          │
└──────────┬───────────────────────┘
           │ HTTPS API calls
           │
┌──────────▼───────────────────────┐
│  External Backend (FastAPI)      │
│  - Kubernetes, Cloud Run, etc.   │
│  - Connects to databases         │
└──────────┬───────────────────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼──────┐  ┌─▼──────────────────┐
│PostgreSQL │  │ Databricks         │
│(App Data) │  │ (Project Data)     │
└───────────┘  └────────────────────┘
```

### Setup Steps

#### Step 1: Deploy Backend Externally

Choose your deployment platform:

**Kubernetes:**

```bash
# Build and push image
docker build -t your-registry/ps-engagement-tracker:latest \
             -f ps-engagement-tracker/backend/Dockerfile \
             ps-engagement-tracker/backend

docker push your-registry/ps-engagement-tracker:latest

# Deploy to K8s cluster
kubectl create deployment ps-engagement-tracker \
  --image=your-registry/ps-engagement-tracker:latest

kubectl expose deployment ps-engagement-tracker \
  --type=LoadBalancer --port=80 --target-port=8000
```

**Cloud Run (Google Cloud):**

```bash
gcloud run deploy ps-engagement-tracker \
  --source ps-engagement-tracker/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=postgresql://...,DATABRICKS_TOKEN=..."
```

**Azure Container Instances:**

```bash
az container create \
  --resource-group my-group \
  --name ps-engagement-tracker \
  --image your-registry/ps-engagement-tracker:latest \
  --ports 8000 \
  --environment-variables DATABASE_URL="..." DATABRICKS_TOKEN="..."
```

#### Step 2: Update Frontend Configuration

Get your external backend URL and update `app.yaml`:

```yaml
name: PS Engagement Tracker

env:
  VITE_API_URL: https://api.your-domain.com # Your external backend

serve:
  type: STATIC
  path: dist
  enable_cors: true
  default_file: index.html
```

#### Step 3: Deploy Frontend to Databricks

```bash
databricks apps create --name ps-engagement-tracker \
                       --source-code-path ./ps-engagement-tracker-app
```

## Configuration & Environment Variables

### For Databricks Apps

Create a `.env` file or pass as app environment variables:

```env
# Frontend
VITE_API_URL=https://your-backend-url.com
VITE_APP_TITLE=PS Engagement Tracker

# Backend (if running on Databricks)
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_WAREHOUSE_ID=abc123def456
DATABRICKS_CATALOG=ps_engagement
DATABRICKS_SCHEMA=tracking

# External integrations
DATABASE_URL=postgresql://user:pass@host/db
AZURE_AD_ENABLED=true
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
```

## Authentication in Databricks Apps

### Option 1: Databricks Native Authentication

Enable automatic Databricks authentication:

```yaml
# app.yaml
auth:
  type: databricks
  required: true # Require workspace login
```

### Option 2: Azure AD (Recommended for Enterprise)

Your backend should validate Azure AD tokens. Update your FastAPI app:

```python
# backend/app/utils/auth.py

from fastapi import Depends, HTTPException
from jose import JWTError, jwt

async def verify_azure_ad_token(token: str = Depends(oauth2_scheme)):
    """Verify Azure AD JWT token"""
    try:
        payload = jwt.decode(
            token,
            key,  # Azure AD public key
            algorithms=["RS256"],
            audience=settings.AZURE_AD_CLIENT_ID
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
        return user_id
    except JWTError:
        raise HTTPException(status_code=401)
```

## Scaling & Performance

### For Databricks Deployment

1. **SQL Warehouse Scaling**
   - Start with **Small** (2-4 cores)
   - Scale up as traffic increases
   - Use **Pro** or **Premium** tier for production

2. **Cluster Configuration** (for backend jobs)

   ```python
   {
     "spark_version": "13.3.x-scala2.12",
     "node_type_id": "i3.xlarge",
     "num_workers": 2,
     "auto_termination_minutes": 20
   }
   ```

3. **Caching**
   - Cache project list for 5-10 minutes
   - Invalidate on health updates
   - Use Delta table statistics

4. **Indexing**
   - Create Z-order clustering on project_code
   - Index on (project_code, created_at)

## Monitoring & Logging

### In Databricks

Access logs and metrics:

```python
# View app logs
databricks apps logs ps-engagement-tracker

# View job run logs
databricks jobs run-now --job-id 123 --wait
```

### Configure Application Insights (Azure)

```python
# backend/app/main.py

from opencensus.ext.azure.log_exporter import AzureLogHandler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler())
```

## Security Considerations

### In Databricks Apps

1. **Token Management**

   ```bash
   # Use Databricks Secrets
   databricks secrets put-secret \
     --scope ps-engagement-tracker \
     --key databricks-token \
     --string-value "dapi..."
   ```

2. **Network Security**
   - Use IP allowlists for Databricks workspace
   - Enable TLS/SSL for all connections
   - Use private endpoints where available

3. **Access Control**
   - Limit app access to specific groups
   - Use Databricks Unity Catalog ACLs
   - Enable audit logging

### Database Security

```sql
-- Create service principal for app
CREATE USER app_service@databricks.com;

-- Grant minimum required permissions
GRANT SELECT, INSERT ON ps_engagement.tracking.project_health_updates
TO app_service@databricks.com;

-- Deny delete/update (for audit trail)
DENY UPDATE, DELETE ON ps_engagement.tracking.project_health_updates
FROM app_service@databricks.com;
```

## Cost Considerations

### Databricks

| Component          | Cost Model                            |
| ------------------ | ------------------------------------- |
| **App**            | $0 (included with workspace)          |
| **SQL Warehouse**  | $0.30-1.20 per hour (depends on size) |
| **Compute (Jobs)** | $0.30-1.00 per DBU hour               |
| **Storage**        | $0.023 per GB (Delta Lake)            |

### Example Monthly Cost (Small Deployment)

- SQL Warehouse (Small, 5 hrs/day): ~$45
- Compute Jobs (occasional): ~$20
- Storage (10 GB): ~$0.23
- **Total**: ~$65/month

## Migration Path

### Phase 1: Proof of Concept (Week 1-2)

- Deploy frontend as Databricks App
- Backend on external compute
- Mock or sample data

### Phase 2: Production Setup (Week 3-4)

- Migrate data to Databricks SQL Warehouse
- Deploy backend to external/Databricks compute
- Enable authentication
- Set up monitoring

### Phase 3: Optimization (Week 5+)

- Performance tuning
- Cost optimization
- Advanced features (real-time sync, etc.)

## Troubleshooting

### App Not Loading

```bash
# Check app status
databricks apps get ps-engagement-tracker

# View logs
databricks apps logs ps-engagement-tracker --follow
```

### Backend Connection Issues

```python
# Test Databricks connection
from databricks import sql

conn = sql.connect(
    server_hostname="your-workspace.cloud.databricks.com",
    http_path="/sql/1.0/warehouses/abc123",
    access_token="dapi..."
)
cursor = conn.cursor()
cursor.execute("SELECT 1")
print(cursor.fetchone())
```

### CORS Errors

Update your backend CORS configuration:

```python
# backend/app/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-workspace.cloud.databricks.com",
        "https://your-api-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Recommended Deployment: Option 3 (Hybrid)

For production use, we recommend **Option 3 (Hybrid Deployment)**:

✅ **Advantages:**

- Frontend managed by Databricks (auto-scaling, high availability)
- Backend on dedicated external compute (better control, cost efficiency)
- Leverage Databricks for data only
- Easier to debug and scale independently
- Cost-effective

**Implementation:**

1. Deploy FastAPI backend to Kubernetes or Cloud Run
2. Deploy React frontend to Databricks App
3. Use Databricks SQL Warehouse for project data
4. External PostgreSQL or managed database for app data

This approach provides the best balance of performance, cost, and maintainability.

## Additional Resources

- [Databricks Apps Documentation](https://docs.databricks.com/en/dev-tools/apps/)
- [Databricks SQL Warehouse Guide](https://docs.databricks.com/en/sql/warehouse/)
- [Databricks Jobs Compute](https://docs.databricks.com/en/compute/jobs-compute/)
- [Delta Lake Performance](https://docs.databricks.com/en/delta/)
