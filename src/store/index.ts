import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { eventApi } from '../services/eventApi'

export const store = configureStore({
  reducer: {
    [eventApi.reducerPath]: eventApi.reducer
  },
  middleware: getDefaultMiddleware => {
    return getDefaultMiddleware().concat(eventApi.middleware)
  }
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
