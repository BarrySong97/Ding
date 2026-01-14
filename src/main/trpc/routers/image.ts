import { z } from 'zod'
import { dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { basename, dirname, join, extname } from 'path'
import { publicProcedure, router } from '../trpc'
import { compressImage, getImageInfo, getOutputExtension } from '@main/services/image-service'
import { getAllPresets } from '@main/services/preset-service'
import { generateBlurHash } from '@main/services/blurhash-service'

const compressImageInputSchema = z.object({
  content: z.string(), // Base64 encoded
  preset: z.string(), // Preset ID (can be built-in or custom)
  filename: z.string().optional()
})

const getImageInfoInputSchema = z.object({
  content: z.string() // Base64 encoded
})

const compressFileInputSchema = z.object({
  filePath: z.string(),
  presetId: z.string(),
  outputPath: z.string().optional(),
  content: z.string().optional() // Optional pre-cropped content (base64)
})

export const imageRouter = router({
  compress: publicProcedure.input(compressImageInputSchema).mutation(async ({ input }) => {
    return compressImage(input)
  }),

  getInfo: publicProcedure.input(getImageInfoInputSchema).query(async ({ input }) => {
    return getImageInfo(input.content)
  }),

  getPresets: publicProcedure.query(async () => {
    return getAllPresets()
  }),

  // Generate a small blurred preview image (BlurHash)
  generateBlurHash: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      return generateBlurHash(input.content)
    }),

  // Select image file using system dialog
  selectImageFile: publicProcedure.mutation(async () => {
    const window = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: '', content: '' }
    }

    // Read file content for preview/cropping
    const fileBuffer = await readFile(result.filePaths[0])
    const content = fileBuffer.toString('base64')

    return { canceled: false, filePath: result.filePaths[0], content }
  }),

  // Compress file - generic interface for compression
  compressFile: publicProcedure.input(compressFileInputSchema).mutation(async ({ input }) => {
    const { filePath, presetId, outputPath, content: preCroppedContent } = input

    try {
      // Use pre-cropped content if provided, otherwise read from file
      let content: string
      if (preCroppedContent) {
        content = preCroppedContent
      } else {
        const fileBuffer = await readFile(filePath)
        content = fileBuffer.toString('base64')
      }
      const originalFilename = basename(filePath)

      // Compress image
      const result = await compressImage({
        content,
        preset: presetId,
        filename: originalFilename
      })

      if (!result.success || !result.content) {
        return {
          success: false,
          originalSize: result.originalSize,
          error: result.error || 'Compression failed'
        }
      }

      // Determine output path
      let finalOutputPath: string
      if (outputPath) {
        finalOutputPath = outputPath
      } else {
        // Save to same directory with new naming format: {basename}_{type}_{width}x{height}.{ext}
        const dir = dirname(filePath)
        const newFilename = await getOutputExtension(presetId, originalFilename)
        const ext = extname(newFilename)
        // Get basename without extension
        const lastDotIndex = originalFilename.lastIndexOf('.')
        const baseName = lastDotIndex > 0 ? originalFilename.substring(0, lastDotIndex) : originalFilename
        // Format: basename_type_widthxheight.ext
        finalOutputPath = join(dir, `${baseName}_${presetId}_${result.width}x${result.height}${ext}`)
      }

      // Write compressed file
      const outputBuffer = Buffer.from(result.content, 'base64')
      await writeFile(finalOutputPath, outputBuffer)

      return {
        success: true,
        outputPath: finalOutputPath,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        width: result.width,
        height: result.height,
        format: result.format
      }
    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
})
