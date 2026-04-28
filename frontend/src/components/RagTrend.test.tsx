import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RagTrend from "./RagTrend";
import { HealthStatus, RagTrendItem } from "../types";

describe("RagTrend", () => {
  it('should render "No trend data" when trend is undefined', () => {
    render(<RagTrend trend={undefined} />);
    expect(screen.getByText("No trend data")).toBeInTheDocument();
  });

  it("should render 'No trend data' when trend is an empty array", () => {
    render(<RagTrend trend={[]} />);
    expect(screen.getByText("No trend data")).toBeInTheDocument();
  });

  it("should render the correct number of dots and arrows", () => {
    const trend: RagTrendItem[] = [
      { value: HealthStatus.GREEN, updatedAt: new Date().toISOString() },
      { value: HealthStatus.AMBER, updatedAt: new Date().toISOString() },
      { value: HealthStatus.RED, updatedAt: new Date().toISOString() },
    ];
    render(<RagTrend trend={trend} />);

    // 3 dots, 2 arrows
    const dots = screen.getAllByTitle(/on/);
    expect(dots).toHaveLength(3);
    expect(screen.getAllByTestId("trend-arrow")).toHaveLength(2);
  });

  it("should slice the trend data to the specified count", () => {
    const trend: RagTrendItem[] = [
      { value: HealthStatus.GREEN, updatedAt: "2023-01-01T10:00:00Z" },
      { value: HealthStatus.AMBER, updatedAt: "2023-01-02T10:00:00Z" },
      { value: HealthStatus.RED, updatedAt: "2023-01-03T10:00:00Z" },
    ];
    render(<RagTrend trend={trend} count={2} />);

    const dots = screen.getAllByTitle(/on/);
    expect(dots).toHaveLength(2);

    // Check that the last two items are rendered
    expect(dots[0]).toHaveAttribute("title", expect.stringContaining("Amber"));
    expect(dots[1]).toHaveAttribute("title", expect.stringContaining("Red"));
  });
});
