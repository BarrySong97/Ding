import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { bucketRepository } from '@main/db/bucket-repository'

export const bucketRouter = router({
  getByProviderAndName: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        bucketName: z.string()
      })
    )
    .query(async ({ input }) => {
      return bucketRepository.findByProviderIdAndName(input.providerId, input.bucketName)
    }),

  updateDomain: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        bucketName: z.string(),
        customDomain: z.string().nullable()
      })
    )
    .mutation(async ({ input }) => {
      return bucketRepository.createOrUpdate(
        input.providerId,
        input.bucketName,
        input.customDomain
      )
    }),

  listByProvider: publicProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }) => {
      return bucketRepository.findByProviderId(input.providerId)
    })
})
