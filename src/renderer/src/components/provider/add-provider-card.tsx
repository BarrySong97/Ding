import { IconPlus } from '@tabler/icons-react'

interface AddProviderCardProps {
  onClick: () => void
}

export function AddProviderCard({ onClick }: AddProviderCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-transparent p-4 text-center transition-colors hover:border-muted-foreground/50 hover:bg-accent/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-muted-foreground/25">
        <IconPlus size={20} className="text-muted-foreground" />
      </div>
      <div>
        <div className="font-medium">Add Provider</div>
        <div className="text-sm text-muted-foreground">Connect S3-compatible storage</div>
      </div>
    </button>
  )
}
