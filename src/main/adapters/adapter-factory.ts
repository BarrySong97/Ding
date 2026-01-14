import type { Provider } from '@shared/schema/provider'
import type { StorageAdapter } from './storage-adapter.interface'
import { S3Adapter } from './s3-adapter'
import { SupabaseAdapter } from './supabase-adapter'

/**
 * Factory function to create the appropriate storage adapter based on provider type
 */
export function createStorageAdapter(provider: Provider): StorageAdapter {
  if (provider.type === 's3-compatible') {
    return new S3Adapter(provider)
  } else if (provider.type === 'supabase-storage') {
    return new SupabaseAdapter(provider)
  } else {
    throw new Error(`Unsupported provider type: ${(provider as Provider).type}`)
  }
}
