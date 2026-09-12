import { Spin, Typography } from 'antd'
import './AppLoading.css'

/** 运营后台统一加载状态属性。 */
export interface AppLoadingProps {
  /** 是否占满整个浏览器视口。 */
  fullscreen?: boolean
  /** 加载状态提示文字。 */
  message?: string
}

/**
 * 展示运营后台统一加载动画。
 * @param props 加载状态属性
 * @returns 可用于全屏或主内容区的加载状态
 */
function AppLoading({ fullscreen = false, message = '正在加载...' }: AppLoadingProps) {
  return (
    <div
      className={`app-loading ${fullscreen ? 'app-loading-fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Spin size="large" />
      <Typography.Text type="secondary" className="app-loading-message">
        {message}
      </Typography.Text>
    </div>
  )
}

export default AppLoading
