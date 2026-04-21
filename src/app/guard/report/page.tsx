import { getActiveGuards } from "@/app/actions/guards";
import { DEMO_GUARDS_FOR_REPORT } from "@/app/dashboard/daily-report/daily-report-types";
import ReportClient from "./report-client";

export default async function ReportPage() {
  const dbGuards = await getActiveGuards().catch(() => []);
  const guards = dbGuards.length > 0 ? dbGuards : DEMO_GUARDS_FOR_REPORT;
  return <ReportClient guards={guards} />;
}
