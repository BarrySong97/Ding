import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IconEdit, IconLoader2 } from '@tabler/icons-react'
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
import { trpc } from '@renderer/lib/trpc'

const bucketDomainSchema = z.object({
  customDomain: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => {
      if (!val) return true // Allow empty
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    }, 'Please enter a valid URL (e.g., https://files.example.com)')
})

type BucketDomainForm = z.infer<typeof bucketDomainSchema>

interface BucketDomainDialogProps {
  providerId: string
  bucketName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BucketDomainDialog({
  providerId,
  bucketName,
  open,
  onOpenChange,
  onSuccess
}: BucketDomainDialogProps) {
  const [error, setError] = useState<string | null>(null)

  // Query to get existing bucket config
  const { data: bucketConfig, isLoading: isLoadingConfig } =
    trpc.bucket.getByProviderAndName.useQuery(
      {
        providerId,
        bucketName
      },
      {
        enabled: open // Only fetch when dialog is open
      }
    )

  const updateDomainMutation = trpc.bucket.updateDomain.useMutation({
    onSuccess: () => {
      setError(null)
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (err) => {
      setError(err.message)
    }
  })

  const form = useForm<BucketDomainForm>({
    resolver: zodResolver(bucketDomainSchema),
    mode: 'onSubmit',
    defaultValues: {
      customDomain: ''
    }
  })

  // Update form when bucket config is loaded
  useEffect(() => {
    if (bucketConfig) {
      form.reset({
        customDomain: bucketConfig.customDomain || ''
      })
    }
  }, [bucketConfig, form])

  const handleSubmit = form.handleSubmit((data) => {
    setError(null)
    updateDomainMutation.mutate({
      providerId,
      bucketName,
      customDomain: data.customDomain || null
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
            <IconEdit size={20} />
            Edit Bucket Configuration
          </DialogTitle>
          <DialogDescription>
            Configure a custom domain for bucket <span className="font-semibold">{bucketName}</span>
            . When set, file URLs will use this domain instead of the default provider endpoint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Controller
            name="customDomain"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Custom Domain (Optional)</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="https://files.example.com"
                  autoComplete="off"
                  disabled={isLoadingConfig}
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
            <Button type="submit" disabled={updateDomainMutation.isPending || isLoadingConfig}>
              {updateDomainMutation.isPending && (
                <IconLoader2 size={16} className="mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
