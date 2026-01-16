import { format } from 'date-fns'
import { IconFolder, IconDotsVertical, IconDownload, IconCopy, IconCheck } from '@tabler/icons-react'
import type { FileItem } from '@/lib/types'
import { formatFileSize } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface FileGridProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onCopyUrl?: (file: FileItem) => Promise<string>
  onRename?: (file: FileItem) => void
  onMove?: (file: FileItem) => void
}

interface FileGridItemProps {
  file: FileItem
  onFileClick: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onCopyUrl?: (file: FileItem) => Promise<string>
  onRename?: (file: FileItem) => void
  onMove?: (file: FileItem) => void
}

function FileGridItem({
  file,
  onFileClick,
  onDownload,
  onCopyUrl,
  onRename,
  onMove
}: FileGridItemProps) {
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCopyUrl) {
      const url = await onCopyUrl(file)
      if (url) {
        await copyToClipboard(url)
      }
    }
  }

  return (
    <div className="group relative flex flex-col items-center rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
      {/* File Icon */}
      <button
        onClick={() => onFileClick(file)}
        className="flex w-full flex-col items-center gap-2 text-center"
      >
        <div className="flex size-16 items-center justify-center">
          {getFileIcon(file, 'large')}
        </div>
        <span className="line-clamp-2 w-full text-sm font-medium">{file.name}</span>
      </button>

      {/* File Info */}
      <div className="mt-2 flex flex-col items-center gap-1 text-xs text-muted-foreground">
        {file.type === 'file' && <span>{formatFileSize(file.size || 0)}</span>}
        <span>{format(file.modified, 'MMM d, yyyy')}</span>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {file.type === 'file' && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onDownload?.(file)
              }}
            >
              <IconDownload size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <IconCheck size={16} className="text-green-500" />
              ) : (
                <IconCopy size={16} />
              )}
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onRename?.(file)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove?.(file)}>Move to...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function FileGrid({
  files,
  onFileClick,
  onDownload,
  onCopyUrl,
  onRename,
  onMove
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconFolder size={48} className="mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {files.map((file) => (
        <FileGridItem
          key={file.id}
          file={file}
          onFileClick={onFileClick}
          onDownload={onDownload}
          onCopyUrl={onCopyUrl}
          onRename={onRename}
          onMove={onMove}
        />
      ))}
    </div>
  )
}
