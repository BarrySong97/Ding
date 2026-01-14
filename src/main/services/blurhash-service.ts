import sharp from 'sharp'

export interface BlurHashResult {
  content: string // base64 blurhash image
  width: number
  height: number
}

/**
 * Generate a small blurred preview image that can be used as a placeholder.
 * Uses sharp to resize to a very small dimension and apply blur.
 */
export async function generateBlurHash(content: string): Promise<BlurHashResult> {
  const buffer = Buffer.from(content, 'base64')

  // Resize to small size (32px width) maintaining aspect ratio
  // Apply blur for the placeholder effect
  const resized = await sharp(buffer)
    .resize(32, null, { fit: 'inside' })
    .blur(1)
    .webp({ quality: 50 })
    .toBuffer()

  const metadata = await sharp(resized).metadata()

  return {
    content: resized.toString('base64'),
    width: metadata.width || 32,
    height: metadata.height || 32
  }
}
