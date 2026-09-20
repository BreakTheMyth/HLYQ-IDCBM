import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type {
  MockCellValue,
  MockColumnDefinition,
  MockTablePageDefinition,
  MockTableRecord,
} from '../mock/adminMockData.ts'

interface MockTablePageProps {
  definition: MockTablePageDefinition
}

type StatusTone = 'success' | 'processing' | 'warning' | 'error' | 'default'

const successStatusPattern = /正常|成功|完成|销售中|生效中|展示|开启|通过|已发布|运行中|系统内置|已开票|已退款|已解决|当前使用/
const processingStatusPattern = /进行中|处理中|交付中|审核中|退款中|开票中|同步中|待配置|可更新/
const warningStatusPattern = /待|预警|维护|关注|等待|差异|草稿|补充|较高|紧急/
const errorStatusPattern = /失败|异常|驳回|拦截|冻结|关闭/

/** 根据业务状态文案映射 Ant Design 语义色。 */
function getStatusTone(status: string): StatusTone {
  if (errorStatusPattern.test(status)) return 'error'
  if (warningStatusPattern.test(status)) return 'warning'
  if (processingStatusPattern.test(status)) return 'processing'
  if (successStatusPattern.test(status)) return 'success'
  return 'default'
}

/** 将 Mock 原始值转成可搜索文本。 */
function valueToText(value: MockCellValue): string {
  return Array.isArray(value) ? value.join(' ') : String(value)
}

/** 渲染通用业务表格单元格。 */
function renderCell(value: MockCellValue, column: MockColumnDefinition) {
  if (column.kind === 'status') {
    const text = valueToText(value)
    return <Tag color={getStatusTone(text)}>{text}</Tag>
  }

  if (column.kind === 'money') {
    const amount = typeof value === 'number' ? value : Number(value)
    const formatted = Number.isFinite(amount)
      ? new Intl.NumberFormat('zh-CN', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount)
      : valueToText(value)
    return <span className="mock-number">{amount > 0 ? '¥' : amount < 0 ? '-¥' : '¥'}{String(formatted).replace('-', '')}</span>
  }

  if (column.kind === 'number') {
    return <span className="mock-number">{typeof value === 'number' ? value.toLocaleString('zh-CN') : valueToText(value)}</span>
  }

  if (column.kind === 'progress') {
    const percent = typeof value === 'number' ? value : Number(value)
    return <Progress percent={percent} size="small" showInfo strokeColor="var(--color-primary)" />
  }

  if (column.kind === 'tags') {
    const values = Array.isArray(value) ? value : [valueToText(value)]
    return <Space size={[4, 4]} wrap>{values.map((item) => <Tag key={item}>{item}</Tag>)}</Space>
  }

  const text = valueToText(value)
  return (
    <Tooltip title={text.length > 18 ? text : undefined}>
      <Typography.Text ellipsis>{text}</Typography.Text>
    </Tooltip>
  )
}

/** 展示带有 Mock 筛选、详情和编辑交互的通用业务表格页。 */
function MockTablePage({ definition }: MockTablePageProps) {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState<MockTableRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<MockTableRecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const statusColumn = definition.columns.find((column) => column.kind === 'status' && column.dataIndex === 'status')
    ?? definition.columns.find((column) => column.kind === 'status')
  const statusOptions = useMemo(() => {
    if (!statusColumn) return []
    return Array.from(new Set(definition.records.map((item) => valueToText(item[statusColumn.dataIndex]))))
      .map((item) => ({ label: item, value: item }))
  }, [definition.records, statusColumn])

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return definition.records.filter((item) => {
      const matchedKeyword = !normalizedKeyword || Object.values(item).some((value) => valueToText(value).toLowerCase().includes(normalizedKeyword))
      const rawStatus = statusColumn ? valueToText(item[statusColumn.dataIndex]) : ''
      const tone = getStatusTone(rawStatus)
      const matchedStatus = status === 'all' || rawStatus === status
      const matchedTab = activeTab === 'all'
        || (activeTab === 'enabled' && tone === 'success')
        || (activeTab === 'pending' && (tone === 'processing' || tone === 'warning'))
        || (activeTab === 'disabled' && (tone === 'default' || tone === 'error'))
      return matchedKeyword && matchedStatus && matchedTab
    })
  }, [activeTab, definition.records, keyword, status, statusColumn])

  const columns = useMemo<TableColumnsType<MockTableRecord>>(() => {
    const businessColumns: TableColumnsType<MockTableRecord> = definition.columns.map((column) => ({
      title: column.title,
      dataIndex: column.dataIndex,
      key: column.dataIndex,
      width: column.width,
      ellipsis: column.kind !== 'progress' && column.kind !== 'tags',
      render: (value: MockCellValue) => renderCell(value, column),
    }))

    return [
      ...businessColumns,
      {
        title: '操作',
        key: 'actions',
        width: 128,
        fixed: 'right',
        render: (_value: MockCellValue, item: MockTableRecord) => (
          <Space size={8} className="table-action-cell">
            <Button type="link" onClick={() => setSelectedRecord(item)}>详情</Button>
            <Button
              type="link"
              onClick={() => {
                setEditingRecord(item)
                form.setFieldsValue({ name: valueToText(item[definition.columns[0].dataIndex]), status: statusColumn ? valueToText(item[statusColumn.dataIndex]) : '正常' })
              }}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ]
  }, [definition.columns, form, statusColumn])

  const totalWidth = definition.columns.reduce((sum, column) => sum + column.width, 0) + 128
  const tabItems = definition.tabs.map((tab) => {
    const count = tab.key === 'all'
      ? definition.records.length
      : definition.records.filter((item) => {
        const tone = getStatusTone(statusColumn ? valueToText(item[statusColumn.dataIndex]) : '')
        if (tab.key === 'enabled') return tone === 'success'
        if (tab.key === 'pending') return tone === 'processing' || tone === 'warning'
        return tone === 'default' || tone === 'error'
      }).length

    return {
      key: tab.key,
      label: <span>{tab.label}<span className="ds-tab-count">{count}</span></span>,
    }
  })

  const openCreateModal = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: statusOptions[0]?.value ?? '正常' })
    setCreateOpen(true)
  }

  const closeEditor = () => {
    setCreateOpen(false)
    setEditingRecord(null)
    form.resetFields()
  }

  return (
    <section className="admin-business-page ds-page-shell" aria-label={definition.tableTitle}>
      <Card variant="borderless" className="mock-table-card ds-page-card ds-table-card-padded">
        <div className="mock-table-toolbar">
          <div className="mock-table-tabs">
            <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
          </div>
          <div className="mock-table-actions">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={definition.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {statusOptions.length ? (
              <Select
                value={status}
                options={[{ label: '全部状态', value: 'all' }, ...statusOptions]}
                onChange={setStatus}
              />
            ) : null}
            <Button type="primary" onClick={openCreateModal}>{definition.primaryAction}</Button>
          </div>
        </div>

        <Table<MockTableRecord>
          rowKey="key"
          columns={columns}
          dataSource={filteredRecords}
          tableLayout="fixed"
          scroll={{ x: totalWidth }}
          pagination={{ pageSize: 8, showSizeChanger: false, showQuickJumper: true }}
        />
      </Card>

      <Drawer
        size={520}
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`${definition.tableTitle}详情`}
        extra={<Button type="primary" onClick={() => setSelectedRecord(null)}>关闭</Button>}
      >
        {selectedRecord ? (
          <Descriptions
            bordered
            column={1}
            items={definition.columns.map((column) => ({
              key: column.dataIndex,
              label: column.title,
              children: renderCell(selectedRecord[column.dataIndex], column),
            }))}
          />
        ) : null}
      </Drawer>

      <Modal
        centered
        open={createOpen || Boolean(editingRecord)}
        title={editingRecord ? `编辑${definition.tableTitle}` : definition.primaryAction}
        onCancel={closeEditor}
        onOk={() => void form.validateFields().then(closeEditor)}
        okText="保存 Mock 数据"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" className="mock-editor-form">
          <Form.Item name="name" label={definition.columns[0].title} rules={[{ required: true, message: `请输入${definition.columns[0].title}` }]}>
            <Input placeholder={`请输入${definition.columns[0].title}`} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions.length ? statusOptions : [{ label: '正常', value: '正常' }]} />
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea rows={4} showCount maxLength={200} placeholder="这是前端设计演示，保存后不会写入后端数据" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}

export default MockTablePage
