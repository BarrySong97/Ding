import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IconSettings, IconLoader2 } from '@tabler/icons-react'
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

const providerSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

type ProviderSettingsForm = z.infer<typeof providerSettingsSchema>

interface ProviderSettingsDialogProps {
  provider: TRPCProvider
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProviderSettingsDialog({
  provider,
  open,
  onOpenChange,
  onSuccess
}: ProviderSettingsDialogProps) {
  const utils = trpc.useUtils()

  const updateMutation = trpc.provider.update.useMutation({
    onSuccess: () => {
      utils.provider.getById.invalidate({ id: provider.id })
      utils.provider.list.invalidate()
      onOpenChange(false)
      onSuccess?.()
    }
  })

  const form = useForm<ProviderSettingsForm>({
    resolver: zodResolver(providerSettingsSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: provider.name
    }
  })

  // Reset form when dialog opens with current provider name
  useEffect(() => {
    if (open) {
      form.reset({ name: provider.name })
    }
  }, [open, provider.name, form])

  const handleSubmit = form.handleSubmit((data) => {
    if (data.name === provider.name) {
      onOpenChange(false)
      return
    }
    updateMutation.mutate({
      id: provider.id,
      name: data.name
    })
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      updateMutation.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSettings size={20} />
            Provider Settings
          </DialogTitle>
          <DialogDescription>Edit the settings for this provider.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Provider Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="My Provider"
                  autoComplete="off"
                  autoFocus
                />
                {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
              </Field>
            )}
          />

          {updateMutation.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {updateMutation.error.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
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
