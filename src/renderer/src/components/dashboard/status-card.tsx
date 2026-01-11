import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  status?: {
    label: string
    active: boolean
  }
}

export function StatCard({ title, value, subtitle, icon, trend, status }: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {trend && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs',
            trend.positive ? 'text-green-500' : 'text-red-500'
          )}
        >
          <span>{trend.value}</span>
        </div>
      )}
      {subtitle && !trend && !status && (
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      )}
      {status && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              status.active ? 'bg-green-500' : 'bg-muted-foreground'
            )}
          />
          <span>{status.label}</span>
        </div>
      )}
    </div>
  )
}

// Keep the old component for backwards compatibility
interface StatusCardProps {
  value: string | number
  label: string
}

export function StatusCard({ value, label }: StatusCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
