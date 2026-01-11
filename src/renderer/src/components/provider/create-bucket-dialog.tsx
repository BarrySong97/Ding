import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IconFolderPlus, IconLoader2 } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { trpc, type TRPCProvider } from '@renderer/lib/trpc'

const createBucketSchema = z.object({
  bucketName: z
    .string()
    .min(3, 'Bucket name must be at least 3 characters')
    .max(63, 'Bucket name must be at most 63 characters')
    .regex(
      /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/,
      'Bucket name must start and end with a lowercase letter or number, and can only contain lowercase letters, numbers, hyphens, and periods'
    )
    .refine((name) => !name.includes('..'), 'Bucket name cannot contain consecutive periods')
    .refine((name) => !name.includes('.-') && !name.includes('-.'), 'Bucket name cannot have periods adjacent to hyphens')
})

type CreateBucketForm = z.infer<typeof createBucketSchema>

interface CreateBucketDialogProps {
  provider: TRPCProvider
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateBucketDialog({
  provider,
  open,
  onOpenChange,
  onSuccess
}: CreateBucketDialogProps) {
  const [error, setError] = useState<string | null>(null)

  const createBucketMutation = trpc.provider.createBucket.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        form.reset()
        setError(null)
        onOpenChange(false)
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to create bucket')
      }
    },
    onError: (err) => {
      setError(err.message)
    }
  })

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(createBucketSchema),
    mode: 'onSubmit',
    defaultValues: {
      bucketName: ''
    }
  })

  const handleSubmit = form.handleSubmit((data) => {
    setError(null)
    createBucketMutation.mutate({
      provider,
      bucketName: data.bucketName
    })
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFolderPlus size={20} />
            Create New Bucket
          </DialogTitle>
          <DialogDescription>
            Create a new bucket in {provider.name}. Bucket names must be globally unique and follow
            S3 naming conventions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Controller
            name="bucketName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Bucket Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="my-bucket-name"
                  autoComplete="off"
                  autoFocus
                />
                {fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBucketMutation.isPending}>
              {createBucketMutation.isPending && (
                <IconLoader2 size={16} className="mr-2 animate-spin" />
              )}
              Create Bucket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
