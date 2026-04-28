/**
 * Type definitions for the application
 */

export enum HealthStatus {
  RED = "red",
  AMBER = "amber",
  GREEN = "green",
  COMPLETED = "completed",
}

export enum DeliveryCycle {
  INITIATION = "initiation",
  EXECUTION = "execution",
  CLOSURE = "closure",
  ON_HOLD = "on_hold",
}

export const DELIVERY_CYCLE_LABELS: Record<DeliveryCycle, string> = {
  [DeliveryCycle.INITIATION]: "Initiation",
  [DeliveryCycle.EXECUTION]: "Execution",
  [DeliveryCycle.CLOSURE]: "Closure & Hypercare",
  [DeliveryCycle.ON_HOLD]: "On Hold",
};

export enum RiskArea {
  TECHNICAL_SOLUTION = "Technical solution",
  SOLUTION_ADOPTION = "Solution adoption",
  PROJECT_DELIVERY = "Project delivery",
  RESOURCE_RISK = "Resource risk",
  COST_OVERRUNS = "Cost overruns",
  COMMERCIAL_COVER = "Commercial cover",
  COMPLIANCE = "Compliance",
  SCOPE_CREEP = "Scope creep",
  STAKEHOLDER_RISK = "Stakeholder Risk",
  SCHEDULE = "Schedule",
  BID_VS_DID = "Bid vs Did",
  COMPETITOR_RISK = "Competitor Risk",
  REVENUE_RISK = "Revenue Risk",
}

export const RISK_AREA_LABELS: Record<RiskArea, string> = {
  [RiskArea.TECHNICAL_SOLUTION]: "Technical solution",
  [RiskArea.SOLUTION_ADOPTION]: "Solution adoption",
  [RiskArea.PROJECT_DELIVERY]: "Project delivery",
  [RiskArea.RESOURCE_RISK]: "Resource risk",
  [RiskArea.COST_OVERRUNS]: "Cost overruns",
  [RiskArea.COMMERCIAL_COVER]: "Commercial cover",
  [RiskArea.COMPLIANCE]: "Compliance",
  [RiskArea.SCOPE_CREEP]: "Scope creep",
  [RiskArea.STAKEHOLDER_RISK]: "Stakeholder Risk",
  [RiskArea.SCHEDULE]: "Schedule",
  [RiskArea.BID_VS_DID]: "Bid vs Did",
  [RiskArea.COMPETITOR_RISK]: "Competitor Risk",
  [RiskArea.REVENUE_RISK]: "Revenue Risk",
};

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

export interface StatusUpdateCreate {
  project_id: number;
  updated_by: string;
  health_status: HealthStatus;
  risk_area?: string;
  rag_by_revenue?: HealthStatus;
  mitigation_plan?: string;
  delivery_cycle?: DeliveryCycle;
  comments?: string;
}

export interface HealthStatusDistribution {
  red_count: number;
  amber_count: number;
  green_count: number;
  total_count: number;
  completed_count: number;
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
  rag_by_revenue?: HealthStatus;
  delivery_cycle?: DeliveryCycle;
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
  rag_by_revenue?: HealthStatus;
  risk_area?: string;
  current_mitigation_plan?: string;
  current_comments?: string;
  last_updated?: string;
  delivery_cycle?: DeliveryCycle;
}

export interface SummaryItem {
  label: string;
  count: number;
}

export interface ClosingProject {
  in_30_days: number;
  in_45_days: number;
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

export interface RagTrendItem {
  value: HealthStatus;
  updatedAt: string;
}

export interface RagTrendResponse {
  health_status_trend: RagTrendItem[];
  rag_by_revenue_trend: RagTrendItem[];
}
