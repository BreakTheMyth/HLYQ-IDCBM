import { lazy, Suspense, useMemo } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import { ProConfigProvider } from '@ant-design/pro-components'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAdminAuth } from './auth/AuthContext.ts'
import { AuthProvider } from './auth/AuthProvider.tsx'
import AppEmptyState from './components/AppEmptyState.tsx'
import AppLoading from './components/AppLoading.tsx'
import { adminPageRoutes } from './config/adminNavigation.tsx'
import AdminLayout from './layouts/AdminLayout.tsx'
import LoginPage from './pages/LoginPage.tsx'
import { createAppTheme, type AppThemeMode } from './theme.ts'
import { useThemeMode } from './hooks/useThemeMode.ts'

const AdminRoutePage = lazy(() => import('./pages/AdminRoutePage.tsx'))

interface AdminApplicationProps {
  themeMode: AppThemeMode
  onThemeModeChange: () => void
}

/**
 * 根据管理员认证状态切换登录页与后台主界面。
 * @param props 组件属性
 * @param props.themeMode 当前主题模式
 * @param props.onThemeModeChange 切换主题回调
 * @returns 当前认证状态对应的后台界面
 */
function AdminApplication({ themeMode, onThemeModeChange }: AdminApplicationProps) {
  const { status, user, logout } = useAdminAuth()
  const { message } = AntdApp.useApp()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '退出登录失败，请稍后重试')
    }
  }

  if (status === 'loading') return <AppLoading fullscreen />
  if (status === 'anonymous' || !user) return <LoginPage />

  return (
    <AdminLayout
      user={user}
      themeMode={themeMode}
      onThemeModeChange={onThemeModeChange}
      onLogout={handleLogout}
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
  )
}

function App() {
  const { themeMode, toggleThemeMode } = useThemeMode()
  const appTheme = useMemo(() => createAppTheme(themeMode), [themeMode])

  return (
    <ConfigProvider theme={appTheme} renderEmpty={() => <AppEmptyState />}>
      <ProConfigProvider hashed={false} dark={themeMode === 'dark'}>
        <AntdApp>
          <AuthProvider>
            <AdminApplication
              themeMode={themeMode}
              onThemeModeChange={toggleThemeMode}
            />
          </AuthProvider>
        </AntdApp>
      </ProConfigProvider>
    </ConfigProvider>
  )
}

export default App
