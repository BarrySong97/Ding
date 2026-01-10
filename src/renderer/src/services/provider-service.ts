import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import type { S3Provider, SupabaseProvider, Provider } from '@renderer/db'

// ============ Types ============

export interface ConnectionResult {
  connected: boolean
  error?: string
}

export interface BucketInfo {
  name: string
  creationDate?: Date
}

export interface BucketStats {
  objectCount: number
  totalSize: number // bytes
}

export interface ProviderStats {
  buckets: BucketInfo[]
  bucketCount: number
  totalObjects?: number
  totalSize?: number // bytes
}

// ============ S3 Endpoint Configuration ============

function getS3Endpoint(provider: S3Provider): string | undefined {
  // If user provided custom endpoint, use it
  if (provider.endpoint) {
    return provider.endpoint
  }

  // Generate endpoint based on variant
  switch (provider.variant) {
    case 'aws-s3':
      // AWS S3 uses region-based endpoint by default
      return provider.region ? `https://s3.${provider.region}.amazonaws.com` : undefined
    case 'aliyun-oss':
      return provider.region ? `https://${provider.region}.aliyuncs.com` : undefined
    case 'tencent-cos':
      return provider.region ? `https://cos.${provider.region}.myqcloud.com` : undefined
    case 'cloudflare-r2':
      return provider.accountId
        ? `https://${provider.accountId}.r2.cloudflarestorage.com`
        : undefined
    case 'backblaze-b2':
      return provider.region ? `https://s3.${provider.region}.backblazeb2.com` : undefined
    case 'minio':
      // MinIO requires user-provided endpoint
      return undefined
    default:
      return undefined
  }
}

// ============ S3 Client Factory ============

function createS3Client(provider: S3Provider): S3Client {
  const endpoint = getS3Endpoint(provider)

  return new S3Client({
    region: provider.region || 'auto',
    endpoint,
    credentials: {
      accessKeyId: provider.accessKeyId,
      secretAccessKey: provider.secretAccessKey
    },
    // Force path style for non-AWS S3 compatible services
    forcePathStyle: provider.variant !== 'aws-s3'
  })
}

// ============ S3 Operations ============

export async function testS3Connection(provider: S3Provider): Promise<ConnectionResult> {
  try {
    const client = createS3Client(provider)
    await client.send(new ListBucketsCommand({}))
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getS3BucketList(provider: S3Provider): Promise<BucketInfo[]> {
  const client = createS3Client(provider)
  const response = await client.send(new ListBucketsCommand({}))

  return (
    response.Buckets?.map((bucket) => ({
      name: bucket.Name || '',
      creationDate: bucket.CreationDate
    })) || []
  )
}

export async function getS3BucketStats(
  provider: S3Provider,
  bucketName: string
): Promise<BucketStats> {
  const client = createS3Client(provider)

  let objectCount = 0
  let totalSize = 0
  let continuationToken: string | undefined

  // Paginate through all objects to get accurate count and size
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken
      })
    )

    if (response.Contents) {
      objectCount += response.Contents.length
      totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0)
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return { objectCount, totalSize }
}

export async function getS3ProviderStats(provider: S3Provider): Promise<ProviderStats> {
  const buckets = await getS3BucketList(provider)

  return {
    buckets,
    bucketCount: buckets.length
    // Note: Getting total objects/size for all buckets would be expensive
    // Only fetch when user selects a specific bucket
  }
}

// ============ Supabase Operations ============

export async function testSupabaseConnection(
  provider: SupabaseProvider
): Promise<ConnectionResult> {
  try {
    const supabase = createClient(
      provider.projectUrl,
      provider.serviceRoleKey || provider.anonKey || ''
    )

    const { error } = await supabase.storage.listBuckets()

    if (error) {
      return { connected: false, error: error.message }
    }

    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getSupabaseBucketList(provider: SupabaseProvider): Promise<BucketInfo[]> {
  const supabase = createClient(
    provider.projectUrl,
    provider.serviceRoleKey || provider.anonKey || ''
  )

  const { data, error } = await supabase.storage.listBuckets()

  if (error) {
    throw new Error(error.message)
  }

  return (
    data?.map((bucket) => ({
      name: bucket.name,
      creationDate: bucket.created_at ? new Date(bucket.created_at) : undefined
    })) || []
  )
}

export async function getSupabaseBucketStats(
  provider: SupabaseProvider,
  bucketName: string
): Promise<BucketStats> {
  const supabase = createClient(
    provider.projectUrl,
    provider.serviceRoleKey || provider.anonKey || ''
  )

  // List all files in the bucket
  const { data, error } = await supabase.storage.from(bucketName).list('', {
    limit: 10000 // Supabase has a limit
  })

  if (error) {
    throw new Error(error.message)
  }

  const objectCount = data?.length || 0
  // Note: Supabase doesn't return file sizes in list, would need individual calls
  const totalSize = 0

  return { objectCount, totalSize }
}

export async function getSupabaseProviderStats(
  provider: SupabaseProvider
): Promise<ProviderStats> {
  const buckets = await getSupabaseBucketList(provider)

  return {
    buckets,
    bucketCount: buckets.length
  }
}

// ============ Unified Interface ============

export async function testConnection(provider: Provider): Promise<ConnectionResult> {
  if (provider.type === 's3-compatible') {
    return testS3Connection(provider)
  } else {
    return testSupabaseConnection(provider)
  }
}

export async function getProviderStats(provider: Provider): Promise<ProviderStats> {
  if (provider.type === 's3-compatible') {
    return getS3ProviderStats(provider)
  } else {
    return getSupabaseProviderStats(provider)
  }
}

export async function getBucketStats(
  provider: Provider,
  bucketName: string
): Promise<BucketStats> {
  if (provider.type === 's3-compatible') {
    return getS3BucketStats(provider, bucketName)
  } else {
    return getSupabaseBucketStats(provider, bucketName)
  }
}
