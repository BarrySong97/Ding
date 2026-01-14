import {
  IconFile,
  IconPhoto,
  IconLoader2,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconPlayerPause,
  IconRefresh
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatFileSize, cn } from '@/lib/utils'
import type { UploadTask, UploadStatus } from '@renderer/stores/upload-store'

interface UploadTaskItemProps {
  task: UploadTask
  onRemove?: (id: string) => void
  onRetry?: (id: string) => void
}

function StatusIcon({ status }: { status: UploadStatus }) {
  switch (status) {
    case 'pending':
      return <IconPlayerPause size={14} className="text-muted-foreground" />
    case 'compressing':
    case 'uploading':
      return <IconLoader2 size={14} className="animate-spin text-blue-500" />
    case 'completed':
      return <IconCheck size={14} className="text-green-500" />
    case 'error':
      return <IconAlertTriangle size={14} className="text-destructive" />
    case 'paused':
      return <IconPlayerPause size={14} className="text-amber-500" />
    default:
      return null
  }
}

function getStatusText(status: UploadStatus): string {
  switch (status) {
    case 'pending':
      return 'Waiting'
    case 'compressing':
      return 'Compressing...'
    case 'uploading':
      return 'Uploading...'
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Failed'
    case 'paused':
      return 'Paused'
    default:
      return ''
  }
}

export function UploadTaskItem({ task, onRemove, onRetry }: UploadTaskItemProps) {
  const isActive = task.status === 'compressing' || task.status === 'uploading'
  const showProgress = isActive && task.progress > 0

  return (
    <div className="flex items-start gap-3 p-3 border-b border-border last:border-b-0">
      {/* File icon */}
      <div className="mt-0.5 shrink-0">
        {task.isImage ? (
          <IconPhoto size={18} className="text-blue-500" />
        ) : (
          <IconFile size={18} className="text-muted-foreground" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.fileName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusIcon status={task.status} />
          <span
            className={cn(
              'text-xs',
              task.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {getStatusText(task.status)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(task.fileSize)}
            {task.compressionPreset && task.isImage && ` - ${task.compressionPreset}`}
          </span>
        </div>

        {/* Progress bar */}
        {showProgress && <Progress value={task.progress} className="mt-2 h-1" />}

        {/* Compression result */}
        {task.status === 'completed' && task.compressedSize && task.compressedSize < task.originalSize && (
          <p className="text-xs text-green-600 mt-1">
            {formatFileSize(task.compressedSize)} (
            {Math.round((1 - task.compressedSize / task.originalSize) * 100)}% smaller)
          </p>
        )}

        {/* Error message */}
        {task.status === 'error' && task.error && (
          <p className="text-xs text-destructive mt-1 truncate">{task.error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {task.status === 'error' && onRetry && (
          <Button variant="ghost" size="icon-sm" onClick={() => onRetry(task.id)}>
            <IconRefresh size={14} />
          </Button>
        )}
        {(task.status === 'pending' || task.status === 'error' || task.status === 'completed') &&
          onRemove && (
            <Button variant="ghost" size="icon-sm" onClick={() => onRemove(task.id)}>
              <IconX size={14} />
            </Button>
          )}
      </div>
    </div>
  )
}
