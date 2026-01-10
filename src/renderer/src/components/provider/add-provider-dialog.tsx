import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  providersCollection,
  addS3ProviderFormSchema,
  addSupabaseProviderFormSchema,
  s3Variants,
  type S3Variant,
  type AddS3ProviderForm,
  type AddSupabaseProviderForm
} from '@renderer/db'

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultVariant?: S3Variant
}

type ProviderType = 's3-compatible' | 'supabase-storage'

const s3VariantLabels: Record<(typeof s3Variants)[number], string> = {
  'aws-s3': 'AWS S3',
  'aliyun-oss': 'Aliyun OSS',
  'tencent-cos': 'Tencent COS',
  'cloudflare-r2': 'Cloudflare R2',
  minio: 'MinIO',
  'backblaze-b2': 'Backblaze B2'
}

export function AddProviderDialog({ open, onOpenChange, defaultVariant }: AddProviderDialogProps) {
  const [providerType, setProviderType] = useState<ProviderType>('s3-compatible')

  const handleClose = () => {
    onOpenChange(false)
    setProviderType('s3-compatible')
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
                <SelectItem value="s3-compatible">S3 Compatible</SelectItem>
                <SelectItem value="supabase-storage">Supabase Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {providerType === 's3-compatible' ? (
            <S3ProviderForm onSuccess={handleClose} defaultVariant={defaultVariant} />
          ) : (
            <SupabaseProviderForm onSuccess={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function S3ProviderForm({
  onSuccess,
  defaultVariant
}: {
  onSuccess: () => void
  defaultVariant?: S3Variant
}) {
  const form = useForm<AddS3ProviderForm>({
    resolver: zodResolver(addS3ProviderFormSchema),
    defaultValues: {
      name: '',
      type: 's3-compatible',
      variant: defaultVariant || 'aws-s3',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      endpoint: '',
      bucket: '',
      accountId: ''
    }
  })

  // Update variant when defaultVariant changes
  useEffect(() => {
    if (defaultVariant) {
      form.setValue('variant', defaultVariant)
    }
  }, [defaultVariant, form])

  const selectedVariant = form.watch('variant')

  const onSubmit = (data: AddS3ProviderForm) => {
    providersCollection.insert({
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My S3 Storage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="variant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {s3Variants.map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {s3VariantLabels[variant]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accessKeyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Key ID</FormLabel>
                <FormControl>
                  <Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secretAccessKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secret Access Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedVariant === 'cloudflare-r2' && (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account ID</FormLabel>
                <FormControl>
                  <Input placeholder="Your Cloudflare Account ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="us-east-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endpoint (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://s3.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bucket"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Bucket (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="my-bucket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">Add Provider</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function SupabaseProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<AddSupabaseProviderForm>({
    resolver: zodResolver(addSupabaseProviderFormSchema),
    defaultValues: {
      name: '',
      type: 'supabase-storage',
      projectUrl: '',
      anonKey: '',
      serviceRoleKey: '',
      bucket: ''
    }
  })

  const onSubmit = (data: AddSupabaseProviderForm) => {
    providersCollection.insert({
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Supabase Storage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project URL</FormLabel>
              <FormControl>
                <Input placeholder="https://xxx.supabase.co" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="anonKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anon Key (Optional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceRoleKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Role Key (Optional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bucket"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Bucket (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="my-bucket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">Add Provider</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
