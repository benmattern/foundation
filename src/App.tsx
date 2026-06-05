import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { DashboardLayout } from "./layouts/DashboardLayout";

import DashboardPage from "./pages/DashboardPage";
import SourcesPage from "./pages/SourcesPage";
import ArticlesPage from "./pages/ArticlesPage";
import EntitiesPage from "./pages/EntitiesPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import SourceDetailPage from "./pages/SourceDetailPage";
import TagsPage from "./pages/TagsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/sources/:id" element={<SourceDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/entities" element={<EntitiesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
