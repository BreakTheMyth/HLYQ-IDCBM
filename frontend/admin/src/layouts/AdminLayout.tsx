import { useMemo, type ReactNode } from 'react'
import { PageContainer, ProLayout, type MenuDataItem } from '@ant-design/pro-components'
import { Badge, Button, Dropdown, Tooltip, type MenuProps } from 'antd'
import {
  BellOutlined,
  DownOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AdminUser } from '../api/authApi.ts'
import { createProLayoutMenuData } from '../config/adminNavigation.tsx'
import type { AppThemeMode } from '../theme.ts'
import './AdminLayout.css'

interface AdminLayoutProps {
  children?: ReactNode
  user: AdminUser
  themeMode: AppThemeMode
  onThemeModeChange: () => void
  onLogout: () => Promise<void>
}

const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人资料' },
  { key: 'security', label: '安全设置' },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
]

/**
 * 使用 ProLayout 默认经典侧边栏承载运营后台。
 * @param props 布局属性
 * @param props.children 由业务路由渲染的页面内容
 * @param props.user 当前登录管理员
 * @param props.themeMode 当前明暗主题
 * @param props.onThemeModeChange 切换明暗主题
 * @param props.onLogout 退出登录
 * @returns 运营后台经典布局
 */
function AdminLayout({ children, user, themeMode, onThemeModeChange, onLogout }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const menuData = useMemo<MenuDataItem[]>(() => createProLayoutMenuData(), [])

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') void onLogout()
  }

  const avatarText = Array.from(user.nickname.trim() || user.username)[0] ?? '管'

  return (
    <ProLayout
      layout="side"
      route={{ path: '/', children: menuData }}
      location={{ pathname: location.pathname }}
      logo={<img className="admin-brand-logo" src={logoUrl} alt="皓量云擎" />}
      title="皓量云擎"
      locale="zh-CN"
      menu={{ locale: false }}
      pageTitleRender={false}
      footerRender={false}
      onMenuHeaderClick={() => navigate('/dashboard')}
      menuItemRender={(item, defaultDom) => (
        item.path ? <Link to={item.path}>{defaultDom}</Link> : defaultDom
      )}
      actionsRender={() => [
        <Tooltip title="搜索" key="search">
          <Button type="text" icon={<SearchOutlined />} aria-label="搜索" />
        </Tooltip>,
        <Tooltip title={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'} key="theme">
          <Button
            type="text"
            icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            aria-label={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'}
            aria-pressed={themeMode === 'dark'}
            onClick={onThemeModeChange}
          />
        </Tooltip>,
        <Tooltip title="通知中心" key="notifications">
          <Badge dot size="small" offset={[-5, 5]}>
            <Button
              type="text"
              icon={<BellOutlined />}
              aria-label="通知中心"
              onClick={() => navigate('/announcements')}
            />
          </Badge>
        </Tooltip>,
      ]}
      avatarProps={{
        children: avatarText,
        title: user.nickname,
        render: (_avatarProps, defaultDom) => (
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <button type="button" className="admin-user-trigger" aria-label="打开管理员菜单">
              {defaultDom}
              <DownOutlined className="admin-user-arrow" />
            </button>
          </Dropdown>
        ),
      }}
    >
      <PageContainer title={false}>{children}</PageContainer>
    </ProLayout>
  )
}

export default AdminLayout
