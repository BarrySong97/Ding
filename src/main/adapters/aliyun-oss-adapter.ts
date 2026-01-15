import OSS from 'ali-oss'
import type { AliyunOssProvider } from '@shared/schema/provider'
import type {
  StorageAdapter,
  ConnectionResult,
  BucketInfo,
  ListObjectsOptions,
  ListObjectsResult,
  FileMetadata,
  UploadResult,
  DeleteResult,
  RenameResult,
  MoveResult,
  CreateBucketOptions,
  CreateFolderResult,
  ObjectUrlResult
} from './storage-adapter.interface'

// ============ Utility Functions ============

function getMimeType(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    zip: 'application/zip',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript'
  }
  return ext ? mimeTypes[ext] : undefined
}

// ============ Aliyun OSS Adapter Implementation ============

export class AliyunOssAdapter implements StorageAdapter {
  private client: OSS

  constructor(provider: AliyunOssProvider) {
    this.client = new OSS({
      region: provider.region || 'oss-cn-hangzhou',
      accessKeyId: provider.accessKeyId,
      accessKeySecret: provider.secretAccessKey,
      ...(provider.endpoint && { endpoint: provider.endpoint })
    })
  }

  // ============ Connection ============

  async testConnection(): Promise<ConnectionResult> {
    try {
      await this.client.listBuckets()
      return { connected: true }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ Bucket Operations ============

  async listBuckets(): Promise<BucketInfo[]> {
    const result = await this.client.listBuckets()

    return (
      result.buckets?.map((bucket) => ({
        name: bucket.name,
        creationDate: bucket.creationDate
      })) || []
    )
  }

  async createBucket(name: string, options?: CreateBucketOptions): Promise<void> {
    await this.client.putBucket(name, {
      ...(options?.region && { region: options.region })
    })
  }

  async deleteBucket(name: string): Promise<void> {
    await this.client.deleteBucket(name)
  }

  // ============ Object Operations ============

  async listObjects(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResult> {
    const result = await this.client.list(
      {
        prefix: options?.prefix || '',
        delimiter: '/',
        marker: options?.cursor,
        'max-keys': options?.maxKeys || 100
      },
      {
        bucket
      }
    )

    const files: ListObjectsResult['files'] = []

    // Add folders (prefixes)
    if (result.prefixes) {
      for (const prefix of result.prefixes) {
        const name = prefix.replace(/\/$/, '').split('/').pop() || ''
        files.push({
          id: prefix,
          name,
          type: 'folder'
        })
      }
    }

    // Add files (objects)
    if (result.objects) {
      for (const obj of result.objects) {
        const name = obj.name.split('/').pop() || ''
        if (!name) continue

        files.push({
          id: obj.name,
          name,
          type: 'file',
          size: obj.size,
          modified: obj.lastModified,
          mimeType: getMimeType(name)
        })
      }
    }

    // Sort files: folders first (alphabetically), then files by modified date (newest first)
    files.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1

      if (a.type === 'folder' && b.type === 'folder') {
        return a.name.localeCompare(b.name)
      }

      if (a.modified && b.modified) {
        return new Date(b.modified).getTime() - new Date(a.modified).getTime()
      }

      if (!a.modified) return 1
      if (!b.modified) return -1

      return 0
    })

    return {
      files,
      nextCursor: result.nextMarker,
      hasMore: result.isTruncated || false
    }
  }

  async uploadFile(
    bucket: string,
    key: string,
    content: Buffer,
    metadata?: FileMetadata
  ): Promise<UploadResult> {
    try {
      console.log('[AliyunOssAdapter] Uploading:', {
        bucket,
        key,
        contentType: metadata?.contentType,
        bufferSize: content.length
      })

      await this.client.put(key, content, {
        bucket,
        headers: {
          'Content-Type': metadata?.contentType || getMimeType(key) || 'application/octet-stream'
        }
      })

      console.log('[AliyunOssAdapter] Upload successful:', { bucket, key })
      return { success: true }
    } catch (error) {
      console.error('[AliyunOssAdapter] Upload failed:', {
        bucket,
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteObject(bucket: string, key: string, isFolder?: boolean): Promise<DeleteResult> {
    try {
      if (isFolder) {
        // For folders, delete all objects with this prefix
        const keysToDelete: string[] = []
        let marker: string | undefined

        do {
          const result = await this.client.list(
            {
              prefix: key,
              marker
            },
            {
              bucket
            }
          )

          if (result.objects) {
            for (const obj of result.objects) {
              keysToDelete.push(obj.name)
            }
          }

          marker = result.nextMarker
        } while (marker)

        if (keysToDelete.length === 0) {
          return { success: true, deletedCount: 0 }
        }

        // Delete in batches of 1000 (OSS limit)
        let deletedCount = 0
        for (let i = 0; i < keysToDelete.length; i += 1000) {
          const batch = keysToDelete.slice(i, i + 1000)
          await this.client.deleteMulti(batch, { bucket })
          deletedCount += batch.length
        }

        return { success: true, deletedCount }
      } else {
        // Single file delete
        await this.client.delete(key, { bucket })
        return { success: true, deletedCount: 1 }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<DeleteResult> {
    try {
      // Delete in batches of 1000 (OSS limit)
      let deletedCount = 0
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000)
        await this.client.deleteMulti(batch, { bucket })
        deletedCount += batch.length
      }

      return { success: true, deletedCount }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ Object Management ============

  async renameObject(bucket: string, sourceKey: string, newName: string): Promise<RenameResult> {
    try {
      // Calculate new key by replacing filename in path
      const pathParts = sourceKey.split('/')
      pathParts[pathParts.length - 1] = newName
      const destinationKey = pathParts.join('/')

      // Copy to new location
      await this.client.copy(destinationKey, sourceKey, { bucket })

      // Delete original
      await this.client.delete(sourceKey, { bucket })

      return { success: true, newKey: destinationKey }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async moveObject(
    bucket: string,
    sourceKey: string,
    destinationPrefix: string
  ): Promise<MoveResult> {
    try {
      // Get filename from source key
      const fileName = sourceKey.split('/').pop() || ''
      const destinationKey = destinationPrefix ? `${destinationPrefix}${fileName}` : fileName

      // Copy to new location
      await this.client.copy(destinationKey, sourceKey, { bucket })

      // Delete original
      await this.client.delete(sourceKey, { bucket })

      return { success: true, newKey: destinationKey }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async moveObjects(
    bucket: string,
    sourceKeys: string[],
    destinationPrefix: string
  ): Promise<MoveResult> {
    try {
      for (const sourceKey of sourceKeys) {
        const result = await this.moveObject(bucket, sourceKey, destinationPrefix)
        if (!result.success) {
          return result
        }
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ Folder Operations ============

  async createFolder(bucket: string, path: string): Promise<CreateFolderResult> {
    try {
      // Ensure path ends with /
      const folderPath = path.endsWith('/') ? path : `${path}/`

      await this.client.put(folderPath, Buffer.from(''), {
        bucket,
        headers: {
          'Content-Type': 'application/x-directory'
        }
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ URL Generation ============

  async getObjectUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<ObjectUrlResult> {
    const url = this.client.signatureUrl(key, {
      expires: expiresIn,
      bucket
    })
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return { url, expiresAt }
  }
}
