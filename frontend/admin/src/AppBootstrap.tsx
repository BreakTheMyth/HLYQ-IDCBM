import { lazy, Suspense } from 'react'
import AppLoading from './components/AppLoading.tsx'

const App = lazy(() => import('./App.tsx'))

/**
 * 为运营后台主应用提供首屏代码加载兜底。
 * @returns 带全屏加载状态的异步主应用
 */
function AppBootstrap() {
  return (
    <Suspense fallback={<AppLoading fullscreen />}>
      <App />
    </Suspense>
  )
}

export default AppBootstrap
