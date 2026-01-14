import { router } from './trpc'
import { providerRouter } from './routers/provider'
import { imageRouter } from './routers/image'
import { presetRouter } from './routers/preset'
import { uploadHistoryRouter } from './routers/upload-history'

export const appRouter = router({
  provider: providerRouter,
  image: imageRouter,
  preset: presetRouter,
  uploadHistory: uploadHistoryRouter
})

export type AppRouter = typeof appRouter
