import { Navigate, createBrowserRouter } from 'react-router-dom'

import { RequireAdmin } from '@/components/RequireAdmin'
import { RequireAuth } from '@/components/RequireAuth'
import { AdminLayout } from '@/layout/AdminLayout'
import { AppShellLayout } from '@/layout/AppShellLayout'
import { ClientSetupPage } from '@/pages/ClientSetupPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { HomePage } from '@/pages/HomePage'
import { MyClientPage } from '@/pages/MyClientPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminClientDetailPage } from '@/pages/admin/AdminClientDetailPage'
import { AdminClientsPage } from '@/pages/admin/AdminClientsPage'
import { AdminConfigPage } from '@/pages/admin/AdminConfigPage'
import { AdminLogPage } from '@/pages/admin/AdminLogPage'
import { AdminStatusPage } from '@/pages/admin/AdminStatusPage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      children: [
        {
          element: (
            <RequireAuth>
              <AppShellLayout />
            </RequireAuth>
          ),
          children: [
            { index: true, element: <HomePage /> },
            { path: 'client-setup', element: <ClientSetupPage /> },
            { path: 'my-client', element: <MyClientPage /> },
            {
              path: 'admin',
              element: (
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              ),
              children: [
                { index: true, element: <Navigate to="status" replace /> },
                { path: 'status', element: <AdminStatusPage /> },
                { path: 'log', element: <AdminLogPage /> },
                { path: 'config', element: <AdminConfigPage /> },
                { path: 'clients', element: <AdminClientsPage /> },
                { path: 'clients/:clientId', element: <AdminClientDetailPage /> },
              ],
            },
          ],
        },
        { path: 'forbidden', element: <ForbiddenPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
)
