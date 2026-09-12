import { StrictMode } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppBootstrap from './AppBootstrap.tsx'
import { applyThemeMode, createAppTheme, getInitialThemeMode } from './theme.ts'
import './styles/global-style.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
})

/**
 * 获取当前后台运行路径，兼容 Vite 开发地址和线上自定义后台路径。
 * @returns BrowserRouter 使用的基础路径
 */
function getAdminBasePath(): string {
  const assetBasePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'

  if (currentPath === assetBasePath || currentPath.startsWith(`${assetBasePath}/`)) {
    return assetBasePath
  }

  const firstPathSegment = currentPath.split('/').filter(Boolean)[0]
  return firstPathSegment ? `/${firstPathSegment}` : '/'
}

const adminBasePath = getAdminBasePath()
const initialThemeMode = getInitialThemeMode()

applyThemeMode(initialThemeMode)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={createAppTheme(initialThemeMode)}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={adminBasePath}>
          <AppBootstrap />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
