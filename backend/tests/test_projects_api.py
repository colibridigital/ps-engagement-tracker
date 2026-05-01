import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
from datetime import datetime, date, timedelta

from app.main import app
from app import models, schemas
from app.database import get_db


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture
def mock_db_session():
    db = MagicMock(spec=Session)
    
    # Mock project and status data
    mock_project_1 = models.ProjectDataFromFloat(
        project_id=1, project_name="Project Alpha", project_code="P001", client_name="Client A", project_manager_name="PM One", slt="SLT A", project_end_date=date.today() + timedelta(days=20)
    )
    mock_status_1 = models.EngagementTrackerStatus(
        project_id=1, health_status="green", rag_by_revenue="green", delivery_cycle="execution", updated_at=datetime.utcnow(), version=1, updated_by="test"
    )
    mock_project_2 = models.ProjectDataFromFloat(
        project_id=2, project_name="Project Beta", project_code="P002", client_name="Client B", project_manager_name="PM Two", slt="SLT B", project_end_date=date.today() + timedelta(days=40)
    )
    mock_status_2 = models.EngagementTrackerStatus(
        project_id=2, health_status="amber", rag_by_revenue="red", delivery_cycle="initiation", updated_at=datetime.utcnow(), version=1, updated_by="test"
    )
    mock_internal_project = models.ProjectDataFromFloat(
        project_id=3, project_name="Internal Project", project_code="INT01", client_name="Colibri", project_manager_name="PM One", slt="SLT A"
    )

    # Mock query results
    db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.count.return_value = 2
    db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.all.return_value = [
        (mock_project_1, mock_status_1),
        (mock_project_2, mock_status_2),
    ]
    
    # Mock for get_project
    db.query.return_value.filter.return_value.first.side_effect = [
        mock_project_1, # For project lookup
        mock_status_1   # For status lookup
    ]

    # Mock for get_history
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_status_1, mock_status_2]
    
    # Mock for get_rag_trend
    db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_status_1, mock_status_2]

    # Mock for get_team
    mock_team = models.ProjectTeam(project_id=1, team=[{"name": "Test User", "email": "test@test.com", "role": "dev"}])
    # Need to reset side_effect for this specific query chain
    team_query_mock = MagicMock()
    db.query.return_value.filter.side_effect = lambda x: team_query_mock if x.compare(models.ProjectTeam.project_id == 1) else db.query.return_value.filter.return_value
    team_query_mock.first.return_value = mock_team

    # Mock for update_status
    update_status_query_mock = MagicMock()
    db.query.return_value.filter.side_effect = lambda x: update_status_query_mock if x.compare(models.ProjectDataFromFloat.project_id == 1) else db.query.return_value.filter.return_value
    update_status_query_mock.first.return_value = mock_project_1

    # Mock for overview endpoints
    overview_query_mock = MagicMock()
    overview_query_mock.scalar.return_value = 10
    overview_query_mock.one.return_value._asdict.return_value = {
        "red_count": 1, "amber_count": 2, "green_count": 7, "completed_count": 0, "total_count": 10
    }
    overview_query_mock.all.return_value = [("PM One", 5), ("PM Two", 5)]
    db.query.return_value.filter.return_value.scalar.return_value = 10 # total_projects_query
    db.query.return_value.join.return_value.one.return_value = overview_query_mock.one.return_value
    db.query.return_value.group_by.return_value.all.return_value = overview_query_mock.all.return_value
    db.query.return_value.filter.return_value.group_by.return_value.all.return_value = overview_query_mock.all.return_value

    # Mock for closing projects
    closing_query_mock = MagicMock()
    db.query.return_value.filter.return_value.filter.return_value = closing_query_mock
    closing_query_mock.count.side_effect = [2, 3] # 30 days, 45 days

    # Mock for delivery cycle
    delivery_cycle_mock = MagicMock()
    db.query.return_value.join.return_value.join.return_value.with_entities.return_value.group_by.return_value.all.return_value = [("execution", 8), ("initiation", 2)]

    return db


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_projects_success(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["project"]["project_name"] == "Project Alpha"
    app.dependency_overrides = {}


def test_list_projects_with_pagination(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/?page=1&page_size=1")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 1
    app.dependency_overrides = {}


def test_list_projects_with_search(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/?search=alpha")
    assert response.status_code == 200
    # The mock is simple, but we verify the call was made.
    # A more complex mock would change the return value based on filter args.
    assert mock_db_session.query.return_value.filter.call_count > 0
    app.dependency_overrides = {}


def test_list_projects_db_error(client, mock_db_session):
    mock_db_session.query.side_effect = Exception("Database connection failed")
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/")
    assert response.status_code == 500
    assert "Error retrieving projects" in response.json()["detail"]
    app.dependency_overrides = {}


def test_get_project_success(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/1")
    assert response.status_code == 200
    data = response.json()
    assert data["project"]["project_id"] == 1
    assert data["project"]["project_name"] == "Project Alpha"
    assert data["current_status"]["health_status"] == "green"
    app.dependency_overrides = {}


def test_get_project_not_found(client, mock_db_session):
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}
    app.dependency_overrides = {}


def test_get_overview_rag_project_health(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/rag-project-health")
    assert response.status_code == 200
    data = response.json()
    assert data["red_count"] == 1
    assert data["no_status_count"] == 0
    app.dependency_overrides = {}


def test_get_overview_rag_project_revenue(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/rag-project-revenue")
    assert response.status_code == 200
    data = response.json()
    assert data["red_count"] == 1
    app.dependency_overrides = {}


def test_get_engagements_by_pm(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/engagements-by-pm")
    assert response.status_code == 200
    assert response.json() == {"PM One": 5, "PM Two": 5}
    app.dependency_overrides = {}


def test_get_engagements_by_client(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/engagements-by-client")
    assert response.status_code == 200
    assert response.json() == {"PM One": 5, "PM Two": 5} # Mock returns this
    app.dependency_overrides = {}


def test_get_closing_projects(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/closing-projects")
    assert response.status_code == 200
    assert response.json() == {"in_30_days": 2, "in_45_days": 3}
    app.dependency_overrides = {}


def test_get_delivery_cycle(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/overview/delivery-cycle")
    assert response.status_code == 200
    assert response.json() == {"execution": 8, "initiation": 2}
    app.dependency_overrides = {}


def test_get_history(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/1/change-history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["health_status"] == "green"
    app.dependency_overrides = {}


def test_get_rag_trend(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/1/rag-trend")
    assert response.status_code == 200
    data = response.json()
    assert len(data["health_status"]) == 2
    assert data["health_status"][0]["value"] == "green"
    app.dependency_overrides = {}


def test_get_team(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/1/team")
    assert response.status_code == 200
    data = response.json()
    assert len(data["team"]) == 1
    assert data["team"][0]["name"] == "Test User"
    app.dependency_overrides = {}


def test_get_team_not_found(client, mock_db_session):
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db_session
    response = client.get("/api/projects/999/team")
    assert response.status_code == 200
    assert response.json() == {"team": []}
    app.dependency_overrides = {}


def test_update_status_success(client, mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    update_data = {
        "health_status": "red",
        "rag_by_revenue": "red",
        "risk_area": "Budget",
        "mitigation_plan": "New plan",
        "comments": "Urgent review needed",
    }
    response = client.post("/api/projects/1/status-update", json=update_data)
    
    assert response.status_code == 201
    # Check if the db session was used to add and commit
    assert mock_db_session.add.call_count == 1
    assert mock_db_session.commit.call_count == 1
    app.dependency_overrides = {}


def test_update_status_project_not_found(client, mock_db_session):
    # Make the project lookup return None
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db_session
    
    update_data = {"health_status": "green", "rag_by_revenue": "green"}
    response = client.post("/api/projects/999/status-update", json=update_data)
    
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}
    app.dependency_overrides = {}