# Provider 类型定义

## 概述

本项目支持两类对象存储服务：
1. **S3 兼容类** - AWS S3、阿里云 OSS、腾讯云 COS、Cloudflare R2、MinIO、Backblaze B2
2. **Supabase Storage** - Supabase 提供的对象存储服务

## TypeScript 类型定义

```typescript
// ============ S3 兼容类 ============

interface S3Provider {
  type: 's3-compatible'
  variant: 'aws-s3' | 'aliyun-oss' | 'tencent-cos' | 'cloudflare-r2' | 'minio' | 'backblaze-b2'
  accessKeyId: string
  secretAccessKey: string
  region?: string
  endpoint?: string
  bucket?: string
  // R2 专用
  accountId?: string
}

// ============ Supabase Storage ============

interface SupabaseStorageProvider {
  type: 'supabase-storage'
  projectUrl: string
  anonKey?: string
  serviceRoleKey?: string
  bucket?: string
}

// ============ 统一类型 ============

interface BaseProvider {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

type ProviderCredentials = S3Provider | SupabaseStorageProvider

type Provider = BaseProvider & ProviderCredentials
```

## 各 Provider 必填字段

| Provider | 必填字段 | 可选字段 |
|----------|---------|---------|
| AWS S3 | accessKeyId, secretAccessKey, region | endpoint, bucket |
| 阿里云 OSS | accessKeyId, secretAccessKey, endpoint | region, bucket |
| 腾讯云 COS | accessKeyId, secretAccessKey, region | endpoint, bucket |
| Cloudflare R2 | accessKeyId, secretAccessKey, accountId | endpoint, bucket |
| MinIO | accessKeyId, secretAccessKey, endpoint | region, bucket |
| Backblaze B2 | accessKeyId, secretAccessKey, endpoint | region, bucket |
| Supabase Storage | projectUrl, (anonKey 或 serviceRoleKey) | bucket |
