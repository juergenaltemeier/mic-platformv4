import './App.css'
import './base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { Dashboard } from './pages/Dashboard'
import Renamer from './pages/Renamer';

import { SettingsPage } from './pages/Settings'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      }
    ],
  },
  {
    path: '/programs/renamer',
    element: <App />,
    children: [
      {
        index: true,
        element: <Renamer />,
      },
    ],
  },
])

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)

