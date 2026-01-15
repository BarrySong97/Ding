import COS from 'cos-nodejs-sdk-v5'
import type { TencentCosProvider } from '@shared/schema/provider'
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

// ============ Tencent COS Adapter Implementation ============

export class TencentCosAdapter implements StorageAdapter {
  private client: COS
  private provider: TencentCosProvider

  constructor(provider: TencentCosProvider) {
    this.provider = provider

    this.client = new COS({
      SecretId: provider.accessKeyId,
      SecretKey: provider.secretAccessKey,
      ...(provider.endpoint && { ServiceDomain: provider.endpoint })
    })
  }

  // ============ Connection ============

  async testConnection(): Promise<ConnectionResult> {
    return new Promise((resolve) => {
      this.client.getService((err) => {
        if (err) {
          resolve({
            connected: false,
            error: err.message || 'Unknown error'
          })
        } else {
          resolve({ connected: true })
        }
      })
    })
  }

  // ============ Bucket Operations ============

  async listBuckets(): Promise<BucketInfo[]> {
    return new Promise((resolve, reject) => {
      this.client.getService((err, data) => {
        if (err) {
          reject(err)
        } else {
          const buckets =
            data.Buckets?.map((bucket) => ({
              name: bucket.Name,
              creationDate: bucket.CreationDate
            })) || []
          resolve(buckets)
        }
      })
    })
  }

  async createBucket(name: string, options?: CreateBucketOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.putBucket(
        {
          Bucket: name,
          Region: options?.region || this.provider.region || 'ap-guangzhou'
        },
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  async deleteBucket(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.deleteBucket(
        {
          Bucket: name,
          Region: this.provider.region || 'ap-guangzhou'
        },
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  // ============ Object Operations ============

  async listObjects(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResult> {
    return new Promise((resolve, reject) => {
      this.client.getBucket(
        {
          Bucket: bucket,
          Region: this.provider.region || 'ap-guangzhou',
          Prefix: options?.prefix || '',
          Delimiter: '/',
          Marker: options?.cursor,
          MaxKeys: options?.maxKeys || 100
        },
        (err, data) => {
          if (err) {
            reject(err)
          } else {
            const files: ListObjectsResult['files'] = []

            // Add folders (CommonPrefixes)
            if (data.CommonPrefixes) {
              for (const prefix of data.CommonPrefixes) {
                const name = prefix.Prefix.replace(/\/$/, '').split('/').pop() || ''
                files.push({
                  id: prefix.Prefix,
                  name,
                  type: 'folder'
                })
              }
            }

            // Add files (Contents)
            if (data.Contents) {
              for (const obj of data.Contents) {
                const name = obj.Key.split('/').pop() || ''
                if (!name) continue

                files.push({
                  id: obj.Key,
                  name,
                  type: 'file',
                  size: Number(obj.Size),
                  modified: obj.LastModified,
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

            resolve({
              files,
              nextCursor: data.NextMarker,
              hasMore: data.IsTruncated === 'true'
            })
          }
        }
      )
    })
  }

  async uploadFile(
    bucket: string,
    key: string,
    content: Buffer,
    metadata?: FileMetadata
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      console.log('[TencentCosAdapter] Uploading:', {
        bucket,
        key,
        contentType: metadata?.contentType,
        bufferSize: content.length
      })

      this.client.putObject(
        {
          Bucket: bucket,
          Region: this.provider.region || 'ap-guangzhou',
          Key: key,
          Body: content,
          ContentType: metadata?.contentType || getMimeType(key) || 'application/octet-stream'
        },
        (err) => {
          if (err) {
            console.error('[TencentCosAdapter] Upload failed:', {
              bucket,
              key,
              error: err.message || 'Unknown error',
              errorDetails: err
            })
            resolve({
              success: false,
              error: err.message || 'Unknown error'
            })
          } else {
            console.log('[TencentCosAdapter] Upload successful:', { bucket, key })
            resolve({ success: true })
          }
        }
      )
    })
  }

  async deleteObject(bucket: string, key: string, isFolder?: boolean): Promise<DeleteResult> {
    if (isFolder) {
      // For folders, delete all objects with this prefix
      const keysToDelete: string[] = []
      let marker: string | undefined

      try {
        do {
          const result = await new Promise<{ objects: string[]; nextMarker?: string }>(
            (resolve, reject) => {
              this.client.getBucket(
                {
                  Bucket: bucket,
                  Region: this.provider.region || 'ap-guangzhou',
                  Prefix: key,
                  Marker: marker
                },
                (err, data) => {
                  if (err) {
                    reject(err)
                  } else {
                    const objects = data.Contents?.map((obj) => obj.Key) || []
                    resolve({
                      objects,
                      nextMarker: data.NextMarker
                    })
                  }
                }
              )
            }
          )

          keysToDelete.push(...result.objects)
          marker = result.nextMarker
        } while (marker)

        if (keysToDelete.length === 0) {
          return { success: true, deletedCount: 0 }
        }

        // Delete in batches of 1000 (COS limit)
        let deletedCount = 0
        for (let i = 0; i < keysToDelete.length; i += 1000) {
          const batch = keysToDelete.slice(i, i + 1000)
          await new Promise<void>((resolve, reject) => {
            this.client.deleteMultipleObject(
              {
                Bucket: bucket,
                Region: this.provider.region || 'ap-guangzhou',
                Objects: batch.map((k) => ({ Key: k }))
              },
              (err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve()
                }
              }
            )
          })
          deletedCount += batch.length
        }

        return { success: true, deletedCount }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    } else {
      // Single file delete
      return new Promise((resolve) => {
        this.client.deleteObject(
          {
            Bucket: bucket,
            Region: this.provider.region || 'ap-guangzhou',
            Key: key
          },
          (err) => {
            if (err) {
              resolve({
                success: false,
                error: err.message || 'Unknown error'
              })
            } else {
              resolve({ success: true, deletedCount: 1 })
            }
          }
        )
      })
    }
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<DeleteResult> {
    try {
      // Delete in batches of 1000 (COS limit)
      let deletedCount = 0
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000)
        await new Promise<void>((resolve, reject) => {
          this.client.deleteMultipleObject(
            {
              Bucket: bucket,
              Region: this.provider.region || 'ap-guangzhou',
              Objects: batch.map((k) => ({ Key: k }))
            },
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
        })
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
      await new Promise<void>((resolve, reject) => {
        this.client.putObjectCopy(
          {
            Bucket: bucket,
            Region: this.provider.region || 'ap-guangzhou',
            Key: destinationKey,
            CopySource: `${bucket}.cos.${this.provider.region || 'ap-guangzhou'}.myqcloud.com/${encodeURIComponent(sourceKey)}`
          },
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })

      // Delete original
      await new Promise<void>((resolve, reject) => {
        this.client.deleteObject(
          {
            Bucket: bucket,
            Region: this.provider.region || 'ap-guangzhou',
            Key: sourceKey
          },
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })

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
      await new Promise<void>((resolve, reject) => {
        this.client.putObjectCopy(
          {
            Bucket: bucket,
            Region: this.provider.region || 'ap-guangzhou',
            Key: destinationKey,
            CopySource: `${bucket}.cos.${this.provider.region || 'ap-guangzhou'}.myqcloud.com/${encodeURIComponent(sourceKey)}`
          },
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })

      // Delete original
      await new Promise<void>((resolve, reject) => {
        this.client.deleteObject(
          {
            Bucket: bucket,
            Region: this.provider.region || 'ap-guangzhou',
            Key: sourceKey
          },
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })

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
    return new Promise((resolve) => {
      // Ensure path ends with /
      const folderPath = path.endsWith('/') ? path : `${path}/`

      this.client.putObject(
        {
          Bucket: bucket,
          Region: this.provider.region || 'ap-guangzhou',
          Key: folderPath,
          Body: '',
          ContentType: 'application/x-directory'
        },
        (err) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || 'Unknown error'
            })
          } else {
            resolve({ success: true })
          }
        }
      )
    })
  }

  // ============ URL Generation ============

  async getObjectUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<ObjectUrlResult> {
    const url = this.client.getObjectUrl(
      {
        Bucket: bucket,
        Region: this.provider.region || 'ap-guangzhou',
        Key: key,
        Sign: true,
        Expires: expiresIn
      },
      () => {}
    )
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return { url, expiresAt }
  }
}
