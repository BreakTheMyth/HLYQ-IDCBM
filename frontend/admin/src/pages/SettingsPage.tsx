import {
  ProForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import { Alert, Button, Card, Space, Tabs, Typography } from 'antd'
import { useEffect, useState } from 'react'

const settingTabs = [
  { key: 'base', label: '基本设置' },
  { key: 'security', label: '安全策略' },
  { key: 'order', label: '订单设置' },
  { key: 'notification', label: '通知设置' },
]

/** 系统设置页，使用前端初始值演示分组配置表单。 */
function SettingsPage() {
  const [activeTab, setActiveTab] = useState('base')
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 768px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event: MediaQueryListEvent) => setIsCompact(event.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const renderFields = () => {
    if (activeTab === 'security') {
      return (
        <>
          <div className="settings-form-grid">
            <ProFormDigit name="session_expire" label="后台会话有效期" width="md" min={15} max={1440} fieldProps={{ addonAfter: '分钟' }} />
            <ProFormDigit name="login_attempts" label="允许连续登录失败" width="md" min={3} max={20} fieldProps={{ addonAfter: '次' }} />
          </div>
          <div className="settings-form-grid">
            <ProFormSwitch name="login_ip_protection" label="异地登录保护" />
            <ProFormSwitch name="operation_confirmation" label="高风险操作二次确认" />
          </div>
          <ProFormTextArea name="admin_ip_whitelist" label="后台 IP 白名单" width="xl" rows={4} placeholder="每行填写一个 IP 或 CIDR，留空表示不限制" />
        </>
      )
    }

    if (activeTab === 'order') {
      return (
        <>
          <div className="settings-form-grid">
            <ProFormDigit name="unpaid_order_expire" label="未支付订单关闭时间" width="md" min={5} max={1440} fieldProps={{ addonAfter: '分钟' }} />
            <ProFormSelect name="default_currency" label="默认交易币种" width="md" options={[{ label: '人民币 CNY', value: 'CNY' }, { label: '美元 USD', value: 'USD' }]} />
          </div>
          <div className="settings-form-grid">
            <ProFormSwitch name="auto_delivery" label="支付后自动交付" />
            <ProFormSwitch name="allow_cart" label="启用购物车" />
          </div>
          <ProFormRadio.Group name="refund_strategy" label="默认退款策略" options={[{ label: '人工审核', value: 'manual' }, { label: '规则内自动通过', value: 'automatic' }]} />
        </>
      )
    }

    if (activeTab === 'notification') {
      return (
        <>
          <div className="settings-form-grid">
            <ProFormSelect name="default_sms_channel" label="默认短信通道" width="md" options={[{ label: '阿里云短信', value: 'aliyun' }, { label: '腾讯云短信', value: 'tencent' }]} />
            <ProFormSelect name="default_email_channel" label="默认邮件通道" width="md" options={[{ label: '企业邮件网关', value: 'mail_gateway' }, { label: '本地 SMTP', value: 'smtp' }]} />
          </div>
          <div className="settings-form-grid settings-switch-grid">
            <ProFormSwitch name="notify_order" label="订单状态通知" />
            <ProFormSwitch name="notify_ticket" label="工单进度通知" />
            <ProFormSwitch name="notify_expire" label="服务到期通知" />
          </div>
          <ProFormDigit name="expire_notice_days" label="到期提醒提前天数" width="md" min={1} max={90} fieldProps={{ addonAfter: '天' }} />
        </>
      )
    }

    return (
      <>
        <div className="settings-form-grid">
          <ProFormText name="site_name" label="网站名称" width="md" rules={[{ required: true, message: '请输入网站名称' }]} />
          <ProFormText name="site_url" label="网站地址" width="md" rules={[{ required: true, type: 'url', message: '请输入有效网站地址' }]} />
        </div>
        <div className="settings-form-grid">
          <ProFormSelect name="timezone" label="系统时区" width="md" options={[{ label: 'Asia/Shanghai', value: 'Asia/Shanghai' }, { label: 'UTC', value: 'UTC' }]} />
          <ProFormSelect name="language" label="默认语言" width="md" options={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]} />
        </div>
        <ProFormTextArea name="copyright" label="页脚版权信息" width="xl" rows={3} showCount maxLength={200} />
      </>
    )
  }

  return (
    <section className="admin-business-page settings-page ds-page-shell" aria-label="系统设置">
      <Alert type="info" showIcon title="当前为前端 Mock 配置，保存操作不会写入服务器。" />
      <Card variant="borderless" className="ds-page-card ds-form-panel settings-form-card">
        <Tabs items={settingTabs} activeKey={activeTab} onChange={setActiveTab} tabPlacement={isCompact ? 'top' : 'start'} />
        <div className="settings-form-content">
          <Typography.Title level={4}>{settingTabs.find((tab) => tab.key === activeTab)?.label}</Typography.Title>
          <Typography.Paragraph type="secondary">修改系统运行时的默认行为和运营策略。</Typography.Paragraph>
          <ProForm
            key={activeTab}
            layout="vertical"
            initialValues={{
              site_name: '皓量云擎业务管理系统', site_url: 'https://cloud.example.com', timezone: 'Asia/Shanghai', language: 'zh-CN',
              copyright: '© 2026 宁波皓量云擎网络科技有限公司', session_expire: 120, login_attempts: 5,
              login_ip_protection: true, operation_confirmation: true, unpaid_order_expire: 30, default_currency: 'CNY',
              auto_delivery: true, allow_cart: true, refund_strategy: 'manual', default_sms_channel: 'aliyun',
              default_email_channel: 'mail_gateway', notify_order: true, notify_ticket: true, notify_expire: true, expire_notice_days: 7,
            }}
            submitter={{
              render: (props) => (
                <Space size={8}>
                  <Button onClick={() => props.form?.resetFields()}>重置</Button>
                  <Button type="primary" onClick={() => props.form?.submit()}>保存 Mock 配置</Button>
                </Space>
              ),
            }}
            onFinish={() => Promise.resolve(true)}
          >
            <div className="settings-form-section">{renderFields()}</div>
          </ProForm>
        </div>
      </Card>
    </section>
  )
}

export default SettingsPage
