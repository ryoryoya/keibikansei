import { getDailyViewData } from "@/app/actions/attendance";
import DailyView from "./daily-view";

export default async function DailyPage() {
  const dbProjects = await getDailyViewData().catch(() => []);
  return <DailyView dbProjects={dbProjects} />;
}
