import type { Provider } from '@shared/schema/provider'
import { createStorageAdapter } from '@main/adapters'
import { uploadHistoryService } from './upload-history-service'

// ============ Re-export Types from Adapter ============
export type {
  ConnectionResult,
  BucketInfo,
  FileItem,
  ListObjectsResult,
  UploadResult,
  DeleteResult,
  RenameResult,
  MoveResult,
  CreateFolderResult,
  ObjectUrlResult
} from '@main/adapters'

// ============ Input Types ============

export interface ProviderStats {
  buckets: { name: string; creationDate?: string }[]
  bucketCount: number
}

export interface ListObjectsInput {
  provider: Provider
  bucket: string
  prefix?: string
  search?: string
  cursor?: string
  maxKeys?: number
}

export interface UploadFileInput {
  provider: Provider
  bucket: string
  key: string
  content: string // Base64 encoded
  contentType?: string
}

export interface CreateFolderInput {
  provider: Provider
  bucket: string
  path: string
}

export interface GetObjectUrlInput {
  provider: Provider
  bucket: string
  key: string
  expiresIn?: number
}

export interface DeleteObjectInput {
  provider: Provider
  bucket: string
  key: string
  isFolder?: boolean
}

export interface DeleteObjectsInput {
  provider: Provider
  bucket: string
  keys: string[]
}

export interface RenameObjectInput {
  provider: Provider
  bucket: string
  sourceKey: string
  newName: string
}

export interface MoveObjectInput {
  provider: Provider
  bucket: string
  sourceKey: string
  destinationPrefix: string
}

export interface MoveObjectsInput {
  provider: Provider
  bucket: string
  sourceKeys: string[]
  destinationPrefix: string
}

export interface CreateBucketInput {
  provider: Provider
  bucketName: string
}

export interface DeleteBucketInput {
  provider: Provider
  bucketName: string
}

export interface CreateBucketResult {
  success: boolean
  error?: string
}

export interface DeleteBucketResult {
  success: boolean
  error?: string
}

export interface ListBucketsInput {
  provider: Provider
}

export interface DownloadToFileInput {
  provider: Provider
  bucket: string
  key: string
  savePath: string
}

export interface DownloadToFileResult {
  success: boolean
  error?: string
  filePath?: string
}

export interface GetPlainObjectUrlInput {
  provider: Provider
  bucket: string
  key: string
}

export interface PlainObjectUrlResult {
  url: string
}

// ============ Service Functions ============

export async function testConnection(provider: Provider) {
  const adapter = createStorageAdapter(provider)
  return adapter.testConnection()
}

export async function getProviderStats(provider: Provider): Promise<ProviderStats> {
  const adapter = createStorageAdapter(provider)
  const buckets = await adapter.listBuckets()

  return {
    buckets,
    bucketCount: buckets.length
  }
}

export async function listObjects(input: ListObjectsInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.listObjects(input.bucket, {
    prefix: input.prefix,
    search: input.search,
    cursor: input.cursor,
    maxKeys: input.maxKeys
  })
}

export async function uploadFile(input: UploadFileInput) {
  const adapter = createStorageAdapter(input.provider)
  const buffer = Buffer.from(input.content, 'base64')

  console.log('[uploadFile] Uploading:', {
    bucket: input.bucket,
    key: input.key,
    contentType: input.contentType,
    bufferSize: buffer.length
  })

  const result = await adapter.uploadFile(input.bucket, input.key, buffer, {
    contentType: input.contentType
  })

  // Note: Upload history is now managed by the frontend via uploadHistory.createRecord and updateStatus
  // This allows tracking of upload failures and in-progress uploads

  return result
}

export async function createFolder(input: CreateFolderInput) {
  const adapter = createStorageAdapter(input.provider)
  const result = await adapter.createFolder(input.bucket, input.path)

  // Record folder creation if successful
  if (result.success) {
    const folderName = input.path.replace(/\/$/, '').split('/').pop() || input.path
    await uploadHistoryService.recordUpload({
      providerId: input.provider.id,
      bucket: input.bucket,
      key: input.path,
      name: folderName,
      type: 'folder',
      uploadSource: 'app'
    })
  }

  return result
}

export async function getObjectUrl(input: GetObjectUrlInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.getObjectUrl(input.bucket, input.key, input.expiresIn)
}

export async function deleteObject(input: DeleteObjectInput) {
  const adapter = createStorageAdapter(input.provider)
  const result = await adapter.deleteObject(input.bucket, input.key, input.isFolder)

  // Delete upload history record if successful
  if (result.success) {
    await uploadHistoryService.deleteByKey(input.provider.id, input.bucket, input.key)
  }

  return result
}

export async function deleteObjects(input: DeleteObjectsInput) {
  const adapter = createStorageAdapter(input.provider)
  const result = await adapter.deleteObjects(input.bucket, input.keys)

  // Delete upload history records if successful
  if (result.success) {
    await uploadHistoryService.deleteByKeys(input.provider.id, input.bucket, input.keys)
  }

  return result
}

export async function renameObject(input: RenameObjectInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.renameObject(input.bucket, input.sourceKey, input.newName)
}

export async function moveObject(input: MoveObjectInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.moveObject(input.bucket, input.sourceKey, input.destinationPrefix)
}

export async function moveObjects(input: MoveObjectsInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.moveObjects(input.bucket, input.sourceKeys, input.destinationPrefix)
}

export async function createBucket(input: CreateBucketInput): Promise<CreateBucketResult> {
  try {
    const adapter = createStorageAdapter(input.provider)
    await adapter.createBucket(input.bucketName)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function deleteBucket(input: DeleteBucketInput): Promise<DeleteBucketResult> {
  try {
    const adapter = createStorageAdapter(input.provider)
    await adapter.deleteBucket(input.bucketName)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function listBuckets(input: ListBucketsInput) {
  const adapter = createStorageAdapter(input.provider)
  return adapter.listBuckets()
}

export async function downloadToFile(input: DownloadToFileInput): Promise<DownloadToFileResult> {
  try {
    const { createWriteStream } = await import('fs')
    const { pipeline } = await import('stream/promises')

    // Get signed URL for the object
    const adapter = createStorageAdapter(input.provider)
    const urlResult = await adapter.getObjectUrl(input.bucket, input.key, 3600)

    // Fetch the file content
    const response = await fetch(urlResult.url)
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch file: ${response.statusText}`
      }
    }

    if (!response.body) {
      return {
        success: false,
        error: 'No response body'
      }
    }

    // Write to file using Readable.fromWeb for web stream compatibility
    const { Readable } = await import('stream')
    const nodeStream = Readable.fromWeb(response.body as import('stream/web').ReadableStream)
    const fileStream = createWriteStream(input.savePath)
    await pipeline(nodeStream, fileStream)

    return {
      success: true,
      filePath: input.savePath
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function getPlainObjectUrl(input: GetPlainObjectUrlInput): PlainObjectUrlResult {
  const { provider, bucket, key } = input
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')

  switch (provider.type) {
    case 'aws-s3': {
      // AWS S3: https://{bucket}.s3.{region}.amazonaws.com/{key}
      // Or with custom endpoint
      if (provider.endpoint) {
        const endpoint = provider.endpoint.replace(/\/$/, '')
        return { url: `${endpoint}/${bucket}/${encodedKey}` }
      }
      const region = provider.region || 'us-east-1'
      return { url: `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}` }
    }

    case 'cloudflare-r2': {
      // R2 with custom domain or account endpoint
      if (provider.endpoint) {
        const endpoint = provider.endpoint.replace(/\/$/, '')
        return { url: `${endpoint}/${bucket}/${encodedKey}` }
      }
      // Default R2 endpoint (requires account ID)
      if (provider.accountId) {
        return {
          url: `https://${provider.accountId}.r2.cloudflarestorage.com/${bucket}/${encodedKey}`
        }
      }
      return { url: `https://r2.cloudflarestorage.com/${bucket}/${encodedKey}` }
    }

    case 'minio': {
      // MinIO: {endpoint}/{bucket}/{key}
      const endpoint = (provider.endpoint || 'http://localhost:9000').replace(/\/$/, '')
      return { url: `${endpoint}/${bucket}/${encodedKey}` }
    }

    case 'aliyun-oss': {
      // Aliyun OSS: https://{bucket}.{region}.aliyuncs.com/{key}
      // Or with custom endpoint
      if (provider.endpoint) {
        const endpoint = provider.endpoint.replace(/\/$/, '')
        // If endpoint contains bucket name, use as-is
        if (endpoint.includes(bucket)) {
          return { url: `${endpoint}/${encodedKey}` }
        }
        return { url: `${endpoint}/${bucket}/${encodedKey}` }
      }
      const region = provider.region || 'oss-cn-hangzhou'
      return { url: `https://${bucket}.${region}.aliyuncs.com/${encodedKey}` }
    }

    case 'tencent-cos': {
      // Tencent COS: https://{bucket}.cos.{region}.myqcloud.com/{key}
      if (provider.endpoint) {
        const endpoint = provider.endpoint.replace(/\/$/, '')
        return { url: `${endpoint}/${encodedKey}` }
      }
      const region = provider.region || 'ap-guangzhou'
      return { url: `https://${bucket}.cos.${region}.myqcloud.com/${encodedKey}` }
    }

    case 'supabase': {
      // Supabase: {projectUrl}/storage/v1/object/public/{bucket}/{key}
      const projectUrl = provider.projectUrl.replace(/\/$/, '')
      return { url: `${projectUrl}/storage/v1/object/public/${bucket}/${encodedKey}` }
    }

    default:
      return { url: '' }
  }
}
