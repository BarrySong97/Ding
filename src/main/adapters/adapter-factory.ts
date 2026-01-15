import type { Provider } from '@shared/schema/provider'
import type { StorageAdapter } from './storage-adapter.interface'
import { S3Adapter } from './s3-adapter'
import { AliyunOssAdapter } from './aliyun-oss-adapter'
import { TencentCosAdapter } from './tencent-cos-adapter'
import { SupabaseAdapter } from './supabase-adapter'

/**
 * Factory function to create the appropriate storage adapter based on provider type
 */
export function createStorageAdapter(provider: Provider): StorageAdapter {
  switch (provider.type) {
    case 'aws-s3':
    case 'cloudflare-r2':
    case 'minio':
      return new S3Adapter(provider)
    case 'aliyun-oss':
      return new AliyunOssAdapter(provider)
    case 'tencent-cos':
      return new TencentCosAdapter(provider)
    case 'supabase':
      return new SupabaseAdapter(provider)
    default:
      throw new Error(`Unsupported provider type: ${(provider as Provider).type}`)
  }
}
