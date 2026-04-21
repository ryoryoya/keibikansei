import { getMyTodayAssignment } from "@/app/actions/attendance";
import { getServerSession } from "@/lib/auth";
import ClockClient from "./clock-client";

export default async function ClockPage() {
  const [assignment, session] = await Promise.all([
    getMyTodayAssignment().catch(() => null),
    getServerSession(),
  ]);

  return (
    <ClockClient
      assignment={assignment}
      userId={session?.userId ?? ""}
    />
  );
}
