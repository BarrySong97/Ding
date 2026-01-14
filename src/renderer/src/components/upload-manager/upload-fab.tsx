import { useMemo } from 'react'
import { IconCloudUpload, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUploadStore } from '@renderer/stores/upload-store'
import { cn } from '@/lib/utils'

export function UploadFAB() {
  const tasks = useUploadStore((state) => state.tasks)
  const setDrawerOpen = useUploadStore((state) => state.setDrawerOpen)

  const { activeCount, hasActiveTasks, totalCount } = useMemo(() => {
    const active = tasks.filter((t) =>
      ['compressing', 'uploading', 'pending'].includes(t.status)
    ).length
    return {
      activeCount: active,
      hasActiveTasks: active > 0,
      totalCount: tasks.length
    }
  }, [tasks])

  // Don't show FAB if there are no tasks
  if (totalCount === 0) {
    return null
  }

  return (
    <Button
      onClick={() => setDrawerOpen(true)}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
        'hover:scale-105 transition-transform',
        hasActiveTasks && 'animate-pulse'
      )}
      size="icon"
    >
      {hasActiveTasks ? (
        <IconLoader2 size={20} className="animate-spin" />
      ) : (
        <IconCloudUpload size={20} />
      )}
      {activeCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs"
        >
          {activeCount}
        </Badge>
      )}
    </Button>
  )
}
