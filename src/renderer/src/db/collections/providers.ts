import { createCollection, localStorageCollectionOptions } from '@tanstack/react-db'
import { providerSchema } from '../schema/provider'

export const providersCollection = createCollection(
  localStorageCollectionOptions({
    id: 'providers',
    storageKey: 'ding-providers',
    getKey: (item) => item.id,
    schema: providerSchema
  })
)
