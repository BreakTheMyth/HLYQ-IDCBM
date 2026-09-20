import { lazy } from 'react'
import type { AdminPageRoute } from '../config/adminNavigation.tsx'
import { applicationMarketItems, mockTablePageDefinitions, themeCatalogItems } from '../mock/adminMockData.ts'
import './AdminPages.css'

const AnalysisPage = lazy(() => import('./AnalysisPage.tsx'))
const CatalogPage = lazy(() => import('./CatalogPage.tsx'))
const MockTablePage = lazy(() => import('./MockTablePage.tsx'))
const OverviewPage = lazy(() => import('./OverviewPage.tsx'))
const SettingsPage = lazy(() => import('./SettingsPage.tsx'))
const TaskCenterPage = lazy(() => import('./TaskCenterPage.tsx'))

interface AdminRoutePageProps {
  route: AdminPageRoute
}

/** 根据菜单路由装配对应的 Mock 业务页面。 */
function AdminRoutePage({ route }: AdminRoutePageProps) {
  if (route.key === 'dashboard') return <OverviewPage />
  if (route.key === 'analysis') return <AnalysisPage />
  if (route.key === 'tasks') return <TaskCenterPage />
  if (route.key === 'website') return <CatalogPage mode="themes" items={themeCatalogItems} />
  if (route.key === 'application-market') return <CatalogPage mode="market" items={applicationMarketItems} />
  if (route.key === 'settings') return <SettingsPage />

  const definition = mockTablePageDefinitions[route.key]
  if (definition) return <MockTablePage definition={definition} />

  return null
}

export default AdminRoutePage
