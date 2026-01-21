import { IconCloud, IconFolder, IconWorld } from '@tabler/icons-react'
import { StatCard } from './status-card'

interface StatsGridProps {
  providersCount?: number
  bucketsCount?: number
  regionsCount?: number
}

export function StatsGrid({ providersCount = 0, bucketsCount = 0, regionsCount = 0 }: StatsGridProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Providers"
        value={String(providersCount)}
        icon={<IconCloud size={20} />}
      />
      <StatCard
        title="Buckets"
        value={String(bucketsCount)}
        icon={<IconFolder size={20} />}
      />
      <StatCard
        title="Regions"
        value={String(regionsCount)}
        icon={<IconWorld size={20} />}
      />
    </div>
  )
}
