import { getServerSession } from "@/lib/auth";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await getServerSession();
  const orgId = session?.orgId ?? "demo-org-id";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          カレンダー・配置管理
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          案件の配置状況を一覧で確認し、隊員を配置できます
        </p>
      </div>
      <CalendarView orgId={orgId} />
    </div>
  );
}
