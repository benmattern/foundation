import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "./layouts/DashboardLayout";

import DashboardPage from "./pages/DashboardPage";
import SourcesPage from "./pages/SourcesPage";
import ArticlesPage from "./pages/ArticlesPage";
import EntitiesPage from "./pages/EntitiesPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import IngestionQueuePage from "./pages/IngestionQueuePage";
import SourceDetailPage from "./pages/SourceDetailPage";
import TagsPage from "./pages/TagsPage";
import { WorkspaceGate } from "./components/WorkspaceGate";
import ProjectPage from "./pages/ProjectPage";

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceGate>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/sources/:id" element={<SourceDetailPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/ingestion" element={<IngestionQueuePage />} />
            <Route
              path="/rss"
              element={<Navigate to="/sources?view=collection" replace />}
            />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/entities" element={<EntitiesPage />} />
          </Route>
        </Routes>
      </WorkspaceGate>
    </BrowserRouter>
  );
}
