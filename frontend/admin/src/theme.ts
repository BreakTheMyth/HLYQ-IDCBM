import { theme, type ThemeConfig } from 'antd'

const borderRadius = 2
const fontFamily = [
  'AlibabaSans',
  '-apple-system',
  'BlinkMacSystemFont',
  "'Segoe UI'",
  'Roboto',
  "'Helvetica Neue'",
  'Arial',
  "'Noto Sans'",
  'sans-serif',
  "'Apple Color Emoji'",
  "'Segoe UI Emoji'",
  "'Segoe UI Symbol'",
  "'Noto Color Emoji'",
].join(', ')
const themeStorageKey = 'hlyq-admin-theme'

export type AppThemeMode = 'light' | 'dark'

/** 后台布局专用实色配色，不影响业务组件的默认主题。 */
export const adminLayoutPalettes = {
  light: {
    canvas: '#F6F7F9',
    surface: '#FFFFFF',
    hover: '#F3F4F6',
    selected: '#EDF3FF',
    selectedText: '#165DFF',
    text: '#525866',
    heading: '#202632',
    muted: '#8A919F',
    border: '#E9ECF1',
  },
  dark: {
    canvas: '#11151C',
    surface: '#191F29',
    hover: '#232B38',
    selected: '#213452',
    selectedText: '#85ADFF',
    text: '#BCC4D1',
    heading: '#E8EDF5',
    muted: '#7E8A9D',
    border: '#2A3342',
  },
} satisfies Record<AppThemeMode, Record<string, string>>

/**
 * 顶栏继承当前明暗主题，使用文字强调当前业务入口。
 * @param mode 当前主题模式
 * @returns 顶栏组件公开令牌配置
 */
export function createAdminHeaderTheme(mode: AppThemeMode): ThemeConfig {
  const palette = adminLayoutPalettes[mode]
  return {
    components: {
      Menu: {
        itemBg: palette.surface,
        itemColor: palette.text,
        itemSelectedColor: palette.selectedText,
        horizontalItemHoverColor: palette.text,
        horizontalItemHoverBg: palette.hover,
        horizontalItemSelectedColor: palette.selectedText,
        horizontalItemSelectedBg: 'transparent',
        activeBarHeight: 0,
        activeBarBorderWidth: 0,
        itemPaddingInline: 14,
      },
      Button: { textTextColor: palette.text, textTextHoverColor: palette.text, textHoverBg: palette.hover },
      Avatar: { colorTextPlaceholder: palette.selected, colorTextLightSolid: palette.selectedText },
    },
  }
}

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
      fontFamily,
      borderRadius,
      borderRadiusLG: borderRadius,
      borderRadiusSM: borderRadius,
      borderRadiusXS: borderRadius,
      borderRadiusOuter: borderRadius,
    },
  }
}
