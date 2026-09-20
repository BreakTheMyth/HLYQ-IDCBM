import { AppstoreOutlined, CheckCircleFilled, CloudOutlined, CodeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import AppEmptyState from '../components/AppEmptyState.tsx'
import type { MockCatalogItem } from '../mock/adminMockData.ts'

interface CatalogPageProps {
  mode: 'themes' | 'market'
  items: MockCatalogItem[]
}

/** 展示官网主题或应用市场的 Mock 卡片目录。 */
function CatalogPage({ mode, items }: CatalogPageProps) {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('全部')
  const categories = useMemo(() => ['全部', ...Array.from(new Set(items.map((item) => item.category)))], [items])
  const filteredItems = useMemo(() => items.filter((item) => {
    const matchedCategory = category === '全部' || item.category === category
    const normalizedKeyword = keyword.trim().toLowerCase()
    const matchedKeyword = !normalizedKeyword || `${item.name}${item.description}${item.category}`.toLowerCase().includes(normalizedKeyword)
    return matchedCategory && matchedKeyword
  }), [category, items, keyword])

  return (
    <section className="admin-business-page catalog-page ds-page-shell" aria-label={mode === 'themes' ? '官网与主题' : '应用市场'}>
      {mode === 'themes' ? (
        <Card variant="borderless" className="ds-page-card current-theme-card">
          <div className="current-theme-preview accent-blue"><CloudOutlined /></div>
          <div className="current-theme-copy">
            <Space size={8} wrap><Typography.Title level={4}>星海云计算</Typography.Title><Tag color="success" icon={<CheckCircleFilled />}>当前使用</Tag></Space>
            <Typography.Paragraph type="secondary">当前官网主题已启用，适用于综合云计算与 IDC 产品展示。可在主题设置中维护首页模块、品牌信息和导航结构。</Typography.Paragraph>
            <Space wrap><Button type="primary">自定义主题</Button><Button>预览官网</Button><Button>导出配置</Button></Space>
          </div>
          <div className="current-theme-meta"><span>版本</span><strong>v1.3.0</strong><span>最后更新</span><strong>2026-09-12</strong></div>
        </Card>
      ) : (
        <Card variant="borderless" className="ds-page-card market-hero-card">
          <div><Tag color="processing">应用生态</Tag><Typography.Title level={3}>扩展你的业务能力</Typography.Title><Typography.Paragraph type="secondary">安装产品、支付、短信、实名认证、邮件和存储等应用，所有条目均为前端 Mock 展示。</Typography.Paragraph></div>
          <AppstoreOutlined />
        </Card>
      )}

      <Card variant="borderless" className="ds-search-panel catalog-filter-card">
        <Input allowClear prefix={<SearchOutlined />} placeholder={mode === 'themes' ? '搜索主题名称或特性' : '搜索应用名称、能力或开发者'} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <Segmented options={categories} value={category} onChange={setCategory} />
      </Card>

      <div className="catalog-grid">
        {filteredItems.length ? filteredItems.map((item) => (
          <Card key={item.key} variant="outlined" className="catalog-item-card">
            <div className={`catalog-item-cover accent-${item.accent}`}>
              {mode === 'themes' ? <CloudOutlined /> : <CodeOutlined />}
              <span>{item.category}</span>
            </div>
            <div className="catalog-item-content">
              <div className="catalog-item-title"><Typography.Title level={5}>{item.name}</Typography.Title><Tag color={item.status === '当前使用' || item.status === '已安装' ? 'success' : item.status === '可更新' ? 'warning' : 'default'}>{item.status}</Tag></div>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>{item.description}</Typography.Paragraph>
              <div className="catalog-item-meta"><span>{item.version}</span><span>{item.meta}</span></div>
              <div className="catalog-item-actions">
                <Button type={item.status === '当前使用' || item.status === '已安装' ? 'default' : 'primary'}>{item.status === '当前使用' ? '管理' : item.status === '已安装' ? '配置' : item.status === '可更新' ? '更新' : '安装'}</Button>
                <Button type="link">查看详情</Button>
              </div>
            </div>
          </Card>
        )) : <AppEmptyState className="catalog-empty-state" description="没有找到匹配的内容" />}
      </div>
    </section>
  )
}

export default CatalogPage
