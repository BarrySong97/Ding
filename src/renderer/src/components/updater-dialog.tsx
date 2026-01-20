import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

interface ProgressInfo {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export function UpdaterDialog() {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 监听更新事件
    const unsubChecking = window.api.updater.onUpdateChecking(() => {
      setChecking(true)
      setError(null)
    })

    const unsubAvailable = window.api.updater.onUpdateAvailable((info) => {
      setChecking(false)
      setUpdateAvailable(true)
      setUpdateInfo(info)
    })

    const unsubNotAvailable = window.api.updater.onUpdateNotAvailable(() => {
      setChecking(false)
    })

    const unsubProgress = window.api.updater.onDownloadProgress((progressInfo: ProgressInfo) => {
      setDownloading(true)
      setProgress(progressInfo.percent)
    })

    const unsubDownloaded = window.api.updater.onUpdateDownloaded(() => {
      setDownloading(false)
      setDownloaded(true)
    })

    const unsubError = window.api.updater.onUpdateError((err) => {
      setChecking(false)
      setDownloading(false)
      setError(err.message || String(err))
    })

    return () => {
      unsubChecking()
      unsubAvailable()
      unsubNotAvailable()
      unsubProgress()
      unsubDownloaded()
      unsubError()
    }
  }, [])

  const handleCheckForUpdates = async () => {
    setChecking(true)
    setError(null)
    const result = await window.api.updater.checkForUpdates()
    if (result.error) {
      setError(result.error)
      setChecking(false)
    }
  }

  const handleInstallUpdate = () => {
    window.api.updater.installUpdate()
  }

  const handleCloseUpdateDialog = () => {
    setUpdateAvailable(false)
    setUpdateInfo(null)
  }

  const handleCloseDownloadedDialog = () => {
    setDownloaded(false)
  }

  return (
    <>
      {/* 手动检查更新按钮 */}
      <div className="p-4">
        <Button onClick={handleCheckForUpdates} disabled={checking}>
          {checking ? 'Checking for updates...' : 'Check for Updates'}
        </Button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* 发现新版本对话框 */}
      <AlertDialog open={updateAvailable && !downloading && !downloaded}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Available</AlertDialogTitle>
            <AlertDialogDescription>
              A new version {updateInfo?.version} is available. Would you like to download it now?
              {updateInfo?.releaseNotes && (
                <div className="mt-4 rounded-md bg-muted p-4">
                  <p className="text-sm font-medium">Release Notes:</p>
                  <p className="mt-2 text-sm">{updateInfo.releaseNotes}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseUpdateDialog}>Later</AlertDialogCancel>
            <AlertDialogAction onClick={() => setUpdateAvailable(false)}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 下载进度对话框 */}
      <AlertDialog open={downloading}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downloading Update</AlertDialogTitle>
            <AlertDialogDescription>
              Downloading version {updateInfo?.version}...
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="mt-2 text-center text-sm">{Math.round(progress)}%</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* 下载完成对话框 */}
      <AlertDialog open={downloaded}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Ready</AlertDialogTitle>
            <AlertDialogDescription>
              Update has been downloaded. The application will restart to install the update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDownloadedDialog}>Later</AlertDialogCancel>
            <AlertDialogAction onClick={handleInstallUpdate}>Restart and Install</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
