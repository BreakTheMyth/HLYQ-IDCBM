import { Area, Column, Pie } from '@ant-design/charts'
import { StatisticCard } from '@ant-design/pro-components'
import { CalendarOutlined, CloudServerOutlined, RiseOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Segmented, Space, Table, Tag, theme, type TableColumnsType } from 'antd'

interface ProductAnalysisRecord {
  key: string
  product: string
  orders: number
  revenue: string
  renewalRate: string
  growth: string
}

const trendData = ['09-08', '09-09', '09-10', '09-11', '09-12', '09-13', '09-14'].flatMap((date, index) => [
  { date, type: '销售额', value: [18.6, 23.6, 21.8, 28.6, 32.6, 29.8, 36.8][index] },
  { date, type: '成本', value: [12.8, 16.1, 14.9, 19.4, 21.6, 19.8, 24.2][index] },
])

const categoryData = [
  { type: '云服务器', value: 42 }, { type: '裸金属', value: 24 }, { type: 'IDC 服务', value: 18 },
  { type: '安全与证书', value: 10 }, { type: '存储', value: 6 },
]

const channelData = [
  { channel: '官网自助', value: 286 }, { channel: '渠道销售', value: 168 }, { channel: '客户续费', value: 136 }, { channel: '运营代客', value: 62 },
]

const productRows: ProductAnalysisRecord[] = [
  { key: '1', product: '通用型云服务器 S6', orders: 186, revenue: '¥126,860', renewalRate: '88.6%', growth: '+12.8%' },
  { key: '2', product: '高防裸金属 B2', orders: 86, revenue: '¥98,620', renewalRate: '92.1%', growth: '+8.2%' },
  { key: '3', product: '标准机柜托管', orders: 62, revenue: '¥86,400', renewalRate: '96.8%', growth: '+3.6%' },
  { key: '4', product: '企业型 SSL 证书', orders: 98, revenue: '¥52,680', renewalRate: '76.4%', growth: '-2.1%' },
]

/** 经营分析页，展示 Mock 趋势、结构与产品明细。 */
function AnalysisPage() {
  const { token } = theme.useToken()
  const columns: TableColumnsType<ProductAnalysisRecord> = [
    { title: '产品', dataIndex: 'product', width: 220, ellipsis: true },
    { title: '订单数', dataIndex: 'orders', width: 110 },
    { title: '销售额', dataIndex: 'revenue', width: 130 },
    { title: '续费率', dataIndex: 'renewalRate', width: 110 },
    { title: '环比增长', dataIndex: 'growth', width: 110, render: (value: string) => <Tag color={value.startsWith('+') ? 'success' : 'error'}>{value}</Tag> },
  ]

  return (
    <section className="admin-business-page analysis-page ds-page-shell" aria-label="经营分析">
      <Card variant="borderless" className="ds-search-panel analysis-filter-card">
        <Space wrap size={12}>
          <Segmented options={['近 7 日', '近 30 日', '本季度', '本年度']} defaultValue="近 7 日" />
          <DatePicker.RangePicker prefix={<CalendarOutlined />} />
          <Button type="primary">更新报表</Button>
        </Space>
        <span className="analysis-filter-note">Mock 数据更新于 2026-09-14 09:40</span>
      </Card>

      <div className="mock-statistic-grid">
        {[
          { title: '销售总额', value: 193680, prefix: '¥', icon: <RiseOutlined />, color: token.colorPrimary, background: token.colorPrimaryBg },
          { title: '有效订单', value: 652, suffix: '单', icon: <ShoppingCartOutlined />, color: token.colorSuccess, background: token.colorSuccessBg },
          { title: '付费客户', value: 286, suffix: '位', icon: <UserOutlined />, color: token.colorWarning, background: token.colorWarningBg },
          { title: '在服实例', value: 1862, suffix: '个', icon: <CloudServerOutlined />, color: token.colorInfo, background: token.colorInfoBg },
        ].map((item) => (
          <StatisticCard key={item.title} className="ds-statistic-card" statistic={{
            ...item,
            icon: <span className="mock-statistic-icon" style={{ color: item.color, background: item.background }}>{item.icon}</span>,
            description: <span className="mock-statistic-description">环比上期 <strong>+8.6%</strong></span>,
            styles: { content: { fontSize: 28, lineHeight: '36px', fontWeight: 600 } },
          }} />
        ))}
      </div>

      <Card variant="borderless" className="ds-page-card mock-chart-card analysis-main-chart">
        <div className="mock-card-heading"><div><strong>销售与成本趋势</strong><span>单位：千元，按支付完成时间统计</span></div></div>
        <div className="mock-chart-media"><Area data={trendData} xField="date" yField="value" colorField="type" height={320} /></div>
      </Card>

      <div className="analysis-chart-grid">
        <Card variant="borderless" className="ds-page-card mock-chart-card">
          <div className="mock-card-heading"><div><strong>产品收入构成</strong><span>按产品大类统计</span></div></div>
          <div className="mock-chart-media"><Pie data={categoryData} angleField="value" colorField="type" innerRadius={0.62} height={260} /></div>
        </Card>
        <Card variant="borderless" className="ds-page-card mock-chart-card">
          <div className="mock-card-heading"><div><strong>订单渠道分布</strong><span>近 7 日有效订单</span></div></div>
          <div className="mock-chart-media"><Column data={channelData} xField="channel" yField="value" height={260} colorField="channel" legend={false} /></div>
        </Card>
      </div>

      <Card variant="borderless" className="ds-page-card ds-table-card-padded analysis-table-card">
        <div className="mock-card-heading"><div><strong>产品经营明细</strong><span>按销售额从高到低排列</span></div><Button>导出 Mock 报表</Button></div>
        <Table<ProductAnalysisRecord> rowKey="key" columns={columns} dataSource={productRows} pagination={false} scroll={{ x: 720 }} />
      </Card>
    </section>
  )
}

export default AnalysisPage
