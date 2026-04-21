import { getShiftsForMonth } from "@/app/actions/shifts";
import ShiftsView from "./shifts-view";

export default async function ShiftsPage() {
  const now = new Date();
  const dbGuards = await getShiftsForMonth(now.getFullYear(), now.getMonth() + 1).catch(() => []);
  return <ShiftsView dbGuards={dbGuards} />;
}
