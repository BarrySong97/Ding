import { eq, and } from 'drizzle-orm'
import { getDatabase, schema } from './index'
import type { BucketRecord, NewBucketRecord } from './schema'
import { randomUUID } from 'crypto'

export const bucketRepository = {
  async findByProviderIdAndName(
    providerId: string,
    name: string
  ): Promise<BucketRecord | null> {
    const db = getDatabase()
    const [record] = await db
      .select()
      .from(schema.buckets)
      .where(and(eq(schema.buckets.providerId, providerId), eq(schema.buckets.name, name)))
    return record ?? null
  },

  async createOrUpdate(
    providerId: string,
    name: string,
    customDomain: string | null
  ): Promise<BucketRecord> {
    const db = getDatabase()
    const existing = await this.findByProviderIdAndName(providerId, name)

    if (existing) {
      const [updated] = await db
        .update(schema.buckets)
        .set({ customDomain, updatedAt: new Date() })
        .where(
          and(eq(schema.buckets.providerId, providerId), eq(schema.buckets.name, name))
        )
        .returning()
      return updated
    } else {
      const newBucket: NewBucketRecord = {
        id: randomUUID(),
        providerId,
        name,
        customDomain
      }
      const [created] = await db.insert(schema.buckets).values(newBucket).returning()
      return created
    }
  },

  async delete(providerId: string, name: string): Promise<boolean> {
    const db = getDatabase()
    const result = await db
      .delete(schema.buckets)
      .where(and(eq(schema.buckets.providerId, providerId), eq(schema.buckets.name, name)))
      .returning()
    return result.length > 0
  },

  async findByProviderId(providerId: string): Promise<BucketRecord[]> {
    const db = getDatabase()
    const records = await db
      .select()
      .from(schema.buckets)
      .where(eq(schema.buckets.providerId, providerId))
    return records
  }
}
