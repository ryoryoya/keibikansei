export default function DashboardPage() {
  // TODO: サーバーコンポーネントでデータ取得
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
          value="8"
          subtitle="稼働スタッフ: 23名"
          color="blue"
        />
        <SummaryCard
          title="上番確認済み"
          value="19/23"
          subtitle="未確認: 4名"
          color="green"
        />
        <SummaryCard
          title="人員不足案件"
          value="2"
          subtitle="あと3名必要"
          color="red"
        />
        <SummaryCard
          title="今月の売上見込"
          value="¥4,280,000"
          subtitle="前月比 +12%"
          color="amber"
        />
      </div>

      {/* 本日の案件一覧 */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">本日の案件</h3>
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
              <ProjectRow
                name="[A現場] 施設警備 常駐"
                client="SBビルマネジメント"
                time="08:00〜17:00"
                assigned={3}
                required={3}
                clockedIn={3}
                status="稼働中"
              />
              <ProjectRow
                name="[B現場] 交通誘導 日勤"
                client="東京建設"
                time="08:00〜17:00"
                assigned={4}
                required={5}
                clockedIn={4}
                status="人員不足"
              />
              <ProjectRow
                name="[C現場] イベント警備 夜勤"
                client="SBビルマネジメント"
                time="18:00〜06:00"
                assigned={4}
                required={4}
                clockedIn={0}
                status="待機中"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* 直近のアラート */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">アラート</h3>
        <div className="space-y-3">
          <AlertItem
            type="warning"
            message="田中 一郎さんの上番報告が遅れています（08:15 現在未報告）"
            time="08:15"
          />
          <AlertItem
            type="info"
            message="高橋 二郎さんがシフト変更を申請しました（5/10 → 勤務NG）"
            time="07:30"
          />
          <AlertItem
            type="error"
            message="[B現場] 交通誘導 日勤 - 隊員が1名不足しています"
            time="前日"
          />
        </div>
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
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red: "bg-red-50 border-red-200 text-red-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const valueColors = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
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
  status: string;
}) {
  const isShortage = assigned < required;
  const statusColor = {
    稼働中: "bg-green-100 text-green-800",
    人員不足: "bg-red-100 text-red-800",
    待機中: "bg-gray-100 text-gray-800",
    完了: "bg-blue-100 text-blue-800",
  }[status] ?? "bg-gray-100 text-gray-800";

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
    info: "border-l-blue-500 bg-blue-50",
    error: "border-l-red-500 bg-red-50",
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
