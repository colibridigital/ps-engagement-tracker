/**
 * Health Status Badge component
 */

import React from "react";
import { HealthStatus } from "../types";
import { Circle } from "lucide-react";

interface HealthBadgeProps {
  status: HealthStatus | undefined;
  size?: "sm" | "md" | "lg";
}

export default function HealthBadge({ status, size = "md" }: HealthBadgeProps) {
  if (!status) {
    return <span className="text-gray-400">No Status</span>;
  }

  const colors = {
    [HealthStatus.RED]: "bg-red-100 text-red-800",
    [HealthStatus.AMBER]: "bg-amber-100 text-amber-800",
    [HealthStatus.GREEN]: "bg-green-100 text-green-800",
    [HealthStatus.COMPLETED]: "bg-blue-100 text-blue-800",
  };

  const dotColors = {
    [HealthStatus.RED]: "text-health-red",
    [HealthStatus.AMBER]: "text-health-amber",
    [HealthStatus.GREEN]: "text-health-green",
    [HealthStatus.COMPLETED]: "text-blue-500",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-semibold ${colors[status]} ${sizes[size]}`}
    >
      <Circle className={`w-2 h-2 mr-1 fill-current ${dotColors[status]}`} />
      {status.toUpperCase()}
    </div>
  );
}
