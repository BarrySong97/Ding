import * as React from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export type AspectRatioOption = '16:9' | '4:3' | '1:1' | 'free'

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  aspectRatio?: AspectRatioOption
  onCropComplete: (croppedImageData: string) => void
  title?: string
  description?: string
}

function parseAspectRatio(ratio: AspectRatioOption): number | undefined {
  switch (ratio) {
    case '16:9':
      return 16 / 9
    case '4:3':
      return 4 / 3
    case '1:1':
      return 1
    case 'free':
    default:
      return undefined
  }
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio: initialAspectRatio = 'free',
  onCropComplete,
  title = 'Crop Image',
  description = 'Adjust the crop area to select the portion of the image you want to use.'
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatioOption>(initialAspectRatio)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const aspect = parseAspectRatio(aspectRatio)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect))
    } else {
      setCrop({
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90
      })
    }
  }

  function handleAspectRatioChange(value: AspectRatioOption) {
    setAspectRatio(value)
    const newAspect = parseAspectRatio(value)
    if (imgRef.current && newAspect) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, newAspect))
    } else if (!newAspect) {
      setCrop({
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90
      })
    }
  }

  async function handleCropComplete() {
    if (!imgRef.current || !completedCrop) return

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const croppedImageData = canvas.toDataURL('image/png')
    onCropComplete(croppedImageData)
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (open) {
      setAspectRatio(initialAspectRatio)
      setCrop(undefined)
      setCompletedCrop(undefined)
    }
  }, [open, initialAspectRatio])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Aspect Ratio:</span>
            <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="4:3">4:3</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              'flex items-center justify-center overflow-hidden rounded-md border bg-muted/30',
              'max-h-[60vh]'
            )}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ImageCropper }
export type { ImageCropperProps }
