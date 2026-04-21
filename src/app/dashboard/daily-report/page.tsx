import { getActiveGuards } from "@/app/actions/guards";
import DailyReportView from "./daily-report-view";

export default async function DailyReportPage() {
  const dbGuards = await getActiveGuards().catch(() => []);
  return <DailyReportView dbGuards={dbGuards} />;
}
