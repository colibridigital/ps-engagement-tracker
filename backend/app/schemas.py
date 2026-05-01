from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class HealthStatus(str, Enum):
    """RAG health status enum."""
    RED = "red"
    AMBER = "amber"
    GREEN = "green"
    COMPLETED = "completed"




class StatusUpdate(BaseModel):
    """Schema for creating a new status update."""
    health_status: HealthStatus
    rag_by_revenue: HealthStatus
    delivery_cycle: Optional[str] = None
    risk_area: Optional[str] = None
    mitigation_plan: Optional[str] = None
    comments: Optional[str] = None
    updated_by: str


class ProjectListItem(BaseModel):
    """Schema for project data from Float."""
    project_id: int
    project_name: str
    client_id:  Optional[int] = None
    client_name: Optional[str] = None
    project_manager_id: Optional[int] = None
    project_manager_name: Optional[str] = None
    project_manager_email: Optional[str] = None
    project_note: Optional[str] = None
    created_timestamp: Optional[datetime] = None
    budget_per_phase: Optional[bool] = None
    project_active: Optional[bool] = None
    is_tentative: Optional[bool] = None
    is_billable: Optional[bool] = None
    total_budget: Optional[float] = None
    project_modified_timestamp: Optional[datetime] = None
    budget_type: Optional[str] = None
    project_tags: Optional[str] = None
    project_code: Optional[str] = None
    project_status: Optional[int] = None
    budget_currency: Optional[str] = None
    budget_currency_rate: Optional[int] = None
    last_sync_time: Optional[datetime] = None
    project_end_date: Optional[date] = None

    class Config:
        from_attributes = True


class ChangeHistoryItem(BaseModel):
    """Schema for a single entry in the change history."""
    id: int
    project_id: int
    health_status: HealthStatus
    rag_by_revenue: HealthStatus
    delivery_cycle: Optional[str] = None
    risk_area: Optional[str] = None
    mitigation_plan: Optional[str] = None
    comments: Optional[str] = None
    updated_by: str
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True


class ProjectWithStatus(BaseModel):
    """Schema for a project with its current status."""
    project: ProjectListItem
    current_status: Optional[ChangeHistoryItem] = None

class PaginatedProjectList(BaseModel):
    """Schema for a paginated list of projects."""
    total_count: int
    page: int
    page_size: int
    results: List[ProjectWithStatus]


class RagDistribution(BaseModel):
    """Distribution of health statuses."""
    red_count: int
    amber_count: int
    green_count: int
    completed_count: int
    no_status_count: Optional[int] = None
    total_count: int

class ClosingProjects(BaseModel):
    """Schema for projects that are closing soon."""
    in_30_days: int
    in_45_days: int


class StatusUpdateResponse(BaseModel):
    """Generic status response for POST/PUT/DELETE operations."""
    status: str

class RagTrendItem(BaseModel):
    """A single data point in a RAG trend."""
    value: HealthStatus
    updated_at: datetime

class RagTrend(BaseModel):
    """Schema for the RAG trend over the last few updates."""
    health_status: List[RagTrendItem]
    rag_by_revenue: List[RagTrendItem]

class TeamMember(BaseModel):
    """Schema for a single team member."""
    name: str
    email: str
    role: Optional[str] = None
