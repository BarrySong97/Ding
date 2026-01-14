import { useState, useEffect, useMemo } from 'react'
import {
  IconPhoto,
  IconUpload,
  IconLoader2,
  IconScissors,
  IconCheck,
  IconTrash
} from '@tabler/icons-react'
import { trpc, type TRPCProvider } from '@renderer/lib/trpc'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ImageCropper } from '@/components/ui/image-cropper'
import { useUploadStore } from '@renderer/stores/upload-store'
import { formatFileSize } from '@/lib/utils'

interface ImageUploadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: File[]
  provider: TRPCProvider
  bucket: string
  prefix?: string
  onUploadStart: () => void
  onUploadComplete?: () => void
}

interface ImageUploadItem {
  file: File
  previewUrl: string
  selectedPreset: string | null
  croppedContent: string | null // 手动裁切后的 base64，null = 未裁切
  needsCrop: boolean // 是否需要裁切 (preset有aspectRatio)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImageUploadDrawer({
  open,
  onOpenChange,
  files,
  provider,
  bucket,
  prefix,
  onUploadStart,
  onUploadComplete
}: ImageUploadDrawerProps) {
  const [imageItems, setImageItems] = useState<ImageUploadItem[]>([])
  const [keepOriginal, setKeepOriginal] = useState(false)
  const [generateBlurHash, setGenerateBlurHash] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null)

  const { data: presets, isLoading: presetsLoading } = trpc.preset.list.useQuery()
  const uploadMutation = trpc.provider.uploadFile.useMutation()
  const compressMutation = trpc.image.compress.useMutation()
  const blurHashMutation = trpc.image.generateBlurHash.useMutation()
  const trpcUtils = trpc.useUtils()

  const { addTask, updateTask, setDrawerOpen: setUploadDrawerOpen } = useUploadStore()

  // Initialize image items when files change
  useEffect(() => {
    if (!open || files.length === 0) {
      setImageItems([])
      return
    }

    const newItems: ImageUploadItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      selectedPreset: 'content', // Default preset
      croppedContent: null,
      needsCrop: false
    }))
    setImageItems(newItems)

    return () => {
      newItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [open, files])

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setKeepOriginal(false)
      setGenerateBlurHash(false)
      setIsUploading(false)
    }
  }, [open])

  // Update needsCrop when preset changes
  const updatePreset = (index: number, presetId: string) => {
    const preset = presets?.find((p) => p.id === presetId)
    setImageItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              selectedPreset: presetId,
              needsCrop: !!preset?.aspectRatio,
              croppedContent: preset?.aspectRatio ? item.croppedContent : null
            }
          : item
      )
    )
  }

  const applyPresetToAll = (presetId: string) => {
    const preset = presets?.find((p) => p.id === presetId)
    setImageItems((prev) =>
      prev.map((item) => ({
        ...item,
        selectedPreset: presetId,
        needsCrop: !!preset?.aspectRatio,
        croppedContent: preset?.aspectRatio ? item.croppedContent : null
      }))
    )
  }

  const removeImage = (index: number) => {
    setImageItems((prev) => {
      const newItems = [...prev]
      URL.revokeObjectURL(newItems[index].previewUrl)
      newItems.splice(index, 1)
      return newItems
    })
  }

  const openCropper = (index: number) => {
    setCurrentCropIndex(index)
    setCropperOpen(true)
  }

  const handleCropComplete = (croppedImageData: string) => {
    if (currentCropIndex !== null) {
      // Extract base64 content (remove data:image/png;base64, prefix)
      const base64Content = croppedImageData.split(',')[1]
      setImageItems((prev) =>
        prev.map((item, i) =>
          i === currentCropIndex ? { ...item, croppedContent: base64Content } : item
        )
      )
    }
    setCropperOpen(false)
    setCurrentCropIndex(null)
  }

  const currentCropItem = currentCropIndex !== null ? imageItems[currentCropIndex] : null
  const currentPreset =
    currentCropItem && presets?.find((p) => p.id === currentCropItem.selectedPreset)

  const totalTasks = useMemo(() => {
    const validItems = imageItems.filter((item) => item.selectedPreset !== null)
    let count = validItems.length
    if (keepOriginal) count += imageItems.length
    if (generateBlurHash) count += imageItems.length
    return count
  }, [imageItems, keepOriginal, generateBlurHash])

  const processUploads = async () => {
    // Process each image item
    for (const item of imageItems) {
      const file = item.file
      const originalContent = await fileToBase64(file)
      const originalFilename = file.name
      const originalContentType = file.type

      // Get original image info
      let originalWidth: number | undefined
      let originalHeight: number | undefined
      try {
        const imageInfo = await trpcUtils.image.getInfo.fetch({ content: originalContent })
        originalWidth = imageInfo.width
        originalHeight = imageInfo.height
      } catch {
        // Ignore
      }

      // Upload with selected preset if exists
      if (item.selectedPreset) {
        const presetId = item.selectedPreset
        const taskId = addTask({
          file,
          fileName: file.name,
          fileSize: file.size,
          providerId: provider.id,
          bucket,
          prefix,
          status: 'compressing',
          progress: 0,
          compressionEnabled: true,
          compressionPreset: presetId,
          originalSize: file.size,
          isImage: true
        })

        try {
          // Use cropped content if available, otherwise use original
          const contentToCompress = item.croppedContent || originalContent

          // Compress the image
          const compressResult = await compressMutation.mutateAsync({
            content: contentToCompress,
            preset: presetId,
            filename: originalFilename
          })

          if (compressResult.success && compressResult.content) {
            const ext = compressResult.format === 'jpeg' ? 'jpg' : compressResult.format || 'webp'
            const baseName =
              originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename
            const filename = `${baseName}_${presetId}_${compressResult.width}x${compressResult.height}.${ext}`

            updateTask(taskId, {
              status: 'uploading',
              compressedSize: compressResult.compressedSize,
              width: compressResult.width,
              height: compressResult.height,
              format: compressResult.format
            })

            const key = prefix ? `${prefix}${filename}` : filename

            console.log('[ImageUpload] Uploading compressed image:', {
              bucket,
              key,
              prefix,
              filename,
              preset: presetId
            })

            const result = await uploadMutation.mutateAsync({
              provider,
              bucket,
              key,
              content: compressResult.content,
              contentType: `image/${compressResult.format}`
            })

            if (result.success) {
              updateTask(taskId, {
                status: 'completed',
                progress: 100,
                outputKey: key
              })
            } else {
              updateTask(taskId, {
                status: 'error',
                error: result.error || 'Upload failed'
              })
            }
          } else {
            updateTask(taskId, {
              status: 'error',
              error: compressResult.error || 'Compression failed'
            })
          }
        } catch (error) {
          updateTask(taskId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Upload original if selected
      if (keepOriginal) {
        const baseName =
          originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename
        const ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1)
        const filename = `${baseName}_original_${originalWidth}x${originalHeight}.${ext}`

        const taskId = addTask({
          file,
          fileName: file.name,
          fileSize: file.size,
          providerId: provider.id,
          bucket,
          prefix,
          status: 'uploading',
          progress: 0,
          compressionEnabled: false,
          compressionPreset: 'original',
          originalSize: file.size,
          isImage: true
        })

        try {
          const key = prefix ? `${prefix}${filename}` : filename

          console.log('[ImageUpload] Uploading original image:', {
            bucket,
            key,
            prefix,
            filename
          })

          const result = await uploadMutation.mutateAsync({
            provider,
            bucket,
            key,
            content: originalContent,
            contentType: originalContentType
          })

          if (result.success) {
            updateTask(taskId, {
              status: 'completed',
              progress: 100,
              outputKey: key
            })
          } else {
            updateTask(taskId, {
              status: 'error',
              error: result.error || 'Upload failed'
            })
          }
        } catch (error) {
          updateTask(taskId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Generate and upload BlurHash if selected
      if (generateBlurHash) {
        const baseName =
          originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename
        const filename = `${baseName}_blurhash.webp`

        const taskId = addTask({
          file,
          fileName: `${file.name} (blurhash)`,
          fileSize: file.size,
          providerId: provider.id,
          bucket,
          prefix,
          status: 'compressing',
          progress: 0,
          compressionEnabled: true,
          compressionPreset: 'blurhash',
          originalSize: file.size,
          isImage: true
        })

        try {
          const blurResult = await blurHashMutation.mutateAsync({
            content: originalContent
          })

          updateTask(taskId, {
            status: 'uploading',
            compressedSize: Math.ceil(blurResult.content.length * 0.75), // Approximate base64 to bytes
            width: blurResult.width,
            height: blurResult.height
          })

          const key = prefix ? `${prefix}${filename}` : filename

          console.log('[ImageUpload] Uploading blurhash:', {
            bucket,
            key,
            prefix,
            filename
          })

          const result = await uploadMutation.mutateAsync({
            provider,
            bucket,
            key,
            content: blurResult.content,
            contentType: 'image/webp'
          })

          if (result.success) {
            updateTask(taskId, {
              status: 'completed',
              progress: 100,
              outputKey: key
            })
          } else {
            updateTask(taskId, {
              status: 'error',
              error: result.error || 'Upload failed'
            })
          }
        } catch (error) {
          updateTask(taskId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // Call onUploadComplete after all uploads are done
    onUploadComplete?.()
  }
  const handleStartUpload = () => {
    const hasValidPresets = imageItems.some((item) => item.selectedPreset !== null)
    if (imageItems.length === 0 || (!hasValidPresets && !keepOriginal)) {
      return
    }

    // Close drawer immediately
    onOpenChange(false)
    onUploadStart()

    // Open the upload manager drawer to show progress
    setUploadDrawerOpen(true)

    // Run uploads in background (non-blocking)
    processUploads()
  }

  const hasValidPresets = imageItems.some((item) => item.selectedPreset !== null)
  const canUpload = imageItems.length > 0 && (hasValidPresets || keepOriginal) && !isUploading

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="p-0 flex flex-col min-w-[1000px]">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <IconPhoto size={20} className="text-blue-500" />
              Upload Images
            </SheetTitle>
            <SheetDescription>
              {imageItems.length} image{imageItems.length !== 1 && 's'} selected
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {/* Image table */}
              {presetsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  {/* Apply to All section */}
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                    <Label className="text-sm font-medium">Apply preset to all:</Label>
                    <Select onValueChange={applyPresetToAll}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {presets?.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-16">Preview</TableHead>
                          <TableHead>Filename</TableHead>
                          <TableHead className="w-24">Size</TableHead>
                          <TableHead className="w-48">Preset</TableHead>
                          <TableHead className="w-28">Crop</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {imageItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="w-12 h-12 rounded-md overflow-hidden border bg-muted">
                                <img
                                  src={item.previewUrl}
                                  alt={item.file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.file.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatFileSize(item.file.size)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.selectedPreset || undefined}
                                onValueChange={(value) => updatePreset(index, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select preset" />
                                </SelectTrigger>
                                <SelectContent>
                                  {presets?.map((preset) => (
                                    <SelectItem key={preset.id} value={preset.id}>
                                      {preset.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {item.needsCrop && (
                                <Button
                                  variant={item.croppedContent ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => openCropper(index)}
                                  className={
                                    item.croppedContent
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950'
                                  }
                                >
                                  {item.croppedContent ? (
                                    <>
                                      <IconCheck size={14} className="mr-1" />
                                      Cropped
                                    </>
                                  ) : (
                                    <>
                                      <IconScissors size={14} className="mr-1" />
                                      Crop
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeImage(index)}
                                className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                              >
                                <IconTrash size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Options */}
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keep-original" className="text-sm font-normal cursor-pointer">
                    Keep original image
                  </Label>
                  <Switch
                    id="keep-original"
                    checked={keepOriginal}
                    onCheckedChange={setKeepOriginal}
                    disabled={isUploading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="generate-blurhash"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Generate BlurHash
                    </Label>
                    <p className="text-xs text-muted-foreground">Small blurred placeholder image</p>
                  </div>
                  <Switch
                    id="generate-blurhash"
                    checked={generateBlurHash}
                    onCheckedChange={setGenerateBlurHash}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  Total uploads:{' '}
                  <span className="font-medium text-foreground">{totalTasks} files</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasValidPresets &&
                    `${imageItems.filter((i) => i.selectedPreset).length} preset uploads`}
                  {keepOriginal && ' + original'}
                  {generateBlurHash && ' + blurhash'}
                </p>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleStartUpload} disabled={!canUpload}>
              {isUploading ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload size={16} className="mr-2" />
                  Start Upload
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Image Cropper Dialog */}
      {currentCropItem && (
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={currentCropItem.previewUrl}
          aspectRatio={currentPreset?.aspectRatio as any}
          onCropComplete={handleCropComplete}
          title="Crop Image"
          description={`Crop ${currentCropItem.file.name} to ${currentPreset?.aspectRatio || 'free'} aspect ratio`}
        />
      )}
    </>
  )
}
