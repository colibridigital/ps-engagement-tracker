/**
 * Projects detail page
 */

import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Calendar } from "lucide-react";
import {
  Briefcase,
  Banknote,
  Info,
  ShieldAlert,
  Tag,
  Mail,
  StickyNote,
  CheckCircle,
  Clock,
} from "lucide-react";
import apiClient from "../api/client";
import HealthBadge from "../components/HealthBadge";
import HealthUpdateModal from "../components/HealthUpdateModal";
import RagTrend from "../components/RagTrend";
import toast from "react-hot-toast";
import {
  ProjectListItem,
  ProjectDetail,
  DELIVERY_CYCLE_LABELS,
  RagTrendResponse,
} from "../types/index";

const QUERY_KEYS = {
  projectDetail: (id: number) => ["projectDetail", id],
  ragTrend: (id: number) => ["ragTrend", id],
  changeHistory: (id: number) => ["changeHistory", id],
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [showHealthModal, setShowHealthModal] = useState(false);

  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;

  if (!numericProjectId) {
    return <div className="p-6">Project ID not found</div>;
  }

  const { data: detail, isLoading } = useQuery<ProjectDetail>({
    queryKey: QUERY_KEYS.projectDetail(numericProjectId),
    queryFn: () => apiClient.getProjectDetail(numericProjectId),
  });

  const { data: trendData } = useQuery<RagTrendResponse>({
    queryKey: QUERY_KEYS.ragTrend(numericProjectId),
    queryFn: () => apiClient.getRagTrend(numericProjectId),
  });

  const { data: teamData } = useQuery({
    queryKey: ["projectTeam", numericProjectId],
    queryFn: () => apiClient.getProjectTeam(numericProjectId),
    enabled: !!numericProjectId,
  });

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.projectDetail(numericProjectId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.changeHistory(numericProjectId),
    });
    toast.success("Project status updated successfully!");
  };

  if (isLoading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (!detail) {
    return <div className="p-6">Project not found</div>;
  }

  const projectForModal: ProjectListItem = {
    project_id: detail.project.project_id,
    project_code: detail.project.project_code,
    project_name: detail.project.project_name,
    client_name: detail.project.client_name,
    current_health_status: detail.current_status?.health_status,
    risk_area: detail.current_status?.risk_area,
    last_updated: detail.current_status?.updated_at,
    current_mitigation_plan: detail.current_status?.mitigation_plan,
    current_comments: detail.current_status?.comments,
    delivery_cycle: detail.current_status?.delivery_cycle,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {detail.project.project_name}
            </h1>
            <p className="text-gray-600">{detail.project.project_code}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/projects/${encodeURIComponent(
                numericProjectId,
              )}/change-history`} // Use projectId for change history link
              className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              View Change History
            </Link>
            <button
              onClick={() => setShowHealthModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Project Status
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Project Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Project Health Status */}
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Project Health Status
                </p>
                <div className="flex items-end">
                  <HealthBadge
                    status={detail.current_status?.health_status}
                    size="md"
                  />
                  <div className="ml-auto pl-8 pr-4">
                    <RagTrend
                      trend={trendData?.health_status_trend}
                      count={5}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <InfoItem
                    label="Delivery Cycle"
                    value={
                      detail.current_status?.delivery_cycle
                        ? DELIVERY_CYCLE_LABELS[
                            detail.current_status.delivery_cycle
                          ]
                        : undefined
                    }
                  />
                  <div className="mt-4">
                    <InfoItem
                      label="Mitigation Plan"
                      value={detail.current_status?.mitigation_plan}
                      preWrap
                    />
                  </div>
                </div>
              </div>
              {/* RAG by Revenue */}
              <div>
                <p className="text-sm text-gray-500 mb-2">RAG by Revenue</p>
                <div className="flex items-end">
                  <HealthBadge
                    status={detail.current_status?.rag_by_revenue}
                    size="md"
                  />
                  <div className="ml-auto pl-8 pr-4">
                    <RagTrend
                      trend={trendData?.rag_by_revenue_trend}
                      count={5}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <InfoItem
                    label="Risk Area"
                    value={detail.current_status?.risk_area}
                  />
                  <div className="mt-4">
                    <InfoItem
                      label="Comments"
                      value={detail.current_status?.comments}
                      preWrap
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              {detail.current_status && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(
                        detail.current_status.updated_at,
                      ).toLocaleString()}{" "}
                      by {detail.current_status.updated_by}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Project Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Project Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem
                icon={Briefcase}
                label="Client"
                value={detail.project.client_name}
              />
              <InfoItem
                icon={CheckCircle}
                label="Project Active"
                value={detail.project.project_active ? "Yes" : "No"}
              />
              <InfoItem
                icon={Briefcase}
                label="Stage"
                value={detail.project.stage}
              />
              <InfoItem
                icon={Users}
                label="Project Manager"
                value={detail.project.project_manager_name}
              />
              <InfoItem
                icon={Mail}
                label="Project Manager Email"
                value={detail.project.project_manager_email}
              />
              <InfoItem
                icon={CheckCircle}
                label="Is Billable"
                value={detail.project.is_billable ? "Yes" : "No"}
              />
              <InfoItem
                icon={Tag}
                label="Project Tags"
                value={detail.project.project_tags}
              />
              <InfoItem
                icon={Calendar}
                label="Planned Start Date"
                value={
                  detail.project.project_planned_start_date
                    ? new Date(
                        detail.project.project_planned_start_date,
                      ).toLocaleDateString()
                    : ""
                }
              />
              <InfoItem
                icon={Calendar}
                label="Planned End Date"
                value={
                  detail.project.project_planned_end_date
                    ? new Date(
                        detail.project.project_planned_end_date,
                      ).toLocaleDateString()
                    : ""
                }
              />
              <InfoItem
                icon={Clock}
                label="Created Time"
                value={new Date(
                  detail.project.created_timestamp,
                ).toLocaleString()}
              />
              <InfoItem
                icon={Clock}
                label="Modified Time"
                value={new Date(
                  detail.project.project_modified_timestamp,
                ).toLocaleString()}
              />
              {detail.project.project_note && (
                <InfoItem
                  icon={StickyNote}
                  label="Project Note"
                  value={detail.project.project_note}
                  fullWidth
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Financial Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Banknote className="w-5 h-5 mr-2" />
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem
                icon={Banknote}
                label="Total Budget"
                value={Number(detail.project.total_budget).toLocaleString(
                  "en-GB",
                )}
              />
              <InfoItem
                icon={Briefcase}
                label="Budget Type"
                value={detail.project.budget_type}
              />
              <InfoItem
                icon={Briefcase}
                label="Budget Currency"
                value={detail.project.budget_currency}
              />
              <InfoItem
                icon={Briefcase}
                label="Budget Currency Rate"
                value={detail.project.budget_currency_rate?.toString()}
              />
              <InfoItem
                icon={CheckCircle}
                label="Budget Per Phase"
                value={detail.project.budget_per_phase ? "Yes" : "No"}
              />
            </div>
          </div>

          {/* Team Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team
            </h3>
            <div className="text-sm text-gray-600">
              {teamData && teamData.team.length > 0 ? (
                teamData.team.map((member) => (
                  <p key={member.email} className="py-1">
                    • {member.name.trim() || "N/A"}
                  </p>
                ))
              ) : (
                <p>No team members found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHealthModal && (
        <HealthUpdateModal
          project={projectForModal}
          isOpen={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value?: string | null;
  fullWidth?: boolean;
  preWrap?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon: Icon,
  label,
  value,
  fullWidth,
  preWrap,
}) => {
  if (!value) return null;

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <p className="text-sm text-gray-500 flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-1" />}
        {label}
      </p>
      <p
        className={`text-sm font-medium text-gray-900 ${preWrap ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </p>
    </div>
  );
};
