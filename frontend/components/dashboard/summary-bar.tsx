import type { DashboardSummary } from '@/services/tracked-items-service'

interface SummaryBarProps {
  summary: DashboardSummary
}

interface StatCardProps {
  label: string
  value: number
  color: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500 font-medium">{label}</p>
    </div>
  )
}

export function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Tracked Items" value={summary.totalTracked} color="text-blue-600" />
      <StatCard label="Active Alerts" value={summary.activeAlerts} color="text-orange-500" />
      <StatCard label="Recent Drops" value={summary.recentDrops} color="text-green-600" />
    </div>
  )
}
