import { Card } from 'antd'
import AppEmptyState from '../components/AppEmptyState.tsx'
import './PlaceholderPage.css'

interface PlaceholderPageProps {
  title: string
}

/**
 * 展示尚未开发业务模块的统一占位页面。
 * @param props 页面属性
 * @param props.title 当前页面标题
 * @returns 建设中的占位内容
 */
function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page" aria-label={title}>
      <Card className="placeholder-page-card">
        <AppEmptyState description="功能页面正在建设中" />
      </Card>
    </section>
  )
}

export default PlaceholderPage
