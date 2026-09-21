import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type AdminUser } from '../api/authApi.ts'
import { ApiRequestError } from '../api/httpClient.ts'
import { AuthContext, type AuthenticationStatus, type AuthContextValue } from './AuthContext.ts'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * 管理运营后台登录状态并通过 HttpOnly Cookie 恢复会话。
 * @param props 组件属性
 * @param props.children 后台应用内容
 * @returns 认证上下文提供器
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthenticationStatus>('loading')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [bootstrapError, setBootstrapError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    authApi.profile(controller.signal)
      .then(({ user: currentUser }) => {
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setUser(null)
        setStatus('anonymous')
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          setBootstrapError(error instanceof Error ? error.message : '暂时无法验证登录状态')
        }
      })

    return () => controller.abort()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    bootstrapError,
    async login(input) {
      const result = await authApi.login(input)
      setBootstrapError('')
      setUser(result.user)
      setStatus('authenticated')
    },
    async logout() {
      await authApi.logout()
      setUser(null)
      setStatus('anonymous')
    },
  }), [bootstrapError, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
