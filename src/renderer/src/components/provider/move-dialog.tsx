import { useState, useEffect, useCallback } from 'react'
import {
  IconFolderSymlink,
  IconLoader2,
  IconFolder,
  IconChevronRight,
  IconChevronDown,
  IconBucket
} from '@tabler/icons-react'
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
import type { FileItem } from '@/lib/types'

interface TreeNode {
  id: string
  name: string
  type: 'bucket' | 'folder'
  path: string
  bucket: string
  isLoaded: boolean
  isExpanded: boolean
  isLoading: boolean
  children: TreeNode[]
}

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: TRPCProvider
  bucket: string
  file: FileItem | null
  currentPrefix?: string
  onSuccess?: () => void
}

function TreeNodeItem({
  node,
  level,
  onExpand,
  onSelect,
  selectedNode
}: {
  node: TreeNode
  level: number
  onExpand: (node: TreeNode) => void
  onSelect: (node: TreeNode) => void
  selectedNode: TreeNode | null
}) {
  const isSelected = selectedNode?.id === node.id
  const hasChildren = node.type === 'bucket' || node.children.length > 0 || !node.isLoaded

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
            onClick={(e) => {
              e.stopPropagation()
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
        {node.type === 'bucket' ? (
          <IconBucket size={16} className="text-blue-500" />
        ) : (
          <IconFolder size={16} className="text-amber-500" />
        )}
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
              selectedNode={selectedNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MoveDialog({
  open,
  onOpenChange,
  provider,
  bucket,
  file,
  onSuccess
}: MoveDialogProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const moveObjectMutation = trpc.provider.moveObject.useMutation()
  const trpcUtils = trpc.useUtils()

  // Fetch buckets on dialog open
  const { data: buckets, isLoading: isBucketsLoading } = trpc.provider.listBuckets.useQuery(
    { provider },
    { enabled: open }
  )

  // Initialize tree with buckets
  useEffect(() => {
    if (buckets && open) {
      setTreeData(
        buckets.map((b) => ({
          id: `bucket:${b.name}`,
          name: b.name,
          type: 'bucket' as const,
          path: '',
          bucket: b.name,
          isLoaded: false,
          isExpanded: false,
          isLoading: false,
          children: []
        }))
      )
      setSelectedNode(null)
      setError(null)
    }
  }, [buckets, open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTreeData([])
      setSelectedNode(null)
      setError(null)
    }
  }, [open])

  const updateNodeInTree = useCallback(
    (
      nodes: TreeNode[],
      nodeId: string,
      updater: (node: TreeNode) => TreeNode
    ): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return updater(node)
        }
        if (node.children.length > 0) {
          return {
            ...node,
            children: updateNodeInTree(node.children, nodeId, updater)
          }
        }
        return node
      })
    },
    []
  )

  const handleExpand = useCallback(
    async (node: TreeNode) => {
      // If already loaded, just toggle expand
      if (node.isLoaded) {
        setTreeData((prev) =>
          updateNodeInTree(prev, node.id, (n) => ({
            ...n,
            isExpanded: !n.isExpanded
          }))
        )
        return
      }

      // Set loading state
      setTreeData((prev) =>
        updateNodeInTree(prev, node.id, (n) => ({
          ...n,
          isLoading: true
        }))
      )

      try {
        // Fetch folders from the bucket/path
        const result = await trpcUtils.provider.listObjects.fetch({
          provider,
          bucket: node.bucket,
          prefix: node.path ? `${node.path}/` : undefined,
          maxKeys: 1000
        })

        const folders = result.files
          .filter((f) => f.type === 'folder')
          .map((f) => ({
            id: `folder:${node.bucket}:${f.id}`,
            name: f.name,
            type: 'folder' as const,
            path: f.id.replace(/\/$/, ''),
            bucket: node.bucket,
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
      } catch (err) {
        console.error('Failed to load folders:', err)
        setTreeData((prev) =>
          updateNodeInTree(prev, node.id, (n) => ({
            ...n,
            isLoading: false
          }))
        )
      }
    },
    [provider, trpcUtils, updateNodeInTree]
  )

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node)
    setError(null)
  }, [])

  const handleMove = async () => {
    if (!file || !selectedNode) return

    // Determine destination bucket and prefix
    const destBucket = selectedNode.bucket
    const destPrefix = selectedNode.type === 'bucket' ? '' : selectedNode.path + '/'

    // Don't allow moving to the same location
    const currentFolder = file.id.substring(0, file.id.lastIndexOf('/') + 1)
    if (destBucket === bucket && destPrefix === currentFolder) {
      setError('File is already in this location')
      return
    }

    setError(null)

    try {
      // If moving to a different bucket, we need to handle cross-bucket move
      // For now, only support same-bucket moves
      if (destBucket !== bucket) {
        setError('Cross-bucket moves are not supported yet')
        return
      }

      const result = await moveObjectMutation.mutateAsync({
        provider,
        bucket,
        sourceKey: file.id,
        destinationPrefix: destPrefix
      })

      if (result.success) {
        onSuccess?.()
        handleClose()
      } else {
        setError(result.error || 'Failed to move')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move')
    }
  }

  const handleClose = () => {
    if (!moveObjectMutation.isPending) {
      onOpenChange(false)
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move {file.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          <DialogDescription>
            Select a destination for <span className="font-medium">{file.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tree view */}
          <ScrollArea className="h-72 rounded-md border">
            <div className="p-2">
              {isBucketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : treeData.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No buckets available
                </div>
              ) : (
                treeData.map((node) => (
                  <TreeNodeItem
                    key={node.id}
                    node={node}
                    level={0}
                    onExpand={handleExpand}
                    onSelect={handleSelect}
                    selectedNode={selectedNode}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Selected destination */}
          {selectedNode && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Move to: </span>
              <span className="font-medium">
                {selectedNode.type === 'bucket'
                  ? `${selectedNode.name} (root)`
                  : `${selectedNode.bucket}/${selectedNode.path}`}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={moveObjectMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={moveObjectMutation.isPending || !selectedNode}
          >
            {moveObjectMutation.isPending ? (
              <>
                <IconLoader2 size={16} className="mr-2 animate-spin" />
                Moving...
              </>
            ) : (
              <>
                <IconFolderSymlink size={16} className="mr-2" />
                Move
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
