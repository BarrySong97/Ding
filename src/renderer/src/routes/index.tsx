import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { IconPlus } from '@tabler/icons-react'
import { providersCollection, type S3Variant } from '@renderer/db'
import { EmptyState } from '@/components/provider/empty-state'
import { AddProviderDialog } from '@/components/provider/add-provider-dialog'
import { ProviderCard } from '@/components/provider/provider-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Index
})

function Index() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<S3Variant | undefined>()
  const { data: providers } = useLiveQuery((q) => q.from({ provider: providersCollection }))

  const handleAddProvider = (variant?: S3Variant) => {
    setSelectedVariant(variant)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedVariant(undefined)
    }
  }

  // Empty state - show onboarding
  if (!providers || providers.length === 0) {
    return (
      <>
        <EmptyState onAddProvider={handleAddProvider} />
        <AddProviderDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          defaultVariant={selectedVariant}
        />
      </>
    )
  }

  // Has providers - show list
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">OSS Upload Client</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your cloud storage providers and files
            </p>
          </div>
          <Button onClick={() => handleAddProvider()}>
            <IconPlus size={18} className="mr-2" />
            Add Provider
          </Button>
        </div>

        {/* Providers Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Providers</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </div>

      <AddProviderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        defaultVariant={selectedVariant}
      />
    </div>
  )
}
