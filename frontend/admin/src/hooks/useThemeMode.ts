import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { applyThemeMode, getInitialThemeMode, type AppThemeMode } from '../theme.ts'

/**
 * 同步组件与页面主题，使用短暂的整页淡入淡出避免分区闪烁。
 * @returns 当前主题和切换方法；减少动态效果或不支持视图过渡时直接切换
 */
export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<AppThemeMode>(getInitialThemeMode)
  const requestedMode = useRef(themeMode)
  const revision = useRef(0)
  const activeTransition = useRef<ViewTransition | null>(null)

  useLayoutEffect(() => {
    // 在浏览器绘制前同步 CSS 变量、原生控件配色和 Ant Design 主题。
    applyThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => () => {
    revision.current += 1
    activeTransition.current?.skipTransition()
    delete document.documentElement.dataset.themeTransition
  }, [])

  const toggleThemeMode = () => {
    const nextMode = requestedMode.current === 'light' ? 'dark' : 'light'
    requestedMode.current = nextMode
    const currentRevision = ++revision.current
    activeTransition.current?.skipTransition()
    activeTransition.current = null
    delete document.documentElement.dataset.themeTransition

    const updateTheme = () => {
      // 连续点击或卸载后，旧过渡回调不得覆盖最新选择。
      if (currentRevision !== revision.current) return
      flushSync(() => setThemeMode(nextMode))
    }

    if (!document.startViewTransition
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateTheme()
      return
    }

    document.documentElement.dataset.themeTransition = 'active'
    try {
      const transition = document.startViewTransition(updateTheme)
      activeTransition.current = transition
      // 页面隐藏或快速切换可能跳过动画，但不影响主题更新。
      void transition.ready.catch(() => undefined)
      const cleanup = () => {
        if (activeTransition.current !== transition) return
        activeTransition.current = null
        delete document.documentElement.dataset.themeTransition
      }
      void transition.finished.then(cleanup, cleanup)
    } catch {
      delete document.documentElement.dataset.themeTransition
      updateTheme()
    }
  }

  return { themeMode, toggleThemeMode }
}
