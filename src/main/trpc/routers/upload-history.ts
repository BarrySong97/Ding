import { publicProcedure, router } from '../trpc'
import {
  listUploadsInputSchema,
  getStatsInputSchema,
  deleteRecordInputSchema
} from '@shared/schema/trpc/upload-history'
import { uploadHistoryService } from '@main/services/upload-history-service'

export const uploadHistoryRouter = router({
  /**
   * List upload history with pagination and filtering
   */
  list: publicProcedure.input(listUploadsInputSchema).query(async ({ input }) => {
    return uploadHistoryService.listUploads(input)
  }),

  /**
   * Get upload statistics
   */
  getStats: publicProcedure.input(getStatsInputSchema).query(async ({ input }) => {
    return uploadHistoryService.getStats(input)
  }),

  /**
   * Delete a record by ID
   */
  deleteRecord: publicProcedure.input(deleteRecordInputSchema).mutation(async ({ input }) => {
    const success = await uploadHistoryService.deleteRecord(input.id)
    return { success }
  })
})
