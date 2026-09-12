import { Empty, Typography, type EmptyProps } from 'antd'
import emptyStateImage from '../assets/empty-state.png'
import './AppEmptyState.css'

/** 运营后台统一空状态属性。 */
export type AppEmptyStateProps = Omit<EmptyProps, 'image' | 'imageStyle'>

/**
 * 展示运营后台统一空状态。
 * @param props Ant Design 空状态属性
 * @returns 使用项目空状态图片的 Empty 组件
 */
function AppEmptyState({ className, description = '暂无数据', ...props }: AppEmptyStateProps) {
  const mergedClassName = ['app-empty-state', className].filter(Boolean).join(' ')
  const renderedDescription = typeof description === 'string'
    ? <Typography.Text type="secondary">{description}</Typography.Text>
    : description

  return (
    <Empty
      {...props}
      className={mergedClassName}
      image={emptyStateImage}
      description={renderedDescription}
    />
  )
}

export default AppEmptyState
