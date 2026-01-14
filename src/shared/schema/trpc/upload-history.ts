import { z } from 'zod'

// ============ Upload History Schemas ============

export const listUploadsInputSchema = z.object({
  providerId: z.string().optional(),
  bucket: z.string().optional(),
  query: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  fileTypes: z.array(z.string()).optional(),
  sortBy: z.enum(['uploadedAt', 'name', 'size']).default('uploadedAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(50)
})

export const getStatsInputSchema = z.object({
  providerId: z.string().optional(),
  bucket: z.string().optional()
})

export const deleteRecordInputSchema = z.object({
  id: z.string()
})

// ============ Type Exports ============

export type ListUploadsInput = z.infer<typeof listUploadsInputSchema>
export type GetStatsInput = z.infer<typeof getStatsInputSchema>
export type DeleteRecordInput = z.infer<typeof deleteRecordInputSchema>
