import { bucketRepository } from '../db/bucket-repository'

export const bucketService = {
  /**
   * Get the custom domain for a bucket
   * @param providerId - The provider ID
   * @param bucketName - The bucket name
   * @returns The custom domain or null if not configured
   */
  async getBucketDomain(providerId: string, bucketName: string): Promise<string | null> {
    const bucket = await bucketRepository.findByProviderIdAndName(providerId, bucketName)
    return bucket?.customDomain ?? null
  }
}
