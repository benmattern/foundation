import { useEffect, useState } from "react";
import { getSources } from "../services/sourceService";
import type { Source } from "../types/source";

import { DashboardCards } from "../components/DashboardCards";

import { PageHeader } from "../components/PageHeader";

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
      <PageHeader
        title="Dashboard"
        description="Overview of your OSINT sources."
      />
      <DashboardCards sourceCount={sources.length} />
    </>
  );
}