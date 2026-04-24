/**
 * Type definitions for the application
 */

export enum HealthStatus {
  RED = "red",
  AMBER = "amber",
  GREEN = "green",
  COMPLETED = "completed",
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  stage: string;
  project_manager?: string;
  team_members?: string;
  tags?: string;
  total_budget?: string;
  budget_type?: string;
  project_state: string;
  start_date?: string;
  end_date?: string;
  last_updated: string;
}

export interface ProjectHealthUpdate {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  health_status: HealthStatus;
  risk_area?: string;
  mitigation_plan?: string;
  comments?: string;
  updated_by: string;
  updated_at: string;
  version: number;
}

export interface ProjectDetail {
  project: Project;
  current_health_update?: ProjectHealthUpdate;
  health_history: ProjectHealthUpdate[];
}
export interface ProjectTeam {
  team: string[];
}
export interface ProjectListItem {
  project_id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  project_manager?: string;
  slt?: string;
  current_health_status?: HealthStatus;
  risk_area?: string;
  current_mitigation_plan?: string;
  current_comments?: string;
  last_updated?: string;
}

export interface SummaryItem {
  label: string;
  count: number;
}

export interface ClosingProject {
  in_30_days: number;
  in_45_days: number;
}

export interface HealthStatusDistribution {
  red_count: number;
  amber_count: number;
  green_count: number;
  total_count: number;
}

export interface ProjectSearchResult {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  project_manager?: string;
  current_health_status?: HealthStatus;
  last_updated?: string;
}

export interface ProjectSearchResponse {
  results: ProjectSearchResult[];
  total_count: number;
}

export interface StatusUpdateCreate {
  project_id: number;
  health_status: HealthStatus;
  risk_area?: string;
  mitigation_plan?: string;
  comments?: string;
  updated_by: string;
}

export interface StatusUpdateResponse {
  id: number;
  project_id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  health_status: HealthStatus;
  risk_area?: string;
  mitigation_plan?: string;
  comments?: string;
  updated_by: string;
  created_at: string;
  version: number;
}
