import { useState } from 'react'
import { IconTrash, IconLoader2, IconAlertTriangle } from '@tabler/icons-react'
import { trpc, type TRPCProvider } from '@renderer/lib/trpc'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'

interface DeleteBucketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: TRPCProvider
  bucketName: string | null
  onSuccess?: () => void
}

export function DeleteBucketDialog({
  open,
  onOpenChange,
  provider,
  bucketName,
  onSuccess
}: DeleteBucketDialogProps) {
  const [error, setError] = useState<string | null>(null)

  const deleteBucketMutation = trpc.provider.deleteBucket.useMutation()

  const handleDelete = async () => {
    if (!bucketName) return

    setError(null)

    try {
      const result = await deleteBucketMutation.mutateAsync({
        provider,
        bucketName
      })

      if (result.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.error || 'Failed to delete bucket')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bucket')
    }
  }

  const handleClose = () => {
    if (!deleteBucketMutation.isPending) {
      setError(null)
      onOpenChange(false)
    }
  }

  if (!bucketName) return null

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IconAlertTriangle size={20} className="text-destructive" />
            Delete Bucket
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">{bucketName}</span>?
            </p>
            <p className="text-destructive">
              The bucket must be empty before it can be deleted.
            </p>
            <p>This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteBucketMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBucketMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteBucketMutation.isPending ? (
              <>
                <IconLoader2 size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <IconTrash size={16} className="mr-2" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
