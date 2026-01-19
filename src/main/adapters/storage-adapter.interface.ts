// ============ Types ============

export interface ConnectionResult {
  connected: boolean
  error?: string
}

export interface BucketInfo {
  name: string
  creationDate?: string
}

export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  modified?: string
  mimeType?: string
}

export interface ListObjectsOptions {
  prefix?: string
  search?: string
  cursor?: string
  maxKeys?: number
}

export interface ListObjectsResult {
  files: FileItem[]
  nextCursor?: string
  hasMore: boolean
}

export interface FileMetadata {
  contentType?: string
  size?: number
}

export interface UploadResult {
  success: boolean
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
  deletedCount?: number
}

export interface RenameResult {
  success: boolean
  error?: string
  newKey?: string
}

export interface MoveResult {
  success: boolean
  error?: string
  newKey?: string
}

export interface CreateBucketOptions {
  region?: string
  locationConstraint?: string
}

export interface CreateFolderResult {
  success: boolean
  error?: string
}

export interface ObjectUrlResult {
  url: string
  expiresAt: string
}

// ============ Storage Adapter Interface ============

/**
 * Unified interface for cloud storage operations
 * Supported providers: AWS S3, Aliyun OSS, Tencent COS, Cloudflare R2, MinIO, Backblaze B2, Supabase Storage
 */
export interface StorageAdapter {
  // ============ Connection ============

  /**
   * Test connection to the storage provider
   */
  testConnection(): Promise<ConnectionResult>

  // ============ Bucket Operations ============

  /**
   * List all buckets in the storage account
   */
  listBuckets(): Promise<BucketInfo[]>

  /**
   * Create a new bucket
   */
  createBucket(name: string, options?: CreateBucketOptions): Promise<void>

  /**
   * Delete a bucket (must be empty)
   */
  deleteBucket(name: string): Promise<void>

  // ============ Object Operations ============

  /**
   * List objects in a bucket with optional prefix filtering
   */
  listObjects(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResult>

  /**
   * Upload a file to the bucket
   * @param bucket - Bucket name
   * @param key - Object key (path)
   * @param content - File content as Buffer
   * @param metadata - Optional file metadata
   */
  uploadFile(
    bucket: string,
    key: string,
    content: Buffer,
    metadata?: FileMetadata
  ): Promise<UploadResult>

  /**
   * Delete a single object or folder
   * @param bucket - Bucket name
   * @param key - Object key (path)
   * @param isFolder - Whether the object is a folder
   */
  deleteObject(bucket: string, key: string, isFolder?: boolean): Promise<DeleteResult>

  /**
   * Delete multiple objects in batch
   */
  deleteObjects(bucket: string, keys: string[]): Promise<DeleteResult>

  // ============ Object Management ============

  /**
   * Rename an object (copy + delete original)
   */
  renameObject(bucket: string, sourceKey: string, newName: string): Promise<RenameResult>

  /**
   * Move an object to a different location
   */
  moveObject(bucket: string, sourceKey: string, destinationPrefix: string): Promise<MoveResult>

  /**
   * Move multiple objects to a different location
   */
  moveObjects(bucket: string, sourceKeys: string[], destinationPrefix: string): Promise<MoveResult>

  // ============ Folder Operations ============

  /**
   * Create a folder (empty object with trailing slash)
   */
  createFolder(bucket: string, path: string): Promise<CreateFolderResult>

  // ============ URL Generation ============

  /**
   * Generate a signed URL for accessing an object
   * @param bucket - Bucket name
   * @param key - Object key
   * @param expiresIn - Expiration time in seconds (default: 3600)
   */
  getObjectUrl(bucket: string, key: string, expiresIn?: number): Promise<ObjectUrlResult>
}
