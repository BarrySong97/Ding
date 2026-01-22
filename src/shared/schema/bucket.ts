import { z } from 'zod'

// Bucket record schema (matches database schema)
export const bucketSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  name: z.string(),
  customDomain: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type Bucket = z.infer<typeof bucketSchema>

// Form schema for updating bucket domain
export const updateBucketDomainFormSchema = z.object({
  customDomain: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val))
})

export type UpdateBucketDomainForm = z.infer<typeof updateBucketDomainFormSchema>
