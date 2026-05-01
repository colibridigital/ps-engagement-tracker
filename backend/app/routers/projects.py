"""
API routes.
"""
from sqlalchemy.exc import SQLAlchemyError
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import Request
from .. import database, models, schemas
from ..models import ProjectDataFromFloat, EngagementTrackerStatus, ProjectTeam
from ..schemas import (
    ProjectListItem,
    ProjectWithStatus,
    RagDistribution,
    ClosingProjects,
    ChangeHistoryItem,
    RagTrend,
    RagTrendItem,
    TeamMember,
    StatusUpdate,
    StatusUpdateResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])

internal_client_names = ["Colibri", "Colibri Digital"]


def get_latest_status_subquery(db: Session) -> Any:
    """Returns a subquery to find the latest status update for each project."""
    return db.query(
        models.EngagementTrackerStatus.project_id,
        func.max(models.EngagementTrackerStatus.updated_at).label('max_updated_at')
    ).group_by(models.EngagementTrackerStatus.project_id).subquery('latest_status_sq')


@router.get("/", response_model=schemas.PaginatedProjectList)
def list_projects(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
    search: Optional[str] = Query(None, description="Search by project name or code"),
    page: Optional[int] = Query(None, ge=1, description="Page number"),
    page_size: Optional[int] = Query(None, ge=1, le=1000, description="Number of results per page"),
    status: Optional[str] = Query(None, alias="statusFilter"),
    pm: Optional[str] = Query(None, alias="pmFilter"),
    client: Optional[str] = Query(None, alias="clientFilter"),
    slt: Optional[str] = Query(None, alias="sltFilter"),
):
    try:
        latest_status_sq = get_latest_status_subquery(db)
        query = db.query(models.ProjectDataFromFloat, models.EngagementTrackerStatus).outerjoin(
            latest_status_sq, models.ProjectDataFromFloat.project_id == latest_status_sq.c.project_id
        ).outerjoin(
            models.EngagementTrackerStatus,
            (models.EngagementTrackerStatus.project_id == latest_status_sq.c.project_id) &
            (models.EngagementTrackerStatus.updated_at == latest_status_sq.c.max_updated_at)
        )

        # Ensure project_name is not null to prevent frontend errors
        query = query.filter(models.ProjectDataFromFloat.project_name.isnot(None))

        if not include_internal:
            query = query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(models.ProjectDataFromFloat.project_name).like(search_term)) |
                (func.lower(models.ProjectDataFromFloat.project_code).like(search_term)))

        if status:
            query = query.filter(models.EngagementTrackerStatus.health_status == status)
        if pm:
            query = query.filter(models.ProjectDataFromFloat.project_manager_name == pm)
        if client:
            query = query.filter(models.ProjectDataFromFloat.client_name == client)
        if slt:
            query = query.filter(models.ProjectDataFromFloat.slt == slt) # Assuming 'slt' is a column in ProjectDataFromFloat

        total_count = query.count()

        if page is not None and page_size is not None:
            paginated_query = query.offset((page - 1) * page_size).limit(page_size)
            projects_with_status = paginated_query.all()
            response_page = page
            response_page_size = page_size
        else:
            projects_with_status = query.all()
            response_page = 1
            response_page_size = total_count if total_count > 0 else 1

        results = []
        for project, status in projects_with_status:
            results.append({
                "project": project,
                "current_status": status
            })
        
        return {
            "total_count": total_count,
            "page": response_page,
            "page_size": response_page_size,
            "results": results,
        }

    except (SQLAlchemyError, Exception) as e:
        # It's good practice to log the actual error for debugging
        # import logging; logging.exception(e)
        raise HTTPException(status_code=500, detail=f"Error retrieving projects: {str(e)}")


@router.get("/overview/rag-project-health", response_model=schemas.RagDistribution)
def get_rag(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    # Base query for all projects
    total_projects_query = db.query(func.count(models.ProjectDataFromFloat.project_id))
    if not include_internal:
        total_projects_query = total_projects_query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))
    total_project_count = total_projects_query.scalar()

    latest_status_sq = get_latest_status_subquery(db)

    query = db.query(
        func.count(case((models.EngagementTrackerStatus.health_status == 'red', 1))).label('red_count'),
        func.count(case((models.EngagementTrackerStatus.health_status == 'amber', 1))).label('amber_count'),
        func.count(case((models.EngagementTrackerStatus.health_status == 'green', 1))).label('green_count'),
        func.count(case((models.EngagementTrackerStatus.health_status == 'completed', 1))).label('completed_count'),
        func.count(models.EngagementTrackerStatus.project_id).label('total_count')
    ).join(
        latest_status_sq,
        (models.EngagementTrackerStatus.project_id == latest_status_sq.c.project_id) &
        (models.EngagementTrackerStatus.updated_at == latest_status_sq.c.max_updated_at)
    )

    if not include_internal:
        query = query.join(
            models.ProjectDataFromFloat,
            models.ProjectDataFromFloat.project_id == models.EngagementTrackerStatus.project_id
        ).filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

    counts = query.one()
    
    projects_with_status_count = counts.total_count
    no_status_count = total_project_count - projects_with_status_count

    # Manually construct the response dictionary to include the new count
    response_data = counts._asdict()
    response_data["no_status_count"] = no_status_count
    return response_data

@router.get("/overview/rag-project-revenue", response_model=schemas.RagDistribution)
def get_rag_revenue(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    # Base query for all projects
    total_projects_query = db.query(func.count(models.ProjectDataFromFloat.project_id))
    if not include_internal:
        total_projects_query = total_projects_query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))
    total_project_count = total_projects_query.scalar()

    latest_status_sq = get_latest_status_subquery(db)
    query = db.query(
        func.count(case((models.EngagementTrackerStatus.rag_by_revenue == 'red', 1))).label('red_count'),
        func.count(case((models.EngagementTrackerStatus.rag_by_revenue == 'amber', 1))).label('amber_count'),
        func.count(case((models.EngagementTrackerStatus.rag_by_revenue == 'green', 1))).label('green_count'),
        func.count(case((models.EngagementTrackerStatus.rag_by_revenue == 'completed', 1))).label('completed_count'),
        func.count(models.EngagementTrackerStatus.project_id).label('total_count')
    ).join(
        latest_status_sq,
        (models.EngagementTrackerStatus.project_id == latest_status_sq.c.project_id) &
        (models.EngagementTrackerStatus.updated_at == latest_status_sq.c.max_updated_at)
    )

    if not include_internal:
        query = query.join(
            models.ProjectDataFromFloat,
            models.ProjectDataFromFloat.project_id == models.EngagementTrackerStatus.project_id
        ).filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

    counts = query.one()

    projects_with_status_count = counts.total_count
    no_status_count = total_project_count - projects_with_status_count

    response_data = counts._asdict()
    response_data["no_status_count"] = no_status_count
    return response_data

@router.get("/overview/engagements-by-pm", response_model=Dict[str, int])
def get_engagements_by_pm(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    query = db.query(
        models.ProjectDataFromFloat.project_manager_name,
        func.count(models.ProjectDataFromFloat.project_id)
    )

    if not include_internal:
        query = query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

    query = query.group_by(models.ProjectDataFromFloat.project_manager_name)
    return {manager: count for manager, count in query.all()}

@router.get("/overview/engagements-by-client", response_model=Dict[str, int])
def get_engagements_by_client(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    query = db.query(
        models.ProjectDataFromFloat.client_name,
        func.count(models.ProjectDataFromFloat.project_id)
    )

    if not include_internal:
        query = query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

    query = query.filter(models.ProjectDataFromFloat.client_name.isnot(None)).group_by(
        models.ProjectDataFromFloat.client_name
    )
    return {client: count for client, count in query.all() if client}

@router.get("/overview/closing-projects", response_model=schemas.ClosingProjects)
def get_closing_projects(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    try:
        now = datetime.utcnow().date()
        thirty_days = now + timedelta(days=30)
        forty_five_days = now + timedelta(days=45)        
        
        query = db.query(models.ProjectDataFromFloat).filter(
            models.ProjectDataFromFloat.project_end_date.isnot(None),
            models.ProjectDataFromFloat.project_end_date >= now
        )

        if not include_internal:
            query = query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

        in_30_days_count = query.filter(models.ProjectDataFromFloat.project_end_date <= thirty_days).count()
        in_45_days_count = query.filter(
            models.ProjectDataFromFloat.project_end_date > thirty_days,
            models.ProjectDataFromFloat.project_end_date <= forty_five_days
        ).count()
        return schemas.ClosingProjects(in_30_days=in_30_days_count, in_45_days=in_45_days_count)
    except (SQLAlchemyError, AttributeError) as e: # Catch AttributeError if project_end_date doesn't exist
        raise HTTPException(status_code=500, detail=f"Error retrieving closing projects: {str(e)}")

@router.get("/overview/delivery-cycle", response_model=Dict[str, int])
def get_delivery_cycle(
    db: Session = Depends(database.get_db),
    include_internal: bool = Query(False, description="Include internal projects"),
):
    """
    Calculates the distribution of projects by their latest delivery cycle.
    This query starts from the projects table, filters for internal/external projects,
    and then LEFT JOINs the latest status to get the delivery cycle.
    """
    latest_status_sq = get_latest_status_subquery(db)

    # Start with the project data table to apply filters first
    query = db.query(models.ProjectDataFromFloat)

    if not include_internal:
        query = query.filter(models.ProjectDataFromFloat.client_name.notin_(internal_client_names))

    # Now, join the latest status information
    query = query.join(
        latest_status_sq, models.ProjectDataFromFloat.project_id == latest_status_sq.c.project_id
    ).join(
        models.EngagementTrackerStatus,
        (models.EngagementTrackerStatus.project_id == latest_status_sq.c.project_id) & 
        (models.EngagementTrackerStatus.updated_at == latest_status_sq.c.max_updated_at)
    )

    # Group by the delivery cycle and count the projects
    final_query = query.with_entities(models.EngagementTrackerStatus.delivery_cycle, func.count(models.ProjectDataFromFloat.project_id)).group_by(models.EngagementTrackerStatus.delivery_cycle)
    
    # Filter out results where the delivery_cycle is None to match the Dict[str, int] response model.
    return {cycle: count for cycle, count in final_query.all() if cycle is not None}

@router.get("/{project_id}", response_model=schemas.ProjectWithStatus)
def get_project(project_id: int, db: Session = Depends(database.get_db)):
    try:
        project = db.query(models.ProjectDataFromFloat).filter(models.ProjectDataFromFloat.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        status = db.query(models.EngagementTrackerStatus)\
            .filter(models.EngagementTrackerStatus.project_id == project_id)\
            .order_by(desc(EngagementTrackerStatus.updated_at))\
            .first()

        return {
            "project": project,
            "current_status": status
        }
    except (SQLAlchemyError, Exception) as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@router.get("/{project_id}/change-history", response_model=List[schemas.ChangeHistoryItem])
def get_history(project_id: int, db: Session = Depends(database.get_db)):
    history = db.query(models.EngagementTrackerStatus)\
        .filter(models.EngagementTrackerStatus.project_id == project_id)\
        .order_by(desc(models.EngagementTrackerStatus.updated_at))\
        .all()
    return history

@router.get("/{project_id}/rag-trend", response_model=schemas.RagTrend)
def get_rag_trend(project_id: int, db: Session = Depends(database.get_db)):
    history = db.query(models.EngagementTrackerStatus)\
        .filter(models.EngagementTrackerStatus.project_id == project_id)\
        .order_by(desc(models.EngagementTrackerStatus.updated_at))\
        .limit(3)\
        .all()
    
    # The history is from newest to oldest, so we reverse it for trend display
    history.reverse()

    return {
        "health_status": [{"value": h.health_status, "updated_at": h.updated_at} for h in history],
        "rag_by_revenue": [{"value": h.rag_by_revenue, "updated_at": h.updated_at} for h in history]
    }

@router.get("/{project_id}/team", response_model=Dict[str, List[schemas.TeamMember]])
def get_team(project_id: int, db: Session = Depends(database.get_db)):
    team_data = db.query(models.ProjectTeam).filter(models.ProjectTeam.project_id == project_id).first()
    if not team_data or not team_data.team:
        return {"team": []}
    return {"team": team_data.team}

@router.post("/{project_id}/status-update", response_model=schemas.ChangeHistoryItem, status_code=201)
def update_status(project_id: int, update: schemas.StatusUpdate,request: Request, db: Session = Depends(database.get_db)):
    project = db.query(models.ProjectDataFromFloat).filter(models.ProjectDataFromFloat.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        latest_update = db.query(models.EngagementTrackerStatus)\
            .filter(models.EngagementTrackerStatus.project_id == project_id)\
            .order_by(desc(models.EngagementTrackerStatus.version))\
            .first()

        new_version = (latest_update.version + 1) if latest_update else 1
        user = request.headers.get("x-forwarded-email", "system")

        new_status = models.EngagementTrackerStatus(
            project_id=project_id,
            health_status=update.health_status,
            rag_by_revenue=update.rag_by_revenue,
            delivery_cycle=update.delivery_cycle,
            risk_area=update.risk_area,
            mitigation_plan=update.mitigation_plan,
            comments=update.comments,
            updated_by=user,
            updated_at=datetime.utcnow(),
            version=new_version
        )

        db.add(new_status)
        db.commit()
        db.refresh(new_status)
        
        return new_status
    except HTTPException:
        raise
    except (SQLAlchemyError, Exception) as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating status update: {str(e)}")
