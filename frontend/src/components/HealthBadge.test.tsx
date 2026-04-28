import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HealthBadge from "./HealthBadge";
import { HealthStatus } from "../types";

describe("HealthBadge", () => {
  it('should render "No Status" when status is undefined', () => {
    render(<HealthBadge status={undefined} />);
    expect(screen.getByText("No Status")).toBeInTheDocument();
  });

  it("should render correctly for GREEN status", () => {
    render(<HealthBadge status={HealthStatus.GREEN} />);
    expect(screen.getByText("GREEN")).toBeInTheDocument();
    expect(screen.getByText("GREEN").parentElement).toHaveClass(
      "bg-green-100 text-green-800",
    );
  });

  it("should render correctly for AMBER status", () => {
    render(<HealthBadge status={HealthStatus.AMBER} />);
    expect(screen.getByText("AMBER")).toBeInTheDocument();
    expect(screen.getByText("AMBER").parentElement).toHaveClass(
      "bg-amber-100 text-amber-800",
    );
  });

  it("should render correctly for RED status", () => {
    render(<HealthBadge status={HealthStatus.RED} />);
    expect(screen.getByText("RED")).toBeInTheDocument();
    expect(screen.getByText("RED").parentElement).toHaveClass(
      "bg-red-100 text-red-800",
    );
  });

  it("should render correctly for COMPLETED status", () => {
    render(<HealthBadge status={HealthStatus.COMPLETED} />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("COMPLETED").parentElement).toHaveClass(
      "bg-blue-100 text-blue-800",
    );
  });
});
