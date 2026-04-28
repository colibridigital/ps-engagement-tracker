/**
 * RagTrend component to visualize the last 3 RAG statuses.
 */

import React from "react";
import { ArrowRight } from "lucide-react";
import { HealthStatus, RagTrendItem } from "../types";

interface RagTrendProps {
  trend: RagTrendItem[] | undefined;
  count?: number;
}

const RagDot: React.FC<{ item: RagTrendItem }> = ({ item }) => {
  const dotColors: Record<HealthStatus, string> = {
    [HealthStatus.RED]: "bg-health-red",
    [HealthStatus.AMBER]: "bg-health-amber",
    [HealthStatus.GREEN]: "bg-health-green",
    [HealthStatus.COMPLETED]: "bg-blue-500",
  };

  return (
    <div
      className={`w-4 h-4 rounded-full ${dotColors[item.value]}`}
      title={`${
        item.value.charAt(0).toUpperCase() + item.value.slice(1)
      } on ${new Date(item.updatedAt).toLocaleString()}`}
    />
  );
};

export default function RagTrend({ trend, count = 3 }: RagTrendProps) {
  if (!trend || trend.length === 0) {
    return (
      <div className="flex items-center h-full">
        <span className="text-xs text-gray-400 italic">No trend data</span>
      </div>
    );
  }

  // Show the last `count` items in order: oldest -> newest
  const displayTrend = trend.slice(-count);

  return (
    <div className="flex items-center space-x-2">
      {displayTrend.map((item, index) => (
        <React.Fragment key={index}>
          <RagDot item={item} />
          {index < displayTrend.length - 1 && (
            <ArrowRight
              className="w-4 h-4 text-gray-300"
              data-testid="trend-arrow"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
