import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Area, Column } from '@ant-design/charts'
import { StatisticCard } from '@ant-design/pro-components'
import { Button, Card, Progress, Space, Table, Tag, theme, type TableColumnsType } from 'antd'
import { useNavigate } from 'react-router-dom'

interface RecentOrder {
  key: string
  number: string
  customer: string
  product: string
  amount: string
  status: string
}

const orderTrendData = [
  { date: '09-08', type: '销售额', value: 18600 }, { date: '09-09', type: '销售额', value: 23600 },
  { date: '09-10', type: '销售额', value: 21800 }, { date: '09-11', type: '销售额', value: 28600 },
  { date: '09-12', type: '销售额', value: 32600 }, { date: '09-13', type: '销售额', value: 29800 },
  { date: '09-14', type: '销售额', value: 36800 },
]

const productSalesData = [
  { product: '云服务器', amount: 368 }, { product: '裸金属', amount: 186 }, { product: '服务器托管', amount: 142 },
  { product: 'SSL 证书', amount: 98 }, { product: '对象存储', amount: 76 },
]

const recentOrders: RecentOrder[] = [
  { key: '1', number: 'HLYQ202609140018', customer: '宁波星河网络', product: '通用型云服务器 S6', amount: '¥816.00', status: '已完成' },
  { key: '2', number: 'HLYQ202609140017', customer: '杭州云际科技', product: '高防裸金属 B2', amount: '¥1,299.00', status: '交付中' },
  { key: '3', number: 'HLYQ202609140016', customer: '上海矩阵互联', product: '企业型 SSL 证书', amount: '¥1,680.00', status: '待审核' },
  { key: '4', number: 'HLYQ202609130086', customer: '苏州启点数据', product: '标准机柜托管', amount: '¥3,600.00', status: '已关闭' },
]

/** 运营后台首页总览，使用 Mock 指标呈现经营与交付状态。 */
function OverviewPage() {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const statisticItems = [
    { key: 'sales', title: '今日销售额', value: 36820, prefix: '¥', icon: <WalletOutlined />, color: token.colorPrimary, background: token.colorPrimaryBg },
    { key: 'orders', title: '今日订单', value: 126, suffix: '单', icon: <ShoppingCartOutlined />, color: token.colorSuccess, background: token.colorSuccessBg },
    { key: 'customers', title: '新增客户', value: 38, suffix: '位', icon: <UserOutlined />, color: token.colorWarning, background: token.colorWarningBg },
    { key: 'delivery', title: '待交付服务', value: 16, suffix: '项', icon: <CloudServerOutlined />, color: token.colorError, background: token.colorErrorBg },
  ]
  const orderColumns: TableColumnsType<RecentOrder> = [
    { title: '订单号', dataIndex: 'number', width: 180, ellipsis: true },
    { title: '客户', dataIndex: 'customer', width: 140, ellipsis: true },
    { title: '产品', dataIndex: 'product', width: 190, ellipsis: true },
    { title: '金额', dataIndex: 'amount', width: 110 },
    { title: '状态', dataIndex: 'status', width: 100, render: (status: string) => <Tag color={status === '已完成' ? 'success' : status === '交付中' ? 'processing' : status === '待审核' ? 'warning' : 'default'}>{status}</Tag> },
  ]
  const quickActions = [
    { key: 'product', label: '创建产品', icon: <CloudServerOutlined />, path: '/products' },
    { key: 'order', label: '订单审核', icon: <ShoppingCartOutlined />, path: '/orders' },
    { key: 'customer', label: '客户管理', icon: <UserOutlined />, path: '/customers' },
    { key: 'ticket', label: '处理工单', icon: <CustomerServiceOutlined />, path: '/tickets' },
    { key: 'invoice', label: '发票审核', icon: <FileTextOutlined />, path: '/invoices' },
    { key: 'connector', label: '插件状态', icon: <ApiOutlined />, path: '/connectors' },
  ]

  return (
    <section className="admin-business-page overview-page ds-page-shell" aria-label="总览工作台">
      <Card variant="borderless" className="overview-welcome-card ds-page-card">
        <div>
          <div className="overview-welcome-title">早上好，超级管理员</div>
          <div className="overview-welcome-copy">今日有 16 项服务等待交付，3 笔退款需要审核，系统整体运行平稳。</div>
        </div>
        <div className="overview-health">
          <CheckCircleOutlined />
          <span>所有核心服务运行正常</span>
        </div>
      </Card>

      <div className="mock-statistic-grid">
        {statisticItems.map((item) => (
          <StatisticCard
            key={item.key}
            className="ds-statistic-card"
            statistic={{
              title: item.title,
              value: item.value,
              prefix: item.prefix,
              suffix: item.suffix,
              icon: <span className="mock-statistic-icon" style={{ color: item.color, background: item.background }}>{item.icon}</span>,
              description: <span className="mock-statistic-description">较昨日 <strong>+8.6%</strong></span>,
              styles: { content: { fontSize: 28, lineHeight: '36px', fontWeight: 600 } },
            }}
          />
        ))}
      </div>

      <div className="overview-main-grid">
        <Card variant="borderless" className="ds-page-card mock-chart-card">
          <div className="mock-card-heading">
            <div><strong>近 7 日销售趋势</strong><span>统计已支付订单金额</span></div>
            <Button type="link" onClick={() => navigate('/analysis')}>查看分析</Button>
          </div>
          <div className="mock-chart-media">
            <Area
              data={orderTrendData}
              xField="date"
              yField="value"
              height={280}
              axis={{ y: { labelFormatter: (value: number) => `¥${Math.round(value / 1000)}k` } }}
              style={{ fill: 'l(270) 0:rgba(22,93,255,0.08) 1:rgba(22,93,255,0.22)' }}
            />
          </div>
        </Card>

        <Card variant="borderless" className="ds-page-card mock-chart-card">
          <div className="mock-card-heading"><div><strong>产品销售排行</strong><span>本月成交订单数</span></div></div>
          <div className="mock-chart-media">
            <Column data={productSalesData} xField="product" yField="amount" height={280} colorField="product" legend={false} />
          </div>
        </Card>
      </div>

      <div className="overview-bottom-grid">
        <Card variant="borderless" className="ds-page-card overview-table-card">
          <div className="mock-card-heading">
            <div><strong>最近订单</strong><span>实时展示最新业务进展</span></div>
            <Button type="link" onClick={() => navigate('/orders')}>全部订单</Button>
          </div>
          <Table<RecentOrder> rowKey="key" columns={orderColumns} dataSource={recentOrders} pagination={false} scroll={{ x: 720 }} size="middle" />
        </Card>

        <Card variant="borderless" className="ds-page-card quick-actions-card">
          <div className="mock-card-heading"><div><strong>快捷操作</strong><span>常用业务入口</span></div></div>
          <div className="quick-action-grid">
            {quickActions.map((item) => (
              <button key={item.key} type="button" onClick={() => navigate(item.path)}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div className="overview-status-list">
            {[
              { label: '产品交付成功率', value: 98 },
              { label: '上游接口可用率', value: 96 },
              { label: '工单按时响应率', value: 92 },
            ].map((item) => (
              <div className="overview-status-item" key={item.label}>
                <Space orientation="vertical" size={4} className="overview-progress-row"><span>{item.label}</span><Progress percent={item.value} size="small" /></Space>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}

export default OverviewPage
