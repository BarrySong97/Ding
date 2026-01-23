import { useCallback, useEffect, useState } from 'react'
import { IconChevronDown, IconChevronRight, IconFolder, IconLoader2 } from '@tabler/icons-react'
import { trpc, type TRPCProvider } from '@renderer/lib/trpc'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface TreeNode {
  id: string
  name: string
  path: string
  isLoaded: boolean
  isExpanded: boolean
  isLoading: boolean
  children: TreeNode[]
}

interface FolderPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: TRPCProvider
  bucket: string
  initialPrefix?: string
  onConfirm: (prefix: string) => void
}

function normalizePath(prefix?: string): string {
  if (!prefix) return ''
  return prefix.replace(/^\/+/, '').replace(/\/$/, '')
}

function formatPath(path: string): string {
  return path ? `/${path}` : '/ (root)'
}

function TreeNodeItem({
  node,
  level,
  onExpand,
  onSelect,
  selectedPath
}: {
  node: TreeNode
  level: number
  onExpand: (node: TreeNode) => void
  onSelect: (node: TreeNode) => void
  selectedPath: string
}) {
  const isSelected = selectedPath === node.path
  const hasChildren = node.children.length > 0 || !node.isLoaded

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted cursor-pointer',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/10"
            onClick={(event) => {
              event.stopPropagation()
              onExpand(node)
            }}
          >
            {node.isLoading ? (
              <IconLoader2 size={14} className="animate-spin text-muted-foreground" />
            ) : node.isExpanded ? (
              <IconChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <IconChevronRight size={14} className="text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <IconFolder size={16} className="text-amber-500" />
        <span className="ml-1 truncate">{node.name}</span>
      </div>
      {node.isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onExpand={onExpand}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderPickerDialog({
  open,
  onOpenChange,
  provider,
  bucket,
  initialPrefix,
  onConfirm
}: FolderPickerDialogProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [selectedPath, setSelectedPath] = useState('')
  const trpcUtils = trpc.useUtils()

  useEffect(() => {
    if (!open) return
    const normalized = normalizePath(initialPrefix)
    setSelectedPath(normalized)
    setTreeData([
      {
        id: 'root',
        name: 'Root',
        path: '',
        isLoaded: false,
        isExpanded: true,
        isLoading: false,
        children: []
      }
    ])
  }, [open, initialPrefix])

  useEffect(() => {
    if (!open) {
      setTreeData([])
      setSelectedPath('')
    }
  }, [open])

  const updateNodeInTree = useCallback(
    (nodes: TreeNode[], nodeId: string, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return updater(node)
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNodeInTree(node.children, nodeId, updater) }
        }
        return node
      })
    },
    []
  )

  const handleExpand = useCallback(
    async (node: TreeNode) => {
      if (node.isLoaded) {
        setTreeData((prev) =>
          updateNodeInTree(prev, node.id, (n) => ({
            ...n,
            isExpanded: !n.isExpanded
          }))
        )
        return
      }

      setTreeData((prev) =>
        updateNodeInTree(prev, node.id, (n) => ({
          ...n,
          isLoading: true
        }))
      )

      try {
        const result = await trpcUtils.provider.listObjects.fetch({
          provider,
          bucket,
          prefix: node.path ? `${node.path}/` : undefined,
          maxKeys: 1000
        })

        const folders = result.files
          .filter((file) => file.type === 'folder')
          .map((file) => ({
            id: `folder:${file.id}`,
            name: file.name,
            path: file.id.replace(/\/$/, ''),
            isLoaded: false,
            isExpanded: false,
            isLoading: false,
            children: []
          }))

        setTreeData((prev) =>
          updateNodeInTree(prev, node.id, (n) => ({
            ...n,
            isLoaded: true,
            isExpanded: true,
            isLoading: false,
            children: folders
          }))
        )
      } catch (error) {
        console.error('[FolderPicker] Failed to load folders:', error)
        setTreeData((prev) =>
          updateNodeInTree(prev, node.id, (n) => ({
            ...n,
            isLoading: false
          }))
        )
      }
    },
    [provider, bucket, trpcUtils, updateNodeInTree]
  )

  useEffect(() => {
    if (!open || treeData.length === 0) return
    const root = treeData[0]
    if (!root.isLoaded && !root.isLoading) {
      handleExpand(root)
    }
  }, [open, treeData, handleExpand])

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedPath(node.path)
  }, [])

  const handleConfirm = () => {
    const nextPrefix = selectedPath ? `${selectedPath}/` : ''
    onConfirm(nextPrefix)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select upload folder</DialogTitle>
          <DialogDescription>Choose a folder inside the selected bucket</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-64 rounded-md border">
            <div className="p-2">
              {treeData.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  level={0}
                  onExpand={handleExpand}
                  onSelect={handleSelect}
                  selectedPath={selectedPath}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Upload to: </span>
            <span className="font-medium">{formatPath(selectedPath)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Use this folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
