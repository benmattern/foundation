import { useEffect, useState } from "react";
import { getSources } from "../services/sourceService";
import type { Source } from "../types/source";

import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardCards } from "../components/DashboardCards";

export default function DashboardPage() {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await getSources();
        setSources(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <>
      <DashboardHeader />
      <DashboardCards sourceCount={sources.length} />
    </>
  );
}