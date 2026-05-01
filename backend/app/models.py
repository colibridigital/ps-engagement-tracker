from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Float, Text, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class ProjectDataFromFloat(Base):
    """Model for project data sourced from Float."""
    __tablename__ = 'project_data_from_float'
    __table_args__ = {"schema": "ps_engagement_tracker"}

    project_id = Column(Integer, primary_key=True)
    project_name = Column(String)
    client_id = Column(Integer)
    client_name = Column(String)
    project_manager_id = Column(Integer, nullable=True)
    project_manager_name = Column(String, nullable=True)
    project_manager_email = Column(String, nullable=True)
    project_note = Column(Text, nullable=True)
    created_timestamp = Column(DateTime, nullable=True)
    budget_per_phase = Column(Boolean, nullable=True)
    project_active = Column(Boolean, nullable=True)
    is_tentative = Column(Boolean, nullable=True)
    is_billable = Column(Boolean, nullable=True)
    total_budget = Column(Float, nullable=True)
    project_modified_timestamp = Column(DateTime, nullable=True)
    budget_type = Column(String, nullable=True)
    project_tags = Column(String, nullable=True)
    project_code = Column(String, nullable=True)
    project_status = Column(Integer, nullable=True)
    budget_currency = Column(String, nullable=True)
    budget_currency_rate = Column(Float, nullable=True)
    last_sync_time = Column(DateTime, nullable=True)
    # project_end_date = Column(DateTime, nullable=True)

class EngagementTrackerStatus(Base):
    """Model for engagement tracker status updates."""
    __tablename__ = 'engagement_tracker_status'
    __table_args__ = {"schema": "ps_engagement_tracker"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, index=True)
    health_status = Column(String)
    rag_by_revenue = Column(String)
    delivery_cycle = Column(String, nullable=True)
    risk_area = Column(String, nullable=True)
    mitigation_plan = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    updated_by = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)
    version = Column(Integer)

class ProjectTeam(Base):
    """Model for project team members."""
    __tablename__ = 'project_teams'
    __table_args__ = {"schema": "ps_engagement_tracker"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, index=True)
    team = Column(JSON)