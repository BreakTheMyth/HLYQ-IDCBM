import { useState, type CSSProperties } from 'react'
import { Avatar, Button, ConfigProvider, Dropdown, Input, Menu, Modal, Tooltip } from 'antd'
import { BellOutlined, DownOutlined, EllipsisOutlined, MenuOutlined, MoonOutlined, SearchOutlined, SunOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AdminUser } from '../api/authApi.ts'
import { adminNavigation, adminPageRoutes, getFirstNavigationPath } from '../config/adminNavigation.tsx'
import { adminLayoutPalettes, createAdminHeaderTheme, type AppThemeMode } from '../theme.ts'
import './AdminHeader.css'

/** 企业顶栏属性，导航状态仍由布局与路由负责。 */
interface AdminHeaderProps {
  user: AdminUser
  isMobile: boolean
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  themeMode: AppThemeMode
  onThemeModeChange: () => void
  onLogout: () => Promise<void>
}

/**
 * 品牌、业务导航、工作工具和账号分区的企业顶栏。
 * @param props 当前管理员、设备状态及布局操作回调
 * @returns 使用原生 Menu 自动收纳溢出项的顶栏
 */
export default function AdminHeader({ user, isMobile, collapsed, onCollapse, themeMode, onThemeModeChange, onLogout }: AdminHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const headerStyle = Object.fromEntries(
    Object.entries(adminLayoutPalettes[themeMode]).map(([key, value]) => [`--header-${key}`, value]),
  ) as CSSProperties
  const activePage = adminPageRoutes.find((route) => route.path === location.pathname)
  const activeMenu = adminNavigation.find((item) => item.label === activePage?.topMenuLabel)
  const matches = adminPageRoutes.filter((route) => `${route.topMenuLabel} ${route.title}`.includes(query.trim()))

  return (
    <>
      <ConfigProvider theme={createAdminHeaderTheme(themeMode)}>
        <div className="admin-enterprise-header" style={headerStyle}>
          {isMobile && (
            <Button type="text" icon={<MenuOutlined />} aria-label={collapsed ? '展开导航菜单' : '收起导航菜单'} aria-expanded={!collapsed} onClick={() => onCollapse(!collapsed)} />
          )}
          <Link className="admin-enterprise-brand" to="/dashboard" aria-label="皓量云擎运营后台首页">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            <span className="admin-enterprise-brand-copy">
              <strong>皓量云擎</strong>
            </span>
          </Link>
          {!isMobile && (
            <nav className="admin-enterprise-navigation" aria-label="一级业务导航">
              <Menu
                mode="horizontal"
                selectedKeys={activeMenu ? [activeMenu.key] : []}
                onClick={({ key }) => {
                  const item = adminNavigation.find((entry) => entry.key === key)
                  if (item) navigate(getFirstNavigationPath(item.sections))
                }}
                overflowedIndicator={<EllipsisOutlined aria-label="更多业务菜单" />}
                items={adminNavigation.map((item) => ({
                  key: item.key,
                  icon: item.icon,
                  label: <Link to={getFirstNavigationPath(item.sections)} style={{ fontWeight: activeMenu?.key === item.key ? 600 : 400 }}>{item.label}</Link>,
                }))}
                style={{ minWidth: 0, lineHeight: '40px', borderBottom: 0 }}
              />
            </nav>
          )}
          <div className="admin-enterprise-tools" aria-label="工作工具">
            <Tooltip title="搜索页面">
              <Button type="text" icon={<SearchOutlined />} aria-label="搜索页面" onClick={() => setSearchOpen(true)} />
            </Tooltip>
            <Tooltip title={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'}>
              <Button type="text" icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />} aria-label={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'} aria-pressed={themeMode === 'dark'} onClick={onThemeModeChange} />
            </Tooltip>
            <Tooltip title="通知中心">
              <Button type="text" icon={<BellOutlined />} aria-label="通知中心" onClick={() => navigate('/announcements')} />
            </Tooltip>
          </div>
          <Dropdown placement="bottomRight" menu={{ items: [
            { key: 'profile', label: '个人资料（待开放）', disabled: true },
            { key: 'security', label: '安全设置（待开放）', disabled: true },
            { type: 'divider' },
            { key: 'logout', label: '退出登录', danger: true },
          ], onClick: ({ key }) => { if (key === 'logout') void onLogout() } }}>
            <button type="button" className="admin-enterprise-account" aria-label="打开管理员菜单">
              <Avatar size={32}>{Array.from(user.nickname.trim() || user.username)[0] ?? '管'}</Avatar>
              <span className="admin-enterprise-account-copy">
                <strong>{user.nickname || user.username}</strong>
              </span>
              <DownOutlined className="admin-enterprise-account-arrow" />
            </button>
          </Dropdown>
        </div>
      </ConfigProvider>
      <Modal title="搜索后台页面" open={searchOpen} onCancel={() => { setSearchOpen(false); setQuery('') }} footer={null} centered width={560}>
        <Input autoFocus allowClear prefix={<SearchOutlined />} placeholder="输入页面或业务名称" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="admin-header-search-results">
          {matches.length ? matches.map((route) => (
            <Link key={route.key} to={route.path} onClick={() => { setSearchOpen(false); setQuery('') }}>
              <span>{route.title}</span><span>{route.topMenuLabel}</span>
            </Link>
          )) : <p>没有找到匹配的页面</p>}
        </div>
      </Modal>
    </>
  )
}
