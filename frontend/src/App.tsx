/**
 * Main App component with routing
 */

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import ProjectsListPage from "./pages/ProjectsListPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ChangeHistoryPage from "./pages/ChangeHistoryPage";
import HelpPage from "./pages/HelpPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route
          path="/projects/:projectId/change-history"
          element={<ChangeHistoryPage />}
        />
      </Route>
    </Routes>
  );
}
