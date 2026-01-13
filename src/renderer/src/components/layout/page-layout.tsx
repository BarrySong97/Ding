import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <ScrollArea
      className={cn(window.api.platform.isMac ? 'h-[calc(100vh-48px)]' : 'h-calc(100vh-48px)')}
    >
      <div className={cn('w-full p-6', className)}>{children}</div>
    </ScrollArea>
  )
}
