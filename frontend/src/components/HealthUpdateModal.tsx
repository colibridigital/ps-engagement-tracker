/**
 * Health Update Modal component
 */

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { HealthStatus, ProjectListItem } from "../types";
import apiClient from "../api/client";

interface HealthUpdateModalProps {
  project: ProjectListItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HealthUpdateModal({
  project,
  isOpen,
  onClose,
  onSuccess,
}: HealthUpdateModalProps) {
  const [status, setStatus] = useState<HealthStatus | "">(
    project.current_health_status || "",
  );
  const [riskArea, setRiskArea] = useState(project.risk_area || "");
  const [mitigationPlan, setMitigationPlan] = useState(
    project.current_mitigation_plan || "",
  );
  const [comments, setComments] = useState(project.current_comments || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus(project.current_health_status || "");
      setRiskArea(project.risk_area || "");
      setMitigationPlan(project.current_mitigation_plan || "");
      setComments(project.current_comments || "");
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);

    try {
      await apiClient.createStatusUpdate(
        project.project_id,
        "system", // This should be replaced with the actual logged-in user
        status as HealthStatus,
        riskArea || undefined,
        mitigationPlan || undefined,
        comments || undefined,
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to update project status. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{project.project_name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Status *
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: HealthStatus.GREEN, // Use enum value
                  label: "Green",
                  selectedStyle: "bg-green-600 text-white",
                  unselectedStyle:
                    "bg-gray-200 text-gray-800 hover:bg-gray-300",
                },
                {
                  value: HealthStatus.AMBER, // Use enum value
                  label: "Amber",
                  selectedStyle: "bg-amber-500 text-white",
                  unselectedStyle:
                    "bg-gray-200 text-gray-800 hover:bg-gray-300",
                },
                {
                  value: HealthStatus.RED, // Use enum value
                  label: "Red",
                  selectedStyle: "bg-red-600 text-white",
                  unselectedStyle:
                    "bg-gray-200 text-gray-800 hover:bg-gray-300",
                },
                {
                  value: HealthStatus.COMPLETED, // Use enum value
                  label: "Completed",
                  selectedStyle: "bg-blue-600 text-white",
                  unselectedStyle:
                    "bg-gray-200 text-gray-800 hover:bg-gray-300",
                },
              ].map(({ value, label, selectedStyle, unselectedStyle }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value as HealthStatus)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${status === value ? selectedStyle : unselectedStyle}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Area
            </label>
            <input
              type="text"
              value={riskArea}
              onChange={(e) => setRiskArea(e.target.value)}
              placeholder="e.g., Resource constraints, Technical blockers"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mitigation Plan
            </label>
            <textarea
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder="Describe the mitigation plan..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments / Notes
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Additional comments..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? "Saving..." : "Save Update"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
