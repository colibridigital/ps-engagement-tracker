/**
 * API client for backend communication
 */

import axios, { AxiosInstance } from "axios";
import { getApiUrl } from "../config";
import {
  ProjectListItem,
  ProjectDetail,
  ProjectHealthUpdate,
  HealthStatusDistribution,
  ProjectTeam,
  SummaryItem,
  ClosingProject,
  ProjectSearchResponse,
  StatusUpdateCreate,
  StatusUpdateResponse,
} from "../types/index";
import {
  HealthStatus,
  RagTrendResponse,
  RagTrendItem,
  DeliveryCycle,
} from "../types/index";

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get list of all projects
   */
  async getProjects(
    includeInternal: boolean = false,
  ): Promise<ProjectListItem[]> {
    const response = await this.client.get<ProjectListItem[]>(
      "/api/projects/",
      {
        params: {
          include_internal: includeInternal,
        },
      },
    );
    return response.data;
  }

  /**
   * Get project detail including health history
   */
  async getProjectDetail(projectId: number): Promise<ProjectDetail> {
    const response = await this.client.get<ProjectDetail>(
      `/api/projects/${projectId}`,
    );
    return response.data;
  }

  /**
   * Get health status history for a project
   */
  async getProjectChangeHistory(
    projectId: number,
    limit: number = 50,
  ): Promise<ProjectHealthUpdate[]> {
    const response = await this.client.get<ProjectHealthUpdate[]>(
      `/api/projects/${projectId}/change-history`,
      {
        params: { limit },
      },
    );
    return response.data;
  }

  /**
   * Create a new status update
   */
  async createStatusUpdate(
    projectId: number,
    updatedBy: string,
    healthStatus: HealthStatus,
    riskArea?: string,
    ragByRevenue?: HealthStatus,
    mitigationPlan?: string,
    deliveryCycle?: DeliveryCycle,
    comments?: string,
  ): Promise<StatusUpdateResponse> {
    // The structure of the payload (the body) remains the same
    const payload = {
      updated_by: updatedBy,
      health_status: healthStatus,
      risk_area: riskArea,
      rag_by_revenue: ragByRevenue,
      mitigation_plan: mitigationPlan,
      delivery_cycle: deliveryCycle,
      comments: comments,
    };

    // The URL now includes the projectId
    const response = await this.client.post<StatusUpdateResponse>(
      `/api/projects/${projectId}/status-update`,
      payload,
    );

    return response.data;
  }

  /**
   * Search projects
   */
  async searchProjects(
    query: string,
    limit: number = 20,
  ): Promise<ProjectSearchResponse> {
    const response = await this.client.get<ProjectSearchResponse>(
      "/api/projects/search",
      {
        params: { q: query, limit },
      },
    );
    return response.data;
  }

  /**
   * Get health status distribution (renamed from health-distribution to rag-distribution)
   */
  async getHealthDistribution(
    includeInternal: boolean = false,
  ): Promise<HealthStatusDistribution> {
    const response = await this.client.get<HealthStatusDistribution>(
      "/api/projects/overview/rag-project-health",
      {
        params: { include_internal: includeInternal },
      },
    );
    return response.data;
  }

  /**
   * Get health status distribution by revenue
   */
  async getRevenueHealthDistribution(
    includeInternal: boolean = false,
  ): Promise<HealthStatusDistribution> {
    const response = await this.client.get<HealthStatusDistribution>(
      "/api/projects/overview/rag-project-revenue",
      {
        params: { include_internal: includeInternal },
      },
    );
    return response.data;
  }

  async getEngagementsByProjectManager(
    includeInternal: boolean = false,
  ): Promise<SummaryItem[]> {
    const response = await this.client.get<SummaryItem[]>(
      "/api/projects/overview/engagements-by-pm",
      { params: { include_internal: includeInternal } },
    );
    return response.data;
  }

  async getDeliveryCycleSummary(
    includeInternal: boolean = false,
  ): Promise<SummaryItem[]> {
    const response = await this.client.get<SummaryItem[]>(
      "/api/projects/overview/delivery-cycle",
      { params: { include_internal: includeInternal } },
    );
    return response.data;
  }

  async getEngagementsByClients(
    includeInternal: boolean = false,
  ): Promise<SummaryItem[]> {
    const response = await this.client.get<SummaryItem[]>(
      "/api/projects/overview/engagements-by-client",
      { params: { include_internal: includeInternal } },
    );
    return response.data;
  }

  async getClosingProjects(
    includeInternal: boolean = false,
  ): Promise<ClosingProject[]> {
    const response = await this.client.get<ClosingProject[]>(
      "/api/projects/overview/closing-projects",
      { params: { include_internal: includeInternal } },
    );
    return response.data;
  }
  /**
   * Get project team members
   */
  async getProjectTeam(projectId: number): Promise<ProjectTeam> {
    const response = await this.client.get<ProjectTeam>(
      `/api/projects/${projectId}/team`,
    );
    return response.data;
  }

  /**
   * Get RAG trend for a project
   */
  async getRagTrend(projectId: number): Promise<RagTrendResponse> {
    // The raw response from the mock API has a different structure
    const response = await this.client.get<{
      health_status: { value: HealthStatus; updated_at: string }[];
      rag_by_revenue: { value: HealthStatus; updated_at: string }[];
    }>(`/api/projects/${projectId}/rag-trend`);

    // Transform the data to match the RagTrendResponse interface
    const transformedData: RagTrendResponse = {
      health_status_trend: response.data.health_status.map((item) => ({
        value: item.value,
        updatedAt: item.updated_at,
      })),
      rag_by_revenue_trend: response.data.rag_by_revenue.map((item) => ({
        value: item.value,
        updatedAt: item.updated_at,
      })),
    };
    return transformedData;
  }
}

const apiClient = new APIClient(getApiUrl());

export default apiClient;
