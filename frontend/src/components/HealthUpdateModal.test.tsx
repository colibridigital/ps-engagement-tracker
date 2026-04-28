import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import HealthUpdateModal from "./HealthUpdateModal";
import {
  HealthStatus,
  ProjectListItem,
  RiskArea,
  DeliveryCycle,
} from "../types";
import apiClient from "../api/client"; // Import the actual apiClient to mock it

// Mock apiClient
vi.mock("../api/client", () => ({
  default: { createStatusUpdate: vi.fn(() => Promise.resolve({})) },
}));

const mockProject: ProjectListItem = {
  project_id: 1,
  project_code: "P001",
  project_name: "Test Project",
  client_name: "Test Client",
};

describe("HealthUpdateModal", () => {
  it("should not render when isOpen is false", () => {
    const { container } = render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={false}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("should render with project name when isOpen is true", () => {
    render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={true}
        onClose={handleClose}
        onSuccess={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("should show an error if Risk Area is missing for Amber Health Status", async () => {
    const user = userEvent.setup();
    render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select Amber status
    // There are two "Amber" buttons, one for Health Status and one for RAG by Revenue.
    // We need to be specific. The first one is for Health Status.
    const healthStatusAmberButton = screen.getAllByRole("button", {
      name: "Amber",
    })[0];
    await user.click(healthStatusAmberButton);

    // Click save
    await user.click(screen.getByRole("button", { name: "Save Update" }));

    // Check for error message
    expect(
      screen.getByText(
        "A Risk Area must be selected when the status is Amber or Red.",
      ),
    ).toBeInTheDocument();
  });

  it("should show an error if Mitigation Plan is missing when Risk Area is selected for Amber Health Status", async () => {
    const user = userEvent.setup();
    render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select Amber Health Status
    await user.click(screen.getAllByRole("button", { name: "Amber" })[0]);

    // Select a Risk Area
    const riskAreaSelect = screen.getByLabelText(/Risk Area/);
    await user.selectOptions(riskAreaSelect, RiskArea.TECHNICAL_SOLUTION);
    expect(riskAreaSelect).toHaveValue(RiskArea.TECHNICAL_SOLUTION);

    // Click save
    await user.click(screen.getByRole("button", { name: "Save Update" }));

    // Check for error message
    expect(
      screen.getByText(
        "Mitigation Plan is required and cannot be empty when the status is Amber or Red.",
      ),
    ).toBeInTheDocument();
  });

  it("should successfully submit when all mandatory fields are filled for Amber Health Status", async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    render(
      <HealthUpdateModal
        project={mockProject}
        isOpen={true}
        onClose={() => {}}
        onSuccess={handleSuccess}
      />,
    );

    // Select Amber Health Status
    await user.click(screen.getAllByRole("button", { name: "Amber" })[0]);

    // Select a Risk Area
    const riskAreaSelect = screen.getByLabelText(/Risk Area/);
    await user.selectOptions(riskAreaSelect, RiskArea.TECHNICAL_SOLUTION);

    // Fill Mitigation Plan
    const mitigationPlanTextarea = screen.getByLabelText(/Mitigation Plan/);
    await user.type(mitigationPlanTextarea, "Test mitigation plan");

    // Click save
    await user.click(screen.getByRole("button", { name: "Save Update" }));

    // Expect no error message and onSuccess to be called
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(apiClient.createStatusUpdate).toHaveBeenCalledTimes(1);
    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });

  it("should initialize Health Status and RAG by Revenue to Green if not provided", () => {
    render(
      <HealthUpdateModal
        project={{
          ...mockProject,
          current_health_status: undefined,
          rag_by_revenue: undefined,
        }}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Health Status should be Green
    expect(screen.getAllByRole("button", { name: "Green" })[0]).toHaveClass(
      "bg-green-600",
    );
    // RAG by Revenue should be Green
    expect(screen.getAllByRole("button", { name: "Green" })[1]).toHaveClass(
      "bg-green-600",
    );
  });

  it("should initialize Delivery Cycle and Risk Area from project props", () => {
    const projectWithDefaults: ProjectListItem = {
      ...mockProject,
      delivery_cycle: DeliveryCycle.EXECUTION,
      risk_area: RiskArea.PROJECT_DELIVERY,
    };
    render(
      <HealthUpdateModal
        project={projectWithDefaults}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    const deliveryCycleSelect = screen.getByLabelText(/Delivery Cycle/);
    expect(deliveryCycleSelect).toHaveValue(DeliveryCycle.EXECUTION);

    const riskAreaSelect = screen.getByLabelText(/Risk Area/);
    expect(riskAreaSelect).toHaveValue(RiskArea.PROJECT_DELIVERY);
  });
});
