import { requireSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

type StatusLabel = "稼働中" | "人員不足" | "待機中" | "完了";

// ------------------------------------------------------------
// 当日サマリー取得
// ------------------------------------------------------------
async function getDashboardData(orgId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // 本日の案件（ACTIVE、今日が稼働期間内）
  const projects = await prisma.project.findMany({
    where: {
      orgId,
      status:    "ACTIVE",
      startDate: { lte: tomorrow },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    include: {
      site: { include: { client: { select: { name: true } } } },
      assignments: {
        where: {
          workDate: { gte: today, lt: tomorrow },
          status:   { not: "CANCELLED" },
        },
        include: {
          user:        { select: { id: true, name: true } },
          attendances: { select: { clockIn: true, clockOut: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // 月次売上見込（ACTIVE案件の当月配置数 × unitPrice）
  const monthAssignments = await prisma.assignment.findMany({
    where: {
      project: { orgId },
      workDate: { gte: monthStart, lt: nextMonthStart },
      status:   { not: "CANCELLED" },
    },
    select: { project: { select: { unitPrice: true } } },
  });
  const monthRevenue = monthAssignments.reduce(
    (sum, a) => sum + (a.project?.unitPrice ?? 0),
    0,
  );

  return { projects, monthRevenue };
}

// ------------------------------------------------------------
// ページ本体
// ------------------------------------------------------------
export default async function DashboardPage() {
  const session = await requireSession();
  const { projects, monthRevenue } = await getDashboardData(session.orgId);

  // サマリー集計
  const totalProjects = projects.length;
  const totalAssigned = projects.reduce((s, p) => s + p.assignments.length, 0);
  const totalClockedIn = projects.reduce(
    (s, p) => s + p.assignments.filter((a) => a.attendances[0]?.clockIn).length,
    0,
  );
  const totalRequired = projects.reduce((s, p) => s + p.requiredGuards, 0);
  const shortageCount = projects.filter((p) => p.assignments.length < p.requiredGuards).length;
  const shortageTotal = projects.reduce(
    (s, p) => s + Math.max(0, p.requiredGuards - p.assignments.length),
    0,
  );
  const pendingClockIn = totalAssigned - totalClockedIn;

  // アラート生成
  type Alert = { type: "warning" | "info" | "error"; message: string; time: string };
  const alerts: Alert[] = [];

  // 人員不足案件
  projects
    .filter((p) => p.assignments.length < p.requiredGuards)
    .forEach((p) => {
      alerts.push({
        type:    "error",
        message: `${p.name} - 隊員が${p.requiredGuards - p.assignments.length}名不足しています`,
        time:    "本日",
      });
    });

  // 上番遅延（案件開始時刻を過ぎても未打刻）
  const nowHM = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
  projects.forEach((p) => {
    if (p.startTime > nowHM) return; // まだ開始前
    p.assignments
      .filter((a) => !a.attendances[0]?.clockIn)
      .forEach((a) => {
        alerts.push({
          type:    "warning",
          message: `${a.user.name}さんの上番報告が遅れています（${p.name}）`,
          time:    p.startTime,
        });
      });
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-sm text-gray-500 mt-1">
          本日の稼働状況と直近のアラート
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="本日の案件数"
          value={String(totalProjects)}
          subtitle={`稼働スタッフ: ${totalAssigned}名`}
          color="blue"
        />
        <SummaryCard
          title="上番確認済み"
          value={`${totalClockedIn}/${totalAssigned}`}
          subtitle={pendingClockIn > 0 ? `未確認: ${pendingClockIn}名` : "全員確認済み"}
          color="green"
        />
        <SummaryCard
          title="人員不足案件"
          value={String(shortageCount)}
          subtitle={shortageCount > 0 ? `あと${shortageTotal}名必要` : `定員: ${totalRequired}名`}
          color={shortageCount > 0 ? "red" : "blue"}
        />
        <SummaryCard
          title="今月の売上見込"
          value={`¥${monthRevenue.toLocaleString("ja-JP")}`}
          subtitle={`${today.getMonth() + 1}月稼働ベース`}
          color="amber"
        />
      </div>

      {/* 本日の案件一覧 */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">本日の案件</h3>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            本日稼働中の案件はありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">案件名</th>
                  <th className="pb-3 font-medium">クライアント</th>
                  <th className="pb-3 font-medium">時間</th>
                  <th className="pb-3 font-medium">配置</th>
                  <th className="pb-3 font-medium">上番状況</th>
                  <th className="pb-3 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((p) => {
                  const assigned = p.assignments.length;
                  const clockedIn = p.assignments.filter((a) => a.attendances[0]?.clockIn).length;
                  const status: StatusLabel =
                    assigned < p.requiredGuards    ? "人員不足" :
                    clockedIn === 0                ? "待機中"   :
                    clockedIn < assigned           ? "稼働中"   :
                    "稼働中";
                  return (
                    <ProjectRow
                      key={p.id}
                      name={p.name}
                      client={p.site.client.name}
                      time={`${p.startTime}〜${p.endTime}`}
                      assigned={assigned}
                      required={p.requiredGuards}
                      clockedIn={clockedIn}
                      status={status}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 直近のアラート */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">アラート</h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            現在アラートはありません
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((a, i) => (
              <AlertItem key={i} type={a.type} message={a.message} time={a.time} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "green" | "red" | "amber";
}) {
  const colors = {
    blue:  "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red:   "bg-red-50 border-red-200 text-red-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const valueColors = {
    blue:  "text-blue-700",
    green: "text-green-700",
    red:   "text-red-700",
    amber: "text-amber-700",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColors[color]}`}>
        {value}
      </p>
      <p className="text-xs mt-2 opacity-70">{subtitle}</p>
    </div>
  );
}

function ProjectRow({
  name,
  client,
  time,
  assigned,
  required,
  clockedIn,
  status,
}: {
  name: string;
  client: string;
  time: string;
  assigned: number;
  required: number;
  clockedIn: number;
  status: StatusLabel;
}) {
  const isShortage = assigned < required;
  const statusColor = {
    稼働中:   "bg-green-100 text-green-800",
    人員不足: "bg-red-100 text-red-800",
    待機中:   "bg-gray-100 text-gray-800",
    完了:     "bg-blue-100 text-blue-800",
  }[status];

  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 font-medium text-gray-900">{name}</td>
      <td className="py-3 text-gray-600">{client}</td>
      <td className="py-3 text-gray-600">{time}</td>
      <td className="py-3">
        <span className={isShortage ? "text-red-600 font-medium" : "text-gray-900"}>
          {assigned}/{required}名
        </span>
      </td>
      <td className="py-3">
        <span className="text-gray-600">
          {clockedIn}/{assigned}名
        </span>
      </td>
      <td className="py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function AlertItem({
  type,
  message,
  time,
}: {
  type: "warning" | "info" | "error";
  message: string;
  time: string;
}) {
  const styles = {
    warning: "border-l-amber-500 bg-amber-50",
    info:    "border-l-blue-500 bg-blue-50",
    error:   "border-l-red-500 bg-red-50",
  };

  return (
    <div className={`border-l-4 rounded-r-lg px-4 py-3 ${styles[type]}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-800">{message}</p>
        <span className="text-xs text-gray-500 shrink-0 ml-4">{time}</span>
      </div>
    </div>
  );
}
