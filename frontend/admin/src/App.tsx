import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ConfigProvider } from 'antd'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppEmptyState from './components/AppEmptyState.tsx'
import AppLoading from './components/AppLoading.tsx'
import { adminPageRoutes } from './config/adminNavigation.tsx'
import AdminLayout from './layouts/AdminLayout.tsx'
import { applyThemeMode, createAppTheme, getInitialThemeMode, type AppThemeMode } from './theme.ts'

const AdminRoutePage = lazy(() => import('./pages/AdminRoutePage.tsx'))

function App() {
  const [themeMode, setThemeMode] = useState<AppThemeMode>(getInitialThemeMode)
  const appTheme = useMemo(() => createAppTheme(themeMode), [themeMode])

  useEffect(() => {
    applyThemeMode(themeMode)
  }, [themeMode])

  return (
    <ConfigProvider theme={appTheme} renderEmpty={() => <AppEmptyState />}>
      <AdminLayout
        themeMode={themeMode}
        onThemeModeChange={() => setThemeMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light'))}
      >
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {adminPageRoutes.map((route) => (
              <Route
                key={route.key}
                path={route.path}
                element={<AdminRoutePage route={route} />}
              />
            ))}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </ConfigProvider>
  )
}

export default App
