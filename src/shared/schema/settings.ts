import { z } from 'zod'

// Compression presets (built-in preset IDs)
export const compressionPresets = ['cover', 'card', 'thumbnail', 'content', 'original'] as const

export type CompressionPreset = (typeof compressionPresets)[number]

// Aspect ratios for cropping
export const aspectRatios = ['16:9', '4:3', '1:1', null] as const
export type AspectRatio = (typeof aspectRatios)[number]

// Fit modes for Sharp.js
export const fitModes = ['cover', 'contain', 'fill', 'inside', 'outside'] as const
export type FitMode = (typeof fitModes)[number]

// Compression preset formats
export const compressionFormats = ['webp', 'jpeg', 'png', 'original'] as const
export type CompressionFormat = (typeof compressionFormats)[number]

// Preset schema
export const presetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  maxWidth: z.number().int().min(1, 'Width must be at least 1').max(10000, 'Width must be 10000 or less'),
  maxHeight: z.number().int().min(1, 'Height must be at least 1').max(10000, 'Height must be 10000 or less'),
  quality: z.number().int().min(1, 'Quality must be at least 1').max(100, 'Quality must be 100 or less'),
  format: z.enum(compressionFormats),
  fit: z.enum(fitModes),
  aspectRatio: z.string().nullable().optional(), // e.g., '16:9', '4:3', null for original
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type Preset = z.infer<typeof presetSchema>

// Create preset input schema (omit auto-generated fields)
export const createPresetInputSchema = presetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreatePresetInput = z.infer<typeof createPresetInputSchema>

// Update preset input schema (all fields optional except id)
export const updatePresetInputSchema = presetSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true })

export type UpdatePresetInput = z.infer<typeof updatePresetInputSchema>
