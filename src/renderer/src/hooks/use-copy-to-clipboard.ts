import { useState, useCallback, useRef } from 'react'

interface UseCopyToClipboardReturn {
  copied: boolean
  copyToClipboard: (text: string) => Promise<boolean>
}

export function useCopyToClipboard(timeout = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)

        // Reset after timeout
        timeoutRef.current = setTimeout(() => {
          setCopied(false)
        }, timeout)

        return true
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
      }
    },
    [timeout]
  )

  return { copied, copyToClipboard }
}
