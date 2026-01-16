import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { trpc, type TRPCProvider } from '@renderer/lib/trpc'

interface UseDownloadFileOptions {
  provider: TRPCProvider
  bucket: string
}

interface DownloadParams {
  key: string
  fileName: string
}

export function useDownloadFile({ provider, bucket }: UseDownloadFileOptions) {
  const [isDownloading, setIsDownloading] = useState(false)

  const showSaveDialogMutation = trpc.provider.showSaveDialog.useMutation()
  const downloadToFileMutation = trpc.provider.downloadToFile.useMutation()

  const downloadFile = useCallback(
    async ({ key, fileName }: DownloadParams) => {
      if (isDownloading) return

      setIsDownloading(true)

      try {
        // Step 1: Show save dialog with default file name
        const dialogResult = await showSaveDialogMutation.mutateAsync({
          defaultName: fileName
        })

        // Step 2: Handle cancellation gracefully
        if (dialogResult.canceled || !dialogResult.filePath) {
          setIsDownloading(false)
          return
        }

        // Step 3: Download file to selected path
        const downloadResult = await downloadToFileMutation.mutateAsync({
          provider,
          bucket,
          key,
          savePath: dialogResult.filePath
        })

        // Step 4: Show appropriate toast
        if (downloadResult.success && downloadResult.filePath) {
          const filePath = downloadResult.filePath
          toast.success('Download complete', {
            description: (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground break-all">{filePath}</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline text-left w-fit"
                  onClick={() => {
                    window.api.showInFolder(filePath)
                  }}
                >
                  Show in Folder
                </button>
              </div>
            )
          })
        } else {
          toast.error('Download failed', {
            description: downloadResult.error || 'An unknown error occurred'
          })
        }
      } catch (error) {
        toast.error('Download failed', {
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        })
      } finally {
        setIsDownloading(false)
      }
    },
    [provider, bucket, isDownloading, showSaveDialogMutation, downloadToFileMutation]
  )

  return {
    downloadFile,
    isDownloading
  }
}
