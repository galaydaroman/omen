import { RouterProvider } from 'react-router/dom'
import router from './router'
import ThemeProvider from '@/components/providers/ThemeProvider'
import './App.css'

export default function App() {
  return <>
    <ThemeProvider storageKey="omen-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </>
}
