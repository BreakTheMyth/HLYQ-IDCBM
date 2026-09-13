import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from 'antd/es/locale'
import {
  executePhase,
  loadBootstrap,
  loadRandomDefaults,
  testConnections,
} from './api'
import type {
  BootstrapData,
  ConnectionResult,
  FinalResult,
  InstallationConfiguration,
  InstallPhase,
} from './types'

type PhaseStatus = 'wait' | 'process' | 'finish' | 'error'

interface PhaseItem {
  key: InstallPhase
  title: string
  description: string
  status: PhaseStatus
}

const phaseDefinitions: Array<Omit<PhaseItem, 'status'>> = [
  { key: 'database', title: '初始化数据库', description: '验证连接并创建基础表结构' },
  { key: 'system', title: '写入系统数据', description: '保存网站配置并创建管理员账号' },
  { key: 'configuration', title: '生成运行配置', description: '原子写入 .env 配置文件' },
  { key: 'finalize', title: '完成安装', description: '写入安装标记并刷新运行配置' },
]

/**
 * 使用后端本地加载的 Ant Design 运行时创建在线安装器应用。
 *
 * @param antd Ant Design 运行时导出对象。
 * @param locale 安装器使用的本地化配置。
 * @returns 可直接挂载的 React 安装器组件。
 */
export function createInstallerApp(antd: typeof import('antd'), locale?: Locale) {
  const {
    Alert,
    App: AntApp,
    Button,
    Card,
    Checkbox,
    Col,
    ConfigProvider,
    Descriptions,
    Divider,
    Flex,
    Form,
    Input,
    InputNumber,
    List,
    Progress,
    Result,
    Row,
    Space,
    Steps,
    Tag,
    Typography,
  } = antd
  const { Paragraph, Text, Title } = Typography

  function InstallerContent() {
    const [form] = Form.useForm<InstallationConfiguration>()
    const stepsScrollRef = useRef<HTMLDivElement>(null)
    const { message } = AntApp.useApp()
    const [current, setCurrent] = useState(0)
    const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
    const [bootError, setBootError] = useState('')
    const [loading, setLoading] = useState(true)
    const [testing, setTesting] = useState(false)
    const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null)
    const [progress, setProgress] = useState(0)
    const [installError, setInstallError] = useState('')
    const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
    const [phases, setPhases] = useState<PhaseItem[]>(
      phaseDefinitions.map((phase) => ({ ...phase, status: 'wait' })),
    )
    const agreementAgreed = Form.useWatch('agreement_agreed', form) ?? false

    const stepItems = useMemo(
      () => [
        { title: '使用协议' },
        { title: '环境检测' },
        { title: '数据库配置' },
        { title: '系统配置' },
        { title: '执行安装' },
        { title: '安装结果' },
      ],
      [],
    )

    useEffect(() => {
      void initialize()
    }, [])

    useEffect(() => {
      const container = stepsScrollRef.current
      const activeStep = container?.querySelector<HTMLElement>('.ant-steps-item-active')
      if (!container || !activeStep) return

      const targetLeft = activeStep.offsetLeft - (container.clientWidth - activeStep.offsetWidth) / 2
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }, [current])

    async function initialize() {
      setLoading(true)
      setBootError('')
      try {
        const data = await loadBootstrap()
        setBootstrap(data)
        form.setFieldsValue({
          agreement_agreed: false,
          mysql: {
            host: '127.0.0.1',
            port: 3306,
            database: '',
            username: 'root',
            password: '',
          },
          redis: {
            host: '127.0.0.1',
            port: 6379,
            password: '',
            database: 0,
          },
          system: {
            site_name: '皓量云擎业务管理系统',
            site_url: window.location.origin,
            admin_path: data.defaults.admin_path,
          },
          admin: {
            nickname: '超级管理员',
            username: data.defaults.admin_username,
            password: data.defaults.admin_password,
          },
        })
      } catch (error) {
        setBootError(error instanceof Error ? error.message : '安装器初始化失败')
      } finally {
        setLoading(false)
      }
    }

    async function refreshEnvironment() {
      setLoading(true)
      try {
        const data = await loadBootstrap()
        setBootstrap((currentData) =>
          currentData ? { ...currentData, environment: data.environment, token: data.token } : data,
        )
        if (data.environment.passed) {
          void message.success('环境检测已通过')
        } else {
          void message.warning('仍有必需项目未通过')
        }
      } catch (error) {
        void message.error(error instanceof Error ? error.message : '环境检测失败')
      } finally {
        setLoading(false)
      }
    }

    async function handleRandom(target: 'path' | 'username' | 'password') {
      try {
        const data = await loadRandomDefaults()
        if (target === 'path') {
          form.setFieldValue(['system', 'admin_path'], data.admin_path)
          return
        }
        form.setFieldValue(
          ['admin', target],
          target === 'username' ? data.admin_username : data.admin_password,
        )
      } catch (error) {
        void message.error(error instanceof Error ? error.message : '随机生成失败')
      }
    }

    async function handleTestConnections(showSuccess = true): Promise<boolean> {
      try {
        await form.validateFields([
          ['mysql', 'host'],
          ['mysql', 'port'],
          ['mysql', 'database'],
          ['mysql', 'username'],
          ['redis', 'host'],
          ['redis', 'port'],
          ['redis', 'database'],
        ])
      } catch {
        return false
      }

      setTesting(true)
      try {
        const values = form.getFieldsValue(true) as InstallationConfiguration
        const result = await testConnections({ mysql: values.mysql, redis: values.redis })
        setConnectionResult(result)
        if (showSuccess) {
          void message.success('MySQL 与 Redis 连接正常')
        }
        return true
      } catch (error) {
        setConnectionResult(null)
        void message.error(error instanceof Error ? error.message : '连接测试失败')
        return false
      } finally {
        setTesting(false)
      }
    }

    async function next() {
      if (current === 0) {
        if (!agreementAgreed) {
          void message.warning('请先阅读并同意软件使用协议')
          return
        }
        setCurrent(1)
        return
      }

      if (current === 1) {
        if (!bootstrap?.environment.passed) {
          void message.warning('请先修复未通过的必需环境项')
          return
        }
        setCurrent(2)
        return
      }

      if (current === 2) {
        if (!connectionResult) {
          void message.warning('请先测试 MySQL 与 Redis 连接')
          return
        }
        setCurrent(3)
        return
      }

      if (current === 3) {
        try {
          await form.validateFields()
        } catch {
          return
        }
        setCurrent(4)
        await runInstallation(form.getFieldsValue(true) as InstallationConfiguration)
      }
    }

    async function runInstallation(configuration: InstallationConfiguration) {
      setProgress(5)
      setInstallError('')
      setFinalResult(null)
      setPhases(phaseDefinitions.map((phase) => ({ ...phase, status: 'wait' })))

      for (let index = 0; index < phaseDefinitions.length; index += 1) {
        const phase = phaseDefinitions[index]
        setPhases((items) =>
          items.map((item, itemIndex) => ({
            ...item,
            status: itemIndex < index ? 'finish' : itemIndex === index ? 'process' : 'wait',
          })),
        )

        try {
          const result = await executePhase(phase.key, configuration)
          setProgress(result.progress)
          setPhases((items) =>
            items.map((item) =>
              item.key === phase.key
                ? { ...item, status: 'finish', description: result.message }
                : item,
            ),
          )

          if (result.result) {
            setFinalResult({
              ...result.result,
              admin_password: configuration.admin.password,
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '安装执行失败'
          setPhases((items) =>
            items.map((item) =>
              item.key === phase.key
                ? { ...item, status: 'error', description: errorMessage }
                : item,
            ),
          )
          setInstallError(errorMessage)
          setCurrent(5)
          return
        }
      }

      setCurrent(5)
    }

    async function copy(value: string, label: string) {
      try {
        await navigator.clipboard.writeText(value)
        void message.success(`${label}已复制`)
      } catch {
        void message.error('复制失败，请手动选择文本')
      }
    }

    function copyAll() {
      if (!finalResult) return
      const text = [
        `首页：${finalResult.home_url}`,
        `后台：${finalResult.admin_url}`,
        `后台路径：/${finalResult.admin_path}`,
        `管理员昵称：${finalResult.admin_nickname}`,
        `管理员账号：${finalResult.admin_username}`,
        `管理员密码：${finalResult.admin_password}`,
      ].join('\n')
      void copy(text, '全部安装信息')
    }

    function copyableValue(value: string, label: string, secret = false): ReactNode {
      return (
        <Flex gap={8} align="center" wrap>
          <Text code className={secret ? 'secret-value' : undefined}>
            {value}
          </Text>
          <Button type="link" size="small" onClick={() => void copy(value, label)}>
            复制
          </Button>
        </Flex>
      )
    }

    function renderAgreement() {
      return (
        <div className="step-panel">
          <div className="section-heading">
            <Title level={3}>{bootstrap?.agreement.title}</Title>
            <Paragraph type="secondary">
              请完整阅读宁波皓量云擎网络科技有限公司的软件使用协议。继续安装即表示你理解并接受协议条款。
            </Paragraph>
          </div>
          <div className="agreement-content" tabIndex={0} aria-label="皓量云擎业务管理系统软件使用协议">
            <pre>{bootstrap?.agreement.content}</pre>
          </div>
          <Form.Item name="agreement_agreed" valuePropName="checked" className="agreement-field">
            <Checkbox>
              我已阅读并同意《皓量云擎业务管理系统软件使用协议》（版本 {bootstrap?.agreement.version}）
            </Checkbox>
          </Form.Item>
        </div>
      )
    }

    function renderEnvironment() {
      const environment = bootstrap?.environment
      return (
        <div className="step-panel">
          <div className="section-heading with-action">
            <div>
              <Title level={3}>服务器环境检测</Title>
              <Paragraph type="secondary">所有必需项目通过后才能继续安装。</Paragraph>
            </div>
            <Button onClick={() => void refreshEnvironment()} loading={loading}>
              重新检测
            </Button>
          </div>
          <Alert
            type={environment?.passed ? 'success' : 'warning'}
            showIcon
            title={environment?.passed ? '当前环境满足安装要求' : '存在未通过的必需项目'}
            description={environment?.passed ? '可以继续配置数据库。' : '请按提示修复后重新检测。'}
          />
          <List
            className="environment-list"
            size="small"
            dataSource={environment?.items ?? []}
            renderItem={(item) => (
              <List.Item>
                <div className="environment-item">
                  <div className="environment-copy">
                    <Space size={8} wrap>
                      <Text strong>{item.name}</Text>
                      {item.required ? <Text type="danger">必需</Text> : <Text type="secondary">可选</Text>}
                    </Space>
                    <Text type="secondary">{item.help || item.value}</Text>
                  </div>
                  <div className="environment-status">
                    <Text>{item.value}</Text>
                  <Tag color={item.passed ? 'success' : item.required ? 'error' : 'default'}>
                    {item.passed ? '通过' : item.required ? '未通过' : '可选'}
                  </Tag>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )
    }

    function renderDatabase() {
      return (
        <div className="step-panel">
          <div className="section-heading">
            <Title level={3}>数据库与缓存配置</Title>
            <Paragraph type="secondary">数据库需要提前创建，安装账号需具备建表和写入权限。</Paragraph>
          </div>

          <div className="form-section-grid">
            <div className="form-section">
              <Title level={5}>MySQL 8.0</Title>
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item name={['mysql', 'host']} label="主机地址" rules={[{ required: true }]}>
                    <Input placeholder="127.0.0.1" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['mysql', 'port']} label="端口" rules={[{ required: true }]}>
                    <InputNumber min={1} max={65535} className="full-width" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={['mysql', 'database']} label="数据库名称" rules={[{ required: true }]}>
                    <Input placeholder="请输入已创建的数据库名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['mysql', 'username']}
                    label="数据库账号"
                    htmlFor="mysql_account"
                    rules={[{ required: true }]}
                  >
                    <Input
                      id="mysql_account"
                      autoComplete="one-time-code"
                      data-1p-ignore="true"
                      data-lpignore="true"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={['mysql', 'password']} label="密码">
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="form-section">
              <Title level={5}>Redis</Title>
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item name={['redis', 'host']} label="主机地址" rules={[{ required: true }]}>
                    <Input placeholder="127.0.0.1" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['redis', 'port']} label="端口" rules={[{ required: true }]}>
                    <InputNumber min={1} max={65535} className="full-width" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item name={['redis', 'password']} label="密码">
                    <Input.Password placeholder="可选" autoComplete="new-password" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['redis', 'database']} label="数据库编号" rules={[{ required: true }]}>
                    <InputNumber min={0} max={255} className="full-width" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <Flex className="connection-actions" align="center" gap={12} wrap>
            <Button type="primary" ghost loading={testing} onClick={() => void handleTestConnections()}>
              测试连接
            </Button>
            {connectionResult ? (
              <Text type="success">
                连接正常：MySQL {connectionResult.mysql.version} / Redis {connectionResult.redis.version}
              </Text>
            ) : (
              <Text type="secondary">修改连接信息后需要重新测试</Text>
            )}
          </Flex>
        </div>
      )
    }

    function renderSystem() {
      return (
        <div className="step-panel">
          <div className="section-heading">
            <Title level={3}>系统与管理员配置</Title>
            <Paragraph type="secondary">确认网站信息、安全后台路径和首个超级管理员账号。</Paragraph>
          </div>

          <div className="form-section-grid">
            <div className="form-section">
              <Title level={5}>网站基本信息</Title>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name={['system', 'site_name']} label="网站名称" rules={[{ required: true, min: 2, max: 80 }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={['system', 'site_url']} label="网站地址" rules={[{ required: true, type: 'url' }]}>
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name={['system', 'admin_path']}
                    label="后台访问路径"
                    extra="安装后可通过该路径访问运营后台，请妥善保存。"
                    rules={[
                      { required: true },
                      { pattern: /^[a-z][a-z0-9-]{2,31}$/, message: '请输入 3 至 32 位小写字母、数字或连字符' },
                    ]}
                  >
                    <Input
                      addonBefore="/"
                      addonAfter={
                        <Button type="link" size="small" onClick={() => void handleRandom('path')}>
                          随机生成
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="form-section">
              <Title level={5}>管理员信息</Title>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['admin', 'nickname']}
                    label="管理员昵称"
                    rules={[{ required: true, min: 2, max: 32 }]}
                  >
                    <Input autoComplete="nickname" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['admin', 'username']}
                    label="管理员账号"
                    rules={[
                      { required: true },
                      {
                        pattern: /^[a-zA-Z][a-zA-Z0-9_]{5,31}$/,
                        message: '请输入 6 至 32 位字符，以英文字母开头，只能包含英文字母、数字或下划线',
                      },
                    ]}
                  >
                    <Input
                      autoComplete="one-time-code"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      addonAfter={
                        <Button type="link" size="small" onClick={() => void handleRandom('username')}>
                          随机生成
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name={['admin', 'password']}
                    label="管理员密码"
                    extra="至少 8 位，并同时包含大写字母、小写字母、数字和特殊字符。"
                    rules={[
                      { required: true, min: 8, max: 128 },
                      {
                        validator: async (_, value: string) => {
                          if (/[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z\d]/.test(value)) return
                          throw new Error('密码复杂度不符合要求')
                        },
                      },
                    ]}
                  >
                    <Input.Password
                      autoComplete="new-password"
                      addonAfter={
                        <Button type="link" size="small" onClick={() => void handleRandom('password')}>
                          随机生成
                        </Button>
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      )
    }

    function renderExecution() {
      return (
        <div className="step-panel execution-panel">
          <div className="section-heading centered">
            <Title level={3}>正在安装系统</Title>
            <Paragraph type="secondary">请保持当前页面打开，不要重复提交或关闭浏览器。</Paragraph>
          </div>
          <Progress percent={progress} status={installError ? 'exception' : progress === 100 ? 'success' : 'active'} />
          <List
            className="phase-list"
            size="small"
            dataSource={phases}
            renderItem={(item) => (
              <List.Item extra={<Tag color={phaseTagColor(item.status)}>{phaseStatusText(item.status)}</Tag>}>
                <List.Item.Meta title={item.title} description={item.description} />
              </List.Item>
            )}
          />
        </div>
      )
    }

    function renderResult() {
      if (installError || !finalResult) {
        return (
          <Result
            className="installer-result"
            status="error"
            title="安装失败"
            subTitle={installError || '未能取得安装结果，请检查服务端日志后重试。'}
            extra={[
              <Button key="back" type="primary" onClick={() => setCurrent(3)}>
                返回检查配置
              </Button>,
              <Button key="retry" onClick={() => void next()}>
                重新执行安装
              </Button>,
            ]}
          >
            <Alert type="warning" showIcon title="已完成的数据库步骤可以安全重试，安装器不会重复创建相同表。" />
          </Result>
        )
      }

      return (
        <Result
          className="installer-result"
          status="success"
          title="皓量云擎业务管理系统安装成功"
          subTitle="请立即保存管理员信息，离开本页后将无法再次查看明文密码。"
          extra={[
            <Button key="home" href={finalResult.home_url}>访问首页</Button>,
            <Button key="admin" type="primary" href={finalResult.admin_url}>进入运营后台</Button>,
            <Button key="copy" onClick={copyAll}>复制全部</Button>,
          ]}
        >
          <Card className="result-card" bordered={false}>
            <Descriptions
              column={1}
              bordered
              items={[
                { key: 'home', label: '首页地址', children: copyableValue(finalResult.home_url, '首页地址') },
                { key: 'admin', label: '后台地址', children: copyableValue(finalResult.admin_url, '后台地址') },
                { key: 'path', label: '后台路径', children: copyableValue(`/${finalResult.admin_path}`, '后台路径') },
                { key: 'nickname', label: '管理员昵称', children: copyableValue(finalResult.admin_nickname, '管理员昵称') },
                { key: 'username', label: '管理员账号', children: copyableValue(finalResult.admin_username, '管理员账号') },
                { key: 'password', label: '管理员密码', children: copyableValue(finalResult.admin_password, '管理员密码', true) },
              ]}
            />
          </Card>
        </Result>
      )
    }

    function renderCurrentStep() {
      if (current === 0) return renderAgreement()
      if (current === 1) return renderEnvironment()
      if (current === 2) return renderDatabase()
      if (current === 3) return renderSystem()
      if (current === 4) return renderExecution()
      return renderResult()
    }

    if (loading && !bootstrap) {
      return <div className="installer-loading"><Progress type="circle" percent={35} status="active" /><Text>正在初始化安装器…</Text></div>
    }

    if (bootError || !bootstrap) {
      return <Result status="error" title="安装器初始化失败" subTitle={bootError} extra={<Button type="primary" onClick={() => void initialize()}>重新加载</Button>} />
    }

    return (
      <div className="installer-shell">
        <header className="installer-header">
          <div className="brand-mark" aria-hidden="true">皓</div>
          <div>
            <Text strong className="brand-name">皓量云擎业务管理系统</Text>
            <Text type="secondary" className="brand-subtitle">在线安装向导</Text>
          </div>
          <Tag color="blue">v0.1.0</Tag>
        </header>

        <main className="installer-main">
          <Card className="installer-card" bordered={false}>
            <div className="installer-steps-scroll" ref={stepsScrollRef}>
              <Steps current={current} items={stepItems} responsive={false} size="small" className="installer-steps" />
            </div>
            <Divider className="steps-divider" />
            <Form
              form={form}
              layout="vertical"
              autoComplete="off"
              requiredMark="optional"
              onValuesChange={(changedValues) => {
                if ('mysql' in changedValues || 'redis' in changedValues) setConnectionResult(null)
              }}
            >
              {renderCurrentStep()}
            </Form>

            {current < 4 && (
              <div className="step-actions">
                <Button disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
                  上一步
                </Button>
                <Button
                  type="primary"
                  onClick={() => void next()}
                  disabled={
                    (current === 0 && !agreementAgreed)
                    || (current === 1 && !bootstrap.environment.passed)
                    || (current === 2 && !connectionResult)
                  }
                  loading={testing}
                >
                  {current === 3 ? '开始安装' : '下一步'}
                </Button>
              </div>
            )}
          </Card>
        </main>

        <footer className="installer-footer">
          <Text type="secondary">© {new Date().getFullYear()} 皓量云擎 · 基于 AGPL-3.0 开源</Text>
        </footer>
      </div>
    )
  }

  function InstallerApp() {
    return (
      <ConfigProvider
        locale={locale}
        theme={{
          token: {
            colorPrimary: '#165DFF',
            borderRadius: 2,
            borderRadiusLG: 2,
            borderRadiusSM: 2,
            borderRadiusXS: 2,
            borderRadiusOuter: 2,
            colorBgLayout: '#F4F7FB',
          },
        }}
      >
        <AntApp>
          <InstallerContent />
        </AntApp>
      </ConfigProvider>
    )
  }

  return InstallerApp
}

function phaseTagColor(status: PhaseStatus): string {
  if (status === 'finish') return 'success'
  if (status === 'process') return 'processing'
  if (status === 'error') return 'error'
  return 'default'
}

function phaseStatusText(status: PhaseStatus): string {
  if (status === 'finish') return '已完成'
  if (status === 'process') return '执行中'
  if (status === 'error') return '失败'
  return '等待中'
}
