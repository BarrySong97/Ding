import { pgTable, text, timestamp, pgEnum, integer, boolean, index } from 'drizzle-orm/pg-core'

// S3 Provider variants
export const s3VariantEnum = pgEnum('s3_variant', [
  'aws-s3',
  'aliyun-oss',
  'tencent-cos',
  'cloudflare-r2',
  'minio',
  'backblaze-b2'
])

// Provider types
export const providerTypeEnum = pgEnum('provider_type', ['s3-compatible', 'supabase-storage'])

// Providers table
export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: providerTypeEnum('type').notNull(),

  // S3 fields
  variant: s3VariantEnum('variant'),
  accessKeyId: text('access_key_id'),
  secretAccessKey: text('secret_access_key'),
  region: text('region'),
  endpoint: text('endpoint'),
  bucket: text('bucket'),
  accountId: text('account_id'),

  // Supabase fields
  projectUrl: text('project_url'),
  anonKey: text('anon_key'),
  serviceRoleKey: text('service_role_key'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastOperationAt: timestamp('last_operation_at', { withTimezone: true })
})

// Type exports
export type ProviderRecord = typeof providers.$inferSelect
export type NewProviderRecord = typeof providers.$inferInsert

// Compression presets table
export const compressionPresets = pgTable('compression_presets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  maxWidth: integer('max_width').notNull(),
  maxHeight: integer('max_height').notNull(),
  quality: integer('quality').notNull(),
  format: text('format').notNull(), // 'webp' | 'jpeg' | 'png' | 'original'
  fit: text('fit').notNull(), // 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  aspectRatio: text('aspect_ratio'), // e.g., '16:9', '4:3', null for original
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type CompressionPresetRecord = typeof compressionPresets.$inferSelect
export type NewCompressionPresetRecord = typeof compressionPresets.$inferInsert

// Upload history table
export const uploadHistory = pgTable(
  'upload_history',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    bucket: text('bucket').notNull(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'file' | 'folder'
    size: integer('size'),
    mimeType: text('mime_type'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    uploadSource: text('upload_source').default('app'), // 'app' | 'drag-drop' | 'paste'
    isCompressed: boolean('is_compressed').default(false),
    originalSize: integer('original_size'),
    compressionPresetId: text('compression_preset_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    providerBucketIdx: index('upload_history_provider_bucket_idx').on(
      table.providerId,
      table.bucket
    ),
    uploadedAtIdx: index('upload_history_uploaded_at_idx').on(table.uploadedAt),
    nameIdx: index('upload_history_name_idx').on(table.name),
    keyIdx: index('upload_history_key_idx').on(table.key)
  })
)

export type UploadHistoryRecord = typeof uploadHistory.$inferSelect
export type NewUploadHistoryRecord = typeof uploadHistory.$inferInsert
