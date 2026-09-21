import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components'
import { Alert, App as AntApp, Flex, Typography, theme } from 'antd'
import { useState } from 'react'
import type { AdminLoginInput } from '../api/authApi.ts'
import { useAdminAuth } from '../auth/AuthContext.ts'
import { passwordHelpUrl } from '../config/helpLinks.ts'
import './LoginPage.css'

const logoUrl = `${import.meta.env.BASE_URL}logo.png`

/**
 * 运营后台账号密码登录页面。
 * @returns 简洁的居中登录表单
 */
function LoginPage() {
  const { login, bootstrapError } = useAdminAuth()
  const { message } = AntApp.useApp()
  const { token } = theme.useToken()
  const [errorMessage, setErrorMessage] = useState(bootstrapError)

  const handleLogin = async (values: AdminLoginInput): Promise<boolean> => {
    setErrorMessage('')
    try {
      await login(values)
      return true
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请稍后重试')
      return false
    }
  }

  return (
    <main className="admin-login-page" style={{ background: token.colorBgLayout }}>
      <section
        className="admin-login-panel"
        aria-label="运营后台登录"
        style={{
          background: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <LoginForm<AdminLoginInput>
          logo={<img className="admin-login-logo" src={logoUrl} alt="皓量云擎" />}
          title="皓量云擎"
          subTitle="业务管理系统运营后台"
          onFinish={handleLogin}
          initialValues={{ remember: false }}
          submitter={{ searchConfig: { submitText: '登录' } }}
          containerStyle={{
            height: 'auto',
            overflow: 'hidden',
            borderRadius: 2,
            background: token.colorBgContainer,
          }}
        >
          {errorMessage ? (
            <Alert className="admin-login-alert" type="error" showIcon title={errorMessage} />
          ) : null}
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
              autoComplete: 'username',
              autoFocus: true,
            }}
            placeholder="请输入管理员账号"
            rules={[
              { required: true, message: '请输入管理员账号' },
              { max: 32, message: '管理员账号不能超过 32 个字符' },
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
              autoComplete: 'current-password',
            }}
            placeholder="请输入管理员密码"
            rules={[
              { required: true, message: '请输入管理员密码' },
              { max: 128, message: '管理员密码不能超过 128 个字符' },
            ]}
          />
          <Flex className="admin-login-options" align="center" justify="space-between">
            <ProFormCheckbox name="remember" noStyle>
              记住我
            </ProFormCheckbox>
            <Typography.Link
              href={passwordHelpUrl || undefined}
              target={passwordHelpUrl ? '_blank' : undefined}
              rel={passwordHelpUrl ? 'noopener noreferrer' : undefined}
              onClick={passwordHelpUrl
                ? undefined
                : (event) => {
                    event.preventDefault()
                    void message.info('密码找回帮助文档正在准备中')
                  }}
            >
              忘记密码
            </Typography.Link>
          </Flex>
        </LoginForm>
      </section>
      <Typography.Text className="admin-login-footer" type="secondary">
        皓量云擎业务管理系统
      </Typography.Text>
    </main>
  )
}

export default LoginPage
