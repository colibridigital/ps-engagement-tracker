/**
 * Overview page with project list and health distribution
 */
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ArrowUpDown } from "lucide-react";

import apiClient from "../api/client";
import { useUIStore } from "../store/ui";

import HealthUpdateModal from "../components/HealthUpdateModal";
import {
  ProjectListItem,
  DeliveryCycle,
  DELIVERY_CYCLE_LABELS,
} from "../types/index";

const QUERY_KEYS = {
  projects: ["projects"],
  distribution: ["healthDistribution"],
  revenueDistribution: ["revenueHealthDistribution"],
  engagementsByPM: ["engagementsByPM"],
  deliveryCycle: ["deliveryCycle"],
  engagementsByClient: ["engagementsByClient"],
  closingProjects: ["closingProjects"],
};

export default function OverviewPage() {
  const toLabelCount = (obj: Record<string, number> | undefined) =>
    obj ? Object.entries(obj).map(([label, count]) => ({ label, count })) : [];
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [pmSort, setPmSort] = useState<"alphabetical" | "value">(
    "alphabetical",
  );
  const [clientSort, setClientSort] = useState<"alphabetical" | "value">(
    "alphabetical",
  );

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

  const { data: revenueDistribution } = useQuery({
    queryKey: [...QUERY_KEYS.revenueDistribution, includeInternal],
    queryFn: () => apiClient.getRevenueHealthDistribution(includeInternal),
  });

  const { data: pmData } = useQuery({
    queryKey: [...QUERY_KEYS.engagementsByPM, includeInternal],
    queryFn: () => apiClient.getEngagementsByProjectManager(includeInternal),
  });

  const pmSummary = useMemo(() => {
    const data = toLabelCount(pmData);
    if (pmSort === "alphabetical") {
      return data.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      return data.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });
    }
  }, [pmData, pmSort]);

  const { data: deliveryCycleSummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.deliveryCycle, includeInternal],
    queryFn: () => apiClient.getDeliveryCycleSummary(includeInternal),
    select: (data) => {
      // Define the desired order and corresponding labels
      const orderedKeys: DeliveryCycle[] = [
        DeliveryCycle.STAFF_AUGMENTATION,
        DeliveryCycle.INITIATION,
        DeliveryCycle.EXECUTION,
        DeliveryCycle.CLOSURE,
        DeliveryCycle.ON_HOLD,
      ];

      // Map over the ordered keys to ensure the correct display order
      return orderedKeys
        .filter((key) => data && typeof data[key] !== "undefined") // Ensure key exists in data
        .map((key) => ({
          label: DELIVERY_CYCLE_LABELS[key],
          count: data[key],
        }));
    },
  });

  const { data: clientData } = useQuery({
    queryKey: [...QUERY_KEYS.engagementsByClient, includeInternal],
    queryFn: () => apiClient.getEngagementsByClients(includeInternal),
  });

  const clientSummary = useMemo(() => {
    const data = toLabelCount(clientData);
    if (clientSort === "alphabetical") {
      return data.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      return data.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });
    }
  }, [clientData, clientSort]);

  // const { data: closingProjectsSummary = [] } = useQuery({
  //   queryKey: [...QUERY_KEYS.closingProjects, includeInternal],
  //   queryFn: () => apiClient.getClosingProjects(includeInternal),
  //   select: (data) => {
  //     // Define the map of API keys to UI labels
  //     const labels = {
  //       in_30_days: "In 30 days",
  //       in_45_days: "In 45 days",
  //     };

  //     // Convert to the array format used by your components
  //     return Object.entries(data).map(([key, count]) => ({
  //       label: labels[key] || key,
  //       count,
  //     }));
  //   },
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
        <p className="text-gray-600">Project Engagement Summary and Metrics</p>
      </div>

      {/* 1. RAG Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Projects Health Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Overall Projects Health</h3>
            {distribution && (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {distribution.total_count || 0} of{" "}
                {(distribution.total_count || 0) +
                  (distribution.no_status_count || 0)}{" "}
                projects with RAG
              </span>
            )}
          </div>

          {distribution && (
            <div className="grid grid-cols-1 gap-3">
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
                  <div className="w-24 flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      {status.label}
                    </span>
                    <span className="font-bold text-gray-900">
                      {status.count}
                    </span>
                  </div>
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

        {/* RAG by Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">RAG by revenue</h3>
            {revenueDistribution && (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {revenueDistribution.total_count || 0} of{" "}
                {(revenueDistribution.total_count || 0) +
                  (revenueDistribution.no_status_count || 0)}{" "}
                projects with RAG
              </span>
            )}
          </div>

          {revenueDistribution && (
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  label: "Red",
                  count: revenueDistribution.red_count,
                  color: "bg-red-500",
                },
                {
                  label: "Amber",
                  count: revenueDistribution.amber_count,
                  color: "bg-amber-500",
                },
                {
                  label: "Green",
                  count: revenueDistribution.green_count,
                  color: "bg-emerald-500",
                },
                {
                  label: "Completed",
                  count: revenueDistribution.completed_count || 0,
                  color: "bg-blue-500",
                },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-4">
                  <div className="w-24 flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      {status.label}
                    </span>
                    <span className="font-bold text-gray-900">
                      {status.count}
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color}`}
                      style={{
                        width: `${revenueDistribution.total_count > 0 ? (status.count / revenueDistribution.total_count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Three Column Summary Row */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Project Managers | Delivery Lead Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Project Managers | Delivery Lead
            </h3>
            <button
              onClick={() =>
                setPmSort((prev) =>
                  prev === "alphabetical" ? "value" : "alphabetical",
                )
              }
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Toggle sort order"
              title={
                pmSort === "alphabetical"
                  ? "Sort by count"
                  : "Sort alphabetically"
              }
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {pmSummary.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No data</p>
            ) : (
              pmSummary.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
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

        {/* Clients Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Clients</h3>
            <button
              onClick={() =>
                setClientSort((prev) =>
                  prev === "alphabetical" ? "value" : "alphabetical",
                )
              }
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Toggle sort order"
              title={
                clientSort === "alphabetical"
                  ? "Sort by count"
                  : "Sort alphabetically"
              }
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {clientSummary.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No data</p>
            ) : (
              clientSummary.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
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

        {/* Delivery Cycle and Closing Projects Column */}
        <div className="flex flex-col gap-6 h-full">
          {/* Delivery Cycle Card */}
          <div className="bg-white rounded-lg shadow p-6 h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Delivery Cycle</h3>
            <div className="space-y-3">
              {deliveryCycleSummary.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No data</p>
              ) : (
                deliveryCycleSummary.map((item) => (
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

          {/* Closing Projects Card
          <div className="bg-white rounded-lg shadow p-6 h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Closing Projects</h3>
            <div className="space-y-3">
              {closingProjectsSummary.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No data</p>
              ) : (
                closingProjectsSummary.map((item) => (
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
          </div> */}
        </div>
      </div>
    </div>
  );
}
