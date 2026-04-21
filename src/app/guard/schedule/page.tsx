import { getMyShiftsForMonth } from "@/app/actions/shifts";
import ScheduleClient from "./schedule-client";

export default async function SchedulePage() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const initialShifts = await getMyShiftsForMonth(year, month).catch(() => ({}));

  return (
    <ScheduleClient
      initialShifts={initialShifts}
      initialYear={year}
      initialMonth={month}
    />
  );
}
