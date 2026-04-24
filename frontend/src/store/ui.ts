/**
 * Zustand store for application state management
 */

import { create } from "zustand";
import { HealthStatus } from "../types";

interface UIState {
  includeInternalProjects: boolean;
  setIncludeInternalProjects: (include: boolean) => void;

  searchTerm: string;
  setSearchTerm: (term: string) => void;

  selectedProjectCode: string | null;
  setSelectedProjectCode: (code: string | null) => void;

  showHealthModal: boolean;
  setShowHealthModal: (show: boolean) => void;

  selectedHealthStatus: HealthStatus | null;
  setSelectedHealthStatus: (status: HealthStatus | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  includeInternalProjects: false,
  setIncludeInternalProjects: (include) =>
    set({ includeInternalProjects: include }),

  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),

  selectedProjectCode: null,
  setSelectedProjectCode: (code) => set({ selectedProjectCode: code }),

  showHealthModal: false,
  setShowHealthModal: (show) => set({ showHealthModal: show }),

  selectedHealthStatus: null,
  setSelectedHealthStatus: (status) => set({ selectedHealthStatus: status }),
}));
