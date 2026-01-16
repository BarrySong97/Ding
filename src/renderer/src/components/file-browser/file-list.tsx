import { format } from 'date-fns'
import { IconDotsVertical, IconFolder, IconTrash, IconDownload, IconCopy, IconCheck } from '@tabler/icons-react'
import type { FileItem } from '@/lib/types'
import { formatFileSize } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface FileListProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onFileDoubleClick?: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  onCopyUrl?: (file: FileItem) => Promise<string>
  onRename?: (file: FileItem) => void
  onMove?: (file: FileItem) => void
  // Selection props
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  // Drag and drop props
  draggable?: boolean
  onDragStart?: (file: FileItem) => void
  onDrop?: (targetFolder: FileItem, sourceIds: string[]) => void
}

interface FileListRowProps {
  file: FileItem
  isSelected: boolean
  selectable: boolean
  draggable: boolean
  onRowClick: (file: FileItem, e: React.MouseEvent) => void
  onSelectFile: (file: FileItem, checked: boolean) => void
  onDownload?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  onCopyUrl?: (file: FileItem) => Promise<string>
  onRename?: (file: FileItem) => void
  onMove?: (file: FileItem) => void
  onDragStart: (e: React.DragEvent, file: FileItem) => void
  onDragOver: (e: React.DragEvent, file: FileItem) => void
  onDropOnFolder: (e: React.DragEvent, folder: FileItem) => void
}

function FileListRow({
  file,
  isSelected,
  selectable,
  draggable,
  onRowClick,
  onSelectFile,
  onDownload,
  onDelete,
  onCopyUrl,
  onRename,
  onMove,
  onDragStart,
  onDragOver,
  onDropOnFolder
}: FileListRowProps) {
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
    <TableRow
      data-state={isSelected && 'selected'}
      className="group cursor-pointer"
      onClick={(e) => onRowClick(file, e)}
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, file)}
      onDragOver={(e) => onDragOver(e, file)}
      onDrop={(e) => onDropOnFolder(e, file)}
    >
      {selectable && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectFile(file, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-3">
          {getFileIcon(file, 'small')}
          <span className="font-medium">{file.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {file.type === 'folder' ? '-' : formatFileSize(file.size || 0)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(file.modified, 'yyyy-MM-dd HH:mm')}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(file)
            }}
          >
            <IconTrash size={16} />
          </Button>
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
      </TableCell>
    </TableRow>
  )
}

export function FileList({
  files,
  onFileClick,
  onDownload,
  onDelete,
  onCopyUrl,
  onRename,
  onMove,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  draggable = false,
  onDragStart,
  onDrop
}: FileListProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(new Set(files.map((f) => f.id)))
    } else {
      onSelectionChange?.(new Set())
    }
  }

  const handleSelectFile = (file: FileItem, checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(file.id)
    } else {
      newSelection.delete(file.id)
    }
    onSelectionChange?.(newSelection)
  }

  const handleRowClick = (file: FileItem, e: React.MouseEvent) => {
    if (selectable && (e.ctrlKey || e.metaKey)) {
      // Toggle selection with Ctrl/Cmd click
      handleSelectFile(file, !selectedIds.has(file.id))
    } else {
      onFileClick(file)
    }
  }

  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    if (!draggable) return

    // If the dragged file is selected, drag all selected files
    const dragIds = selectedIds.has(file.id) ? Array.from(selectedIds) : [file.id]

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'file-move', ids: dragIds })
    )
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(file)
  }

  const handleDragOver = (e: React.DragEvent, file: FileItem) => {
    if (!draggable || file.type !== 'folder') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnFolder = (e: React.DragEvent, folder: FileItem) => {
    if (!draggable || folder.type !== 'folder') return
    e.preventDefault()

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'file-move' && data.ids) {
        // Don't allow dropping a folder into itself
        if (data.ids.includes(folder.id)) return
        onDrop?.(folder, data.ids)
      }
    } catch {
      // Invalid data
    }
  }

  const allSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id))

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconFolder size={48} className="mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              NAME
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SIZE
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LAST MODIFIED
            </TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <FileListRow
              key={file.id}
              file={file}
              isSelected={selectedIds.has(file.id)}
              selectable={selectable}
              draggable={draggable}
              onRowClick={handleRowClick}
              onSelectFile={handleSelectFile}
              onDownload={onDownload}
              onDelete={onDelete}
              onCopyUrl={onCopyUrl}
              onRename={onRename}
              onMove={onMove}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDropOnFolder={handleDropOnFolder}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
