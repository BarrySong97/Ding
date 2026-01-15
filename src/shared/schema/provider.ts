import { z } from 'zod'

// Provider types
export const providerTypes = [
  'aws-s3',
  'cloudflare-r2',
  'minio',
  'aliyun-oss',
  'tencent-cos',
  'supabase'
] as const

export type ProviderType = (typeof providerTypes)[number]

// ============ Base Provider Fields ============

const baseProviderFields = {
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastOperationAt: z.coerce.date().nullable().optional()
}

// ============ S3-Compatible Providers ============

// AWS S3
export const awsS3ProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('aws-s3'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Cloudflare R2
export const cloudflareR2ProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('cloudflare-r2'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  accountId: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// MinIO
export const minioProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('minio'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// ============ Native SDK Providers ============

// Aliyun OSS
export const aliyunOssProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('aliyun-oss'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Tencent COS
export const tencentCosProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('tencent-cos'),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Supabase Storage
export const supabaseProviderSchema = z.object({
  ...baseProviderFields,
  type: z.literal('supabase'),
  projectUrl: z.string(),
  anonKey: z.string().optional(),
  serviceRoleKey: z.string().optional(),
  bucket: z.string().optional()
})

// ============ Combined Provider Schema ============

export const providerSchema = z.discriminatedUnion('type', [
  awsS3ProviderSchema,
  cloudflareR2ProviderSchema,
  minioProviderSchema,
  aliyunOssProviderSchema,
  tencentCosProviderSchema,
  supabaseProviderSchema
])

export type Provider = z.infer<typeof providerSchema>
export type AwsS3Provider = z.infer<typeof awsS3ProviderSchema>
export type CloudflareR2Provider = z.infer<typeof cloudflareR2ProviderSchema>
export type MinioProvider = z.infer<typeof minioProviderSchema>
export type AliyunOssProvider = z.infer<typeof aliyunOssProviderSchema>
export type TencentCosProvider = z.infer<typeof tencentCosProviderSchema>
export type SupabaseProvider = z.infer<typeof supabaseProviderSchema>

// S3-compatible providers (use AWS SDK)
export type S3CompatibleProvider = AwsS3Provider | CloudflareR2Provider | MinioProvider

// ============ Form Schemas (for react-hook-form) ============

// AWS S3 form schema
export const addAwsS3ProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('aws-s3'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Cloudflare R2 form schema
export const addCloudflareR2ProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('cloudflare-r2'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  accountId: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// MinIO form schema
export const addMinioProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('minio'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Aliyun OSS form schema
export const addAliyunOssProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('aliyun-oss'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Tencent COS form schema
export const addTencentCosProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('tencent-cos'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  bucket: z.string().optional()
})

// Supabase form schema
export const addSupabaseProviderFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.literal('supabase'),
  projectUrl: z.string().url('Please enter a valid URL'),
  anonKey: z.string().optional(),
  serviceRoleKey: z.string().optional(),
  bucket: z.string().optional()
})

// Combined form schema
export const addProviderFormSchema = z.discriminatedUnion('type', [
  addAwsS3ProviderFormSchema,
  addCloudflareR2ProviderFormSchema,
  addMinioProviderFormSchema,
  addAliyunOssProviderFormSchema,
  addTencentCosProviderFormSchema,
  addSupabaseProviderFormSchema
])

export type AddAwsS3ProviderForm = z.infer<typeof addAwsS3ProviderFormSchema>
export type AddCloudflareR2ProviderForm = z.infer<typeof addCloudflareR2ProviderFormSchema>
export type AddMinioProviderForm = z.infer<typeof addMinioProviderFormSchema>
export type AddAliyunOssProviderForm = z.infer<typeof addAliyunOssProviderFormSchema>
export type AddTencentCosProviderForm = z.infer<typeof addTencentCosProviderFormSchema>
export type AddSupabaseProviderForm = z.infer<typeof addSupabaseProviderFormSchema>
export type AddProviderForm = z.infer<typeof addProviderFormSchema>
