import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseProvider } from '@shared/schema/provider'
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

// ============ Supabase Adapter Implementation ============

export class SupabaseAdapter implements StorageAdapter {
  private client: SupabaseClient

  constructor(provider: SupabaseProvider) {
    this.client = createClient(
      provider.projectUrl,
      provider.serviceRoleKey || provider.anonKey || ''
    )
  }

  // ============ Connection ============

  async testConnection(): Promise<ConnectionResult> {
    try {
      const { error } = await this.client.storage.listBuckets()

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

  // ============ Bucket Operations ============

  async listBuckets(): Promise<BucketInfo[]> {
    const { data, error } = await this.client.storage.listBuckets()

    if (error) {
      throw new Error(error.message)
    }

    return (
      data?.map((bucket) => ({
        name: bucket.name,
        creationDate: bucket.created_at
      })) || []
    )
  }

  async createBucket(name: string, _options?: CreateBucketOptions): Promise<void> {
    const { error } = await this.client.storage.createBucket(name, {
      public: false
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async deleteBucket(name: string): Promise<void> {
    const { error } = await this.client.storage.deleteBucket(name)

    if (error) {
      throw new Error(error.message)
    }
  }

  // ============ Object Operations ============

  async listObjects(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResult> {
    const offset = options?.cursor ? parseInt(options.cursor, 10) : 0
    const maxKeys = options?.maxKeys || 100

    const { data, error } = await this.client.storage.from(bucket).list(options?.prefix || '', {
      limit: maxKeys,
      offset
    })

    if (error) {
      throw new Error(error.message)
    }

    const files: ListObjectsResult['files'] =
      data?.map((item) => ({
        id: item.id || item.name,
        name: item.name,
        type: (item.metadata ? 'file' : 'folder') as 'file' | 'folder',
        size: item.metadata?.size,
        modified: item.updated_at,
        mimeType: item.metadata?.mimetype
      })) || []

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

    const hasMore = data?.length === maxKeys
    const nextCursor = hasMore ? String(offset + maxKeys) : undefined

    return {
      files,
      nextCursor,
      hasMore
    }
  }

  async uploadFile(
    bucket: string,
    key: string,
    content: Buffer,
    metadata?: FileMetadata
  ): Promise<UploadResult> {
    try {
      const uint8Array = new Uint8Array(content)
      const blob = new Blob([uint8Array], {
        type: metadata?.contentType || getMimeType(key) || 'application/octet-stream'
      })

      console.log('[SupabaseAdapter] Uploading:', {
        bucket,
        key,
        contentType: metadata?.contentType,
        blobSize: blob.size
      })

      const { error } = await this.client.storage.from(bucket).upload(key, blob, {
        contentType: metadata?.contentType || getMimeType(key) || 'application/octet-stream',
        upsert: true
      })

      if (error) {
        console.error('[SupabaseAdapter] Upload failed:', {
          bucket,
          key,
          error: error.message,
          errorDetails: error
        })
        return { success: false, error: error.message }
      }

      console.log('[SupabaseAdapter] Upload successful:', { bucket, key })
      return { success: true }
    } catch (error) {
      console.error('[SupabaseAdapter] Upload exception:', {
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
        // List all files in the folder
        const { data: files, error: listError } = await this.client.storage.from(bucket).list(key)

        if (listError) {
          return { success: false, error: listError.message }
        }

        if (!files || files.length === 0) {
          return { success: true, deletedCount: 0 }
        }

        // Build full paths for deletion
        const paths = files.map((f) => `${key}${f.name}`)

        const { error } = await this.client.storage.from(bucket).remove(paths)

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, deletedCount: paths.length }
      } else {
        const { error } = await this.client.storage.from(bucket).remove([key])

        if (error) {
          return { success: false, error: error.message }
        }

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
      const { error } = await this.client.storage.from(bucket).remove(keys)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, deletedCount: keys.length }
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
      // Calculate new key
      const pathParts = sourceKey.split('/')
      pathParts[pathParts.length - 1] = newName
      const destinationKey = pathParts.join('/')

      const { error } = await this.client.storage.from(bucket).move(sourceKey, destinationKey)

      if (error) {
        return { success: false, error: error.message }
      }

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

      const { error } = await this.client.storage.from(bucket).move(sourceKey, destinationKey)

      if (error) {
        return { success: false, error: error.message }
      }

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
      // Supabase doesn't have explicit folder creation
      // Create a .keep file to represent the folder
      const folderPath = path.endsWith('/') ? path : `${path}/`
      const keepFilePath = `${folderPath}.keep`

      const { error } = await this.client.storage
        .from(bucket)
        .upload(keepFilePath, new Blob(['']), {
          contentType: 'text/plain'
        })

      if (error) {
        return { success: false, error: error.message }
      }

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
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(key, expiresIn)

    if (error) {
      throw new Error(error.message)
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return { url: data.signedUrl, expiresAt }
  }
}
