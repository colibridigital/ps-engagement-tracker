import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown, X as ClearIcon, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import HealthBadge from "../components/HealthBadge";
import { useUIStore } from "../store/ui"; // Assuming this is where searchTerm is managed
import {
  ProjectListItem,
  DeliveryCycle,
  DELIVERY_CYCLE_LABELS,
} from "../types";

const QUERY_KEYS = {
  projects: ["projects"],
};

const INTERNAL_CLIENT_NAMES = ["Colibri", "Colibri Digital"];

type SortDirection = "ascending" | "descending";
type SortConfig = {
  key: keyof ProjectListItem;
  direction: SortDirection;
};
export default function ProjectsListPage() {
  const searchTerm = useUIStore((state) => state.searchTerm);
  const setSearchTerm = useUIStore((state) => state.setSearchTerm);
  const includeInternal = useUIStore((state) => state.includeInternalProjects);
  const setIncludeInternal = useUIStore(
    (state) => state.setIncludeInternalProjects,
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: "project_name",
    direction: "ascending",
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [pmFilter, setPmFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  // const [sltFilter, setSltFilter] = useState("");
  const [deliveryCycleFilter, setDeliveryCycleFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 1000,
  });

  const { data: projectData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.projects, includeInternal, pagination],
    queryFn: async () => {
      // Pass pagination and search term to the API client
      const response = await apiClient.getProjects(
        includeInternal,
        pagination.page,
        pagination.pageSize,
      );

      // The API now returns a paginated object { results: [...] }.
      // We need to transform the items inside the `results` array.
      const transformedProjects = response.results.map((item: any) => {
        // This handles the nested structure: { project: {...}, current_status: {...} }
        return {
          ...item.project,
          ...item.current_status,
          id: item.project.project_id || item.project.id,
          current_health_status: item.current_status?.health_status,
          risk_area: item.current_status?.risk_area,
          current_mitigation_plan: item.current_status?.mitigation_plan,
          current_comments: item.current_status?.comments,
          delivery_cycle: item.current_status?.delivery_cycle,
          last_updated: item.current_status?.updated_at,
        };
      });

      return { ...response, results: transformedProjects };
    },
  });
  const allProjects = projectData?.results || [];

  const requestSort = (key: keyof ProjectListItem) => {
    let direction: SortDirection = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof ProjectListItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 ml-2 opacity-20" />;
    }
    if (sortConfig.direction === "ascending") {
      return <ArrowUpDown className="w-4 h-4 ml-2" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-2 transform rotate-180" />;
  };

  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const pms = new Set<string>();
    const clients = new Set<string>();
    // const slts = new Set<string>();

    allProjects.forEach((p) => {
      if (p.current_health_status) statuses.add(p.current_health_status);
      if (p.project_manager_name) pms.add(p.project_manager_name);
      if (p.client_name) clients.add(p.client_name);
      // if (p.slt) slts.add(p.slt);
    });

    return {
      statuses: [...statuses].sort(),
      pms: [...pms].sort(),
      clients: [...clients].sort(),
      // slts: [...slts].sort(),
    };
  }, [allProjects]);

  const sortedAndFilteredProjects = useMemo(() => {
    let projects = allProjects;

    if (!includeInternal) {
      projects = projects.filter(
        (p) => !INTERNAL_CLIENT_NAMES.includes(p.client_name || ""),
      );
    }

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      projects = projects.filter(
        (p) =>
          (p.project_name &&
            p.project_name.toLowerCase().includes(lowercasedFilter)) ||
          (p.project_code &&
            p.project_code.toLowerCase().includes(lowercasedFilter)),
      );
    }

    if (statusFilter) {
      projects = projects.filter(
        (p) => p.current_health_status === statusFilter,
      );
    }

    if (pmFilter) {
      projects = projects.filter((p) => p.project_manager_name === pmFilter);
    }

    if (clientFilter) {
      projects = projects.filter((p) => p.client_name === clientFilter);
    }

    // if (sltFilter) {
    //   projects = projects.filter((p) => p.slt === sltFilter);
    // }

    if (deliveryCycleFilter) {
      projects = projects.filter(
        (p) => p.delivery_cycle === deliveryCycleFilter,
      );
    }

    if (sortConfig !== null) {
      projects = [...projects].sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return projects;
  }, [
    allProjects,
    searchTerm,
    includeInternal,
    sortConfig,
    statusFilter,
    pmFilter,
    clientFilter,
    // sltFilter,
    deliveryCycleFilter,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPmFilter("");
    setClientFilter("");
    // setSltFilter("");
    setDeliveryCycleFilter("");
    setIncludeInternal(false);
  };

  const hasActiveFilters =
    !!searchTerm ||
    !!statusFilter ||
    !!pmFilter ||
    !!clientFilter ||
    // !!sltFilter ||
    !!deliveryCycleFilter ||
    includeInternal;

  return (
    <div className="p-6">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Browse and search active projects</p>
        </div>
        {projectData && (
          <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {projectData.total_count} Total Projects
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-3 mb-6">
        <div className="flex flex-col gap-4">
          {/* Primary Filter Row */}
          <div className="flex gap-2 items-center">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center px-4 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters (collapsible) */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end ">
                <div>
                  <label
                    htmlFor="status-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="">All</option>
                    {filterOptions.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="client-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Client
                  </label>
                  <select
                    id="client-filter"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="">All</option>
                    {filterOptions.clients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="pm-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Project Manager
                  </label>
                  <select
                    id="pm-filter"
                    value={pmFilter}
                    onChange={(e) => setPmFilter(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="">All</option>
                    {filterOptions.pms.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <div>
                  <label
                    htmlFor="slt-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    SLT
                  </label>
                  <select
                    id="slt-filter"
                    value={sltFilter}
                    onChange={(e) => setSltFilter(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="">All</option>
                    {filterOptions.slts.map((slt) => (
                      <option key={slt} value={slt}>
                        {slt}
                      </option>
                    ))}
                  </select>
                </div> */}
                <div>
                  <label
                    htmlFor="delivery-cycle-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Delivery Cycle
                  </label>
                  <select
                    id="delivery-cycle-filter"
                    value={deliveryCycleFilter}
                    onChange={(e) => setDeliveryCycleFilter(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="">All</option>
                    {Object.entries(DELIVERY_CYCLE_LABELS).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="lg:col-span-5 lg:col-start-5 flex items-center justify-end h-1">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ClearIcon className="w-4 h-4 mr-1" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {(
                [
                  { key: "project_name", label: "Project" },
                  { key: "project_code", label: "Code" },
                  { key: "client_name", label: "Client" },
                  { key: "project_manager_name", label: "Project Manager" },
                  // { key: "slt", label: "SLT" },
                  { key: "current_health_status", label: "Project Health" },
                  { key: "delivery_cycle", label: "Delivery Cycle" },
                ] as const
              ).map(({ key, label }) => (
                <th
                  key={label}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort(key)}
                >
                  <div className="flex items-center">
                    {label} {getSortIndicator(key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ">
                Risk Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ">
                Mitigation Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ">
                Comments
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort("last_updated")}
              >
                <div className="flex items-center">
                  Last Updated {getSortIndicator("last_updated")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td
                  colSpan={13}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Loading projects...
                </td>
              </tr>
            ) : sortedAndFilteredProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No projects found
                </td>
              </tr>
            ) : (
              sortedAndFilteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {project.project_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {project.project_code}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {project.client_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {project.project_manager_name || "-"}
                  </td>
                  {/* <td className="px-6 py-4 text-gray-600">
                    {project.slt || "-"}
                  </td> */}
                  <td className="px-6 py-4">
                    <HealthBadge status={project.current_health_status} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {(project.delivery_cycle &&
                      DELIVERY_CYCLE_LABELS[project.delivery_cycle]) ??
                      "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div
                      title={project.risk_area || ""}
                      className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {project.risk_area || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div
                      title={project.current_mitigation_plan || ""}
                      className="max-w-36 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {project.current_mitigation_plan || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div
                      title={project.current_comments || ""}
                      className="max-w-36 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {project.current_comments || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {project.last_updated
                      ? new Date(project.last_updated).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {projectData && projectData.total_count > pagination.pageSize && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-gray-600">
              Showing{" "}
              <b>
                {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(
                  pagination.page * pagination.pageSize,
                  projectData.total_count,
                )}
              </b>{" "}
              of <b>{projectData.total_count}</b> projects
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                disabled={pagination.page <= 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                disabled={
                  pagination.page * pagination.pageSize >=
                  projectData.total_count
                }
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
