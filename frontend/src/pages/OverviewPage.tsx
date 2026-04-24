/**
 * Overview page with project list and health distribution
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";

import apiClient from "../api/client";
import { useUIStore } from "../store/ui";

import HealthUpdateModal from "../components/HealthUpdateModal";
import { ProjectListItem } from "../types";

const QUERY_KEYS = {
  projects: ["projects"],
  distribution: ["healthDistribution"],
  engagementsByPM: ["engagementsByPM"],
  deliveryCycle: ["deliveryCycle"],
  engagementsByClient: ["engagementsByClient"],
  closingProjects: ["closingProjects"],
};

export default function OverviewPage() {
  const toLabelCount = (obj) =>
    Object.entries(obj).map(([label, count]) => ({ label, count }));
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const includeInternal = useUIStore((state) => state.includeInternalProjects);
  const searchTerm = useUIStore((state) => state.searchTerm);
  const setSearchTerm = useUIStore((state) => state.setSearchTerm);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.projects, includeInternal, searchTerm],
    queryFn: () => apiClient.getProjects(includeInternal),
  });

  const { data: distribution } = useQuery({
    queryKey: [...QUERY_KEYS.distribution, includeInternal],
    queryFn: () => apiClient.getHealthDistribution(includeInternal),
  });

  const { data: pmSummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.engagementsByPM, includeInternal],
    queryFn: () => apiClient.getEngagementsByProjectManager(includeInternal),
    select: (data) => toLabelCount(data),
  });

  const { data: deliveryCycleSummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.deliveryCycle, includeInternal],
    queryFn: () => apiClient.getDeliveryCycleSummary(includeInternal),
    select: (data) => {
      const labels = {
        initiation: "Initiation",
        closure: "Closure & Hypercare",
        execution: "Execution",
      };

      // Convert to the array format used by your components
      return Object.entries(data).map(([key, count]) => ({
        label: labels[key] || key,
        count,
      }));
    },
  });

  const { data: clientSummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.engagementsByClient, includeInternal],
    queryFn: () => apiClient.getEngagementsByClients(includeInternal),
    select: (data) => toLabelCount(data),
  });

  const { data: closingProjectsSummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.closingProjects, includeInternal],
    queryFn: () => apiClient.getClosingProjects(includeInternal),
    select: (data) => {
      // Define the map of API keys to UI labels
      const labels = {
        in_30_days: "In 30 days",
        in_45_days: "In 45 days",
      };

      // Convert to the array format used by your components
      return Object.entries(data).map(([key, count]) => ({
        label: labels[key] || key,
        count,
      }));
    },
  });

  // const { data: closingProjects = [] } = useQuery({
  //   queryKey: [...QUERY_KEYS.closingProjects, includeInternal],
  //   queryFn: () => apiClient.getClosingProjects(includeInternal),
  //   select: (data) => toLabelCount(data),
  // });

  const handleHealthUpdate = (project: ProjectListItem) => {
    setSelectedProject(project);
    setShowHealthModal(true);
  };

  const handleModalClose = () => {
    setShowHealthModal(false);
    setSelectedProject(null);
  };

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.distribution });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.engagementsByPM });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deliveryCycle });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.engagementsByClient });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.closingProjects });
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Overall Projects Summary
        </h1>
        <p className="text-gray-600">Project engagements summary and metrics</p>
      </div>

      {/* 1. Full Width Top Row: RAG Status */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Combined Title and Total Count in header to save vertical space */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Overall Projects Health</h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase">
            {distribution?.total_count || 0} Total Projects
          </span>
        </div>

        {distribution && (
          <div className="grid grid-cols-1 gap-3 max-w-4xl">
            {[
              {
                label: "Red",
                count: distribution.red_count,
                color: "bg-red-500",
              },
              {
                label: "Amber",
                count: distribution.amber_count,
                color: "bg-amber-500",
              },
              {
                label: "Green",
                count: distribution.green_count,
                color: "bg-emerald-500",
              },
              {
                label: "Completed",
                count: distribution.completed_count || 0,
                color: "bg-blue-500",
              },
            ].map((status) => (
              <div key={status.label} className="flex items-center gap-4">
                {/* Label and Count (Fixed width to align bars) */}
                <div className="w-24 flex justify-between text-xs">
                  <span className="text-gray-600 font-medium">
                    {status.label}
                  </span>
                  <span className="font-bold text-gray-900">
                    {status.count}
                  </span>
                </div>

                {/* progress bar */}
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${status.color}`}
                    style={{
                      width: `${distribution.total_count > 0 ? (status.count / distribution.total_count) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Three Column Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Project Managers | Delivery Lead", data: pmSummary },

          { title: "Clients", data: clientSummary },
          { title: "Delivery Cycle", data: deliveryCycleSummary },
          { title: "Closing Projects", data: closingProjectsSummary },
        ].map((section) => (
          <div key={section.title} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <div className="space-y-3">
              {section.data.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No data</p>
              ) : (
                section.data.slice(0, 5).map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate mr-2">
                      {item.label}
                    </span>
                    <span className="font-semibold text-gray-900 shrink-0">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Closing Projects Table 
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Closing Projects (Next 45 Days)
          </h3>
          <Link
            to="/projects"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 uppercase">
              <tr>
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 pl-4">End Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {closingProjects.map((p) => (
                <tr key={p.project_code}>
                  <td className="py-3 pr-4 font-medium">{p.project_name}</td>
                  <td className="py-3 px-4">{p.client_name}</td>
                  <td className="py-3 px-4">{p.project_manager || "-"}</td>
                  <td className="py-3 pl-4">
                    {p.end_date
                      ? new Date(p.end_date).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
}
