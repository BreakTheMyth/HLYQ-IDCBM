import { request } from './httpClient.ts'

/**
 * 运营后台当前管理员资料。
 */
export interface AdminUser {
  /** 管理员标识。 */
  id: number
  /** 管理员登录账号。 */
  username: string
  /** 管理员显示昵称。 */
  nickname: string
  /** 最近一次登录时间，首次登录时为空。 */
  last_login_at: string | null
}

export interface AdminLoginInput {
  /** 管理员账号。 */
  username: string
  /** 管理员密码。 */
  password: string
}

interface LoginResponse {
  user: AdminUser
  expires_at: number
}

interface ProfileResponse {
  user: AdminUser
}

/**
 * 运营后台认证接口。
 */
export const authApi = {
  /**
   * 使用账号密码登录。
   * @param input 登录凭据
   * @returns 当前管理员和 JWT 过期时间
   */
  login(input: AdminLoginInput): Promise<LoginResponse> {
    return request<LoginResponse>({ method: 'POST', url: '/auth/login', data: input })
  },

  /**
   * 查询当前 HttpOnly Cookie 对应的管理员。
   * @param signal 请求中止信号
   * @returns 当前管理员资料
   */
  profile(signal?: AbortSignal): Promise<ProfileResponse> {
    return request<ProfileResponse>({ method: 'GET', url: '/auth/me', signal })
  },

  /**
   * 清除当前浏览器的管理员登录 Cookie。
   * @returns 无业务数据
   */
  logout(): Promise<null> {
    return request<null>({ method: 'POST', url: '/auth/logout' })
  },
}
