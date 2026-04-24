/**
 * Type definitions for the application
 */

export enum HealthStatus {
  RED = "red",
  AMBER = "amber",
  GREEN = "green",
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
  created_by: string;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  current_health_update?: ProjectHealthUpdate;
  health_history: ProjectHealthUpdate[];
}

export interface ProjectListItem {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  current_health_status?: HealthStatus;
  risk_area?: string;
  last_updated: string;
}

export interface HealthStatusDistribution {
  red_count: number;
  amber_count: number;
  green_count: number;
  total_count: number;
  completed_count: number;
}
