import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  providerTypes,
  addAwsS3ProviderFormSchema,
  addCloudflareR2ProviderFormSchema,
  addMinioProviderFormSchema,
  addAliyunOssProviderFormSchema,
  addTencentCosProviderFormSchema,
  addSupabaseProviderFormSchema,
  type ProviderType,
  type AddAwsS3ProviderForm,
  type AddCloudflareR2ProviderForm,
  type AddMinioProviderForm,
  type AddAliyunOssProviderForm,
  type AddTencentCosProviderForm,
  type AddSupabaseProviderForm
} from '@renderer/db'
import { trpc } from '@renderer/lib/trpc'

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: ProviderType
}

const providerTypeLabels: Record<ProviderType, string> = {
  'aws-s3': 'AWS S3',
  'cloudflare-r2': 'Cloudflare R2',
  minio: 'MinIO',
  'aliyun-oss': 'Aliyun OSS',
  'tencent-cos': 'Tencent COS',
  supabase: 'Supabase Storage'
}

export function AddProviderDialog({ open, onOpenChange, defaultType }: AddProviderDialogProps) {
  const [providerType, setProviderType] = useState<ProviderType>(defaultType || 'aws-s3')

  useEffect(() => {
    if (defaultType) {
      setProviderType(defaultType)
    }
  }, [defaultType])

  const handleClose = () => {
    onOpenChange(false)
    setProviderType(defaultType || 'aws-s3')
  }

  const renderForm = () => {
    switch (providerType) {
      case 'aws-s3':
        return <AwsS3ProviderForm onSuccess={handleClose} />
      case 'cloudflare-r2':
        return <CloudflareR2ProviderForm onSuccess={handleClose} />
      case 'minio':
        return <MinioProviderForm onSuccess={handleClose} />
      case 'aliyun-oss':
        return <AliyunOssProviderForm onSuccess={handleClose} />
      case 'tencent-cos':
        return <TencentCosProviderForm onSuccess={handleClose} />
      case 'supabase':
        return <SupabaseProviderForm onSuccess={handleClose} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Provider</DialogTitle>
          <DialogDescription>
            Add a new cloud storage provider to manage your files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Provider Type</Label>
            <Select
              value={providerType}
              onValueChange={(value) => setProviderType(value as ProviderType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {providerTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ AWS S3 Form ============

function AwsS3ProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create AWS S3 provider error:', error)
    }
  })

  const form = useForm<AddAwsS3ProviderForm>({
    resolver: standardSchemaResolver(addAwsS3ProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'aws-s3',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      endpoint: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddAwsS3ProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My AWS S3 Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accessKeyId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Access Key ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="secretAccessKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret Access Key</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="region"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Region</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="us-east-1"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="endpoint"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Endpoint (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="https://s3.example.com"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============ Cloudflare R2 Form ============

function CloudflareR2ProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create Cloudflare R2 provider error:', error)
    }
  })

  const form = useForm<AddCloudflareR2ProviderForm>({
    resolver: standardSchemaResolver(addCloudflareR2ProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'cloudflare-r2',
      accessKeyId: '',
      secretAccessKey: '',
      accountId: '',
      region: '',
      endpoint: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddCloudflareR2ProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My Cloudflare R2 Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accessKeyId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Access Key ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="secretAccessKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret Access Key</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="accountId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Account ID</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Your Cloudflare Account ID"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="region"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Region (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="auto"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="endpoint"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Endpoint (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="https://{accountId}.r2.cloudflarestorage.com"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============ MinIO Form ============

function MinioProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create MinIO provider error:', error)
    }
  })

  const form = useForm<AddMinioProviderForm>({
    resolver: standardSchemaResolver(addMinioProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'minio',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      endpoint: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddMinioProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My MinIO Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accessKeyId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Access Key ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="minioadmin"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="secretAccessKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret Access Key</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="endpoint"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Endpoint</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="http://localhost:9000"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="region"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Region (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="us-east-1"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============ Aliyun OSS Form ============

function AliyunOssProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create Aliyun OSS provider error:', error)
    }
  })

  const form = useForm<AddAliyunOssProviderForm>({
    resolver: standardSchemaResolver(addAliyunOssProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'aliyun-oss',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      endpoint: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddAliyunOssProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My Aliyun OSS Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accessKeyId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Access Key ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="LTAI5txxxxxxxxxx"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="secretAccessKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret Access Key</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="region"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Region</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="oss-cn-hangzhou"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="endpoint"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Endpoint (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="https://oss-cn-hangzhou.aliyuncs.com"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============ Tencent COS Form ============

function TencentCosProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create Tencent COS provider error:', error)
    }
  })

  const form = useForm<AddTencentCosProviderForm>({
    resolver: standardSchemaResolver(addTencentCosProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'tencent-cos',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      endpoint: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddTencentCosProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My Tencent COS Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accessKeyId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="AKIDxxxxxxxxxx"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="secretAccessKey"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Secret Key</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="region"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Region</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="ap-guangzhou"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="endpoint"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Endpoint (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="https://cos.ap-guangzhou.myqcloud.com"
              />
              {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket-1250000000"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============ Supabase Form ============

function SupabaseProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate()
      form.reset()
      onSuccess()
    },
    onError: (error) => {
      console.error('Create Supabase provider error:', error)
    }
  })

  const form = useForm<AddSupabaseProviderForm>({
    resolver: standardSchemaResolver(addSupabaseProviderFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      type: 'supabase',
      projectUrl: '',
      anonKey: '',
      serviceRoleKey: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddSupabaseProviderForm) => {
    createMutation.mutate({
      id: crypto.randomUUID(),
      ...data
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="My Supabase Storage"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="projectUrl"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Project URL</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="https://xxx.supabase.co"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="anonKey"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Anon Key (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder="••••••••"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="serviceRoleKey"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Service Role Key (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder="••••••••"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <Controller
        name="bucket"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Default Bucket (Optional)</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="my-bucket"
            />
            {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
          </Field>
        )}
      />

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Provider'}
        </Button>
      </DialogFooter>
    </form>
  )
}
