import { theme, type ThemeConfig } from 'antd'

const borderRadius = 2
const themeStorageKey = 'hlyq-admin-theme'

export type AppThemeMode = 'light' | 'dark'

/**
 * 获取后台初始主题，优先使用本地选择，其次跟随系统设置。
 * @returns 初始明暗主题模式
 */
export function getInitialThemeMode(): AppThemeMode {
  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  } catch {
    // 浏览器禁用本地存储时仍可正常使用主题切换。
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 持久化后台主题并同步浏览器原生配色提示。
 * @param mode 当前明暗主题模式
 * @returns 无返回值
 */
export function applyThemeMode(mode: AppThemeMode): void {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode

  try {
    window.localStorage.setItem(themeStorageKey, mode)
  } catch {
    // 本地存储不可用只影响偏好持久化，不阻断当前主题。
  }
}

/**
 * 创建运营后台 Ant Design 主题配置。
 * @param mode 当前明暗主题模式
 * @returns 保持品牌色与 2px 圆角约束的主题配置
 */
export function createAppTheme(mode: AppThemeMode): ThemeConfig {
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#165DFF',
      borderRadius,
      borderRadiusLG: borderRadius,
      borderRadiusSM: borderRadius,
      borderRadiusXS: borderRadius,
      borderRadiusOuter: borderRadius,
    },
  }
}
