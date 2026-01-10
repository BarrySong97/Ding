import { IconSearch, IconCircleCheckFilled, IconCircleXFilled } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'

interface ToolbarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  storageUsage?: string
  isConnected?: boolean
}

export function Toolbar({
  searchQuery = '',
  onSearchChange,
  storageUsage,
  isConnected = false
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      {/* Left: Storage Usage */}
      <div className="flex items-center gap-4">
        {storageUsage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Storage:</span>
            <span className="font-medium text-foreground">{storageUsage}</span>
          </div>
        )}
        {/* Connected Status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <IconCircleCheckFilled size={16} className="text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <IconCircleXFilled size={16} className="text-red-500" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Search Input */}
      <div className="relative w-64">
        <IconSearch
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}
