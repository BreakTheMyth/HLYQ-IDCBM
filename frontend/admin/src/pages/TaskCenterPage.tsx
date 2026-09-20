import { CheckCircleOutlined, ClockCircleOutlined, CustomerServiceOutlined, ShoppingCartOutlined, WarningOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Checkbox, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import AppEmptyState from '../components/AppEmptyState.tsx'

interface MockTask {
  key: string
  title: string
  description: string
  module: string
  deadline: string
  owner: string
  priority: '紧急' | '较高' | '普通'
  completed: boolean
}

const initialTasks: MockTask[] = [
  { key: 'task-1', title: '审核退款申请 RF202609140008', description: '客户申请退回云服务器剩余周期费用，需核对交付与使用记录。', module: '退款审核', deadline: '今天 10:30', owner: '周远', priority: '紧急', completed: false },
  { key: 'task-2', title: '处理工单 TK202609140032', description: '客户反馈安全组端口无法访问，已上传连通性测试结果。', module: '客户工单', deadline: '今天 11:00', owner: '林嘉', priority: '较高', completed: false },
  { key: 'task-3', title: '核对华东云资源中心结算单', description: '8 月账期存在 3 笔价格差异，需要与上游账单进行复核。', module: '财务结算', deadline: '今天 16:00', owner: '财务小周', priority: '较高', completed: false },
  { key: 'task-4', title: '发布网络维护公告', description: '华东二区计划于周三凌晨升级核心网络，请确认影响客户范围。', module: '公告发布', deadline: '明天 09:00', owner: '陈清', priority: '普通', completed: false },
  { key: 'task-5', title: '完成企业实名认证复核', description: '工商信息与提交材料一致，已完成最终审核。', module: '实名认证', deadline: '昨天 15:30', owner: '周远', priority: '普通', completed: true },
]

/** 待办事项页，演示本地 Mock 任务筛选与完成交互。 */
function TaskCenterPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('待处理')
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === '全部' || (filter === '已完成' ? task.completed : !task.completed)), [filter, tasks])
  const pendingCount = tasks.filter((task) => !task.completed).length

  return (
    <section className="admin-business-page task-center-page ds-page-shell" aria-label="待办事项">
      <div className="task-summary-grid">
        <Card variant="borderless" className="ds-page-card task-summary-card"><ClockCircleOutlined /><div><strong>{pendingCount}</strong><span>待处理事项</span></div></Card>
        <Card variant="borderless" className="ds-page-card task-summary-card warning"><WarningOutlined /><div><strong>1</strong><span>即将超时</span></div></Card>
        <Card variant="borderless" className="ds-page-card task-summary-card success"><CheckCircleOutlined /><div><strong>12</strong><span>今日已完成</span></div></Card>
      </div>

      <Card variant="borderless" className="ds-list-card task-list-card">
        <div className="task-list-toolbar">
          <div><Typography.Text strong>我的待办</Typography.Text><Typography.Text type="secondary">点击勾选可在本地切换完成状态</Typography.Text></div>
          <Segmented options={['待处理', '已完成', '全部']} value={filter} onChange={setFilter} />
        </div>
        <div className="task-list-content">
          {visibleTasks.length ? visibleTasks.map((task) => (
            <div className="task-list-item" key={task.key}>
              <Checkbox
                checked={task.completed}
                onChange={(event) => setTasks((current) => current.map((item) => item.key === task.key ? { ...item, completed: event.target.checked } : item))}
                aria-label={`标记${task.title}为${task.completed ? '未完成' : '已完成'}`}
              />
              <Avatar icon={task.module === '客户工单' ? <CustomerServiceOutlined /> : <ShoppingCartOutlined />} />
              <div className="task-item-main">
                <Space wrap size={8}><span className={task.completed ? 'task-completed' : ''}>{task.title}</span><Tag color={task.priority === '紧急' ? 'error' : task.priority === '较高' ? 'warning' : 'default'}>{task.priority}</Tag></Space>
                <div className="task-description"><span>{task.description}</span><Space wrap size={16}><span>{task.module}</span><span>负责人：{task.owner}</span><span>截止：{task.deadline}</span></Space></div>
              </div>
              <Button type="link">查看详情</Button>
            </div>
          )) : <AppEmptyState className="task-list-empty" description="当前分类暂无待办事项" />}
        </div>
      </Card>
    </section>
  )
}

export default TaskCenterPage
