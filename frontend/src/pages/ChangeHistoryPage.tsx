import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import HealthBadge from "../components/HealthBadge"; //
import { ProjectHealthUpdate, DELIVERY_CYCLE_LABELS } from "../types";
import { ArrowLeft } from "lucide-react";

const QUERY_KEYS = {
  changeHistory: ["changeHistory"],
};

export default function ChangeHistoryPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;

  const { data: changeHistory = [], isLoading } = useQuery<
    ProjectHealthUpdate[]
  >({
    queryKey: [...QUERY_KEYS.changeHistory, numericProjectId],
    queryFn: () => {
      if (!numericProjectId) {
        return Promise.resolve([]); // Return empty array if no ID
      }
      return apiClient.getProjectChangeHistory(numericProjectId);
    },
    enabled: !!numericProjectId, // Only run query if projectId is valid
  });

  if (!numericProjectId) {
    return <div className="p-6">Project ID not found</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading change history...</div>;
  }

  const projectName = changeHistory[0]?.project_name || "Project";
  const projectCode = changeHistory[0]?.project_code || "";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to={`/projects/${numericProjectId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project Details
        </Link>

        <h1 className="text-xl font-bold text-gray-900">Change History</h1>
        <p className="text-gray-600">
          History of changes to RAG status, mitigation plans, risk area, and
          comments for{" "}
          <span style={{ fontWeight: 500 }}>
            {projectName}
            {projectCode && ` (${projectCode})`}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Changed By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                RAG by Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Cycle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Risk Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mitigation Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Comments
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading change history...
                </td>
              </tr>
            ) : changeHistory.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No change history records found.
                </td>
              </tr>
            ) : (
              changeHistory.map((record: ProjectHealthUpdate) => (
                <tr
                  key={`${record.project_id}-${record.updated_at}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-700">
                    {record.updated_by || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(record.updated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <HealthBadge status={record.health_status} />
                  </td>
                  <td className="px-6 py-4">
                    <HealthBadge status={record.rag_by_revenue} />
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.delivery_cycle
                      ? DELIVERY_CYCLE_LABELS[record.delivery_cycle]
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.risk_area || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.mitigation_plan || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.comments || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
