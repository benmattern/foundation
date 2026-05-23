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
import SourceDetailPage from "./pages/SourceDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/sources/:id" element={<SourceDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/entities" element={<EntitiesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
