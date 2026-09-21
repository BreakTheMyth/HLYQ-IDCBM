import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageContainer, ProLayout, type MenuDataItem } from '@ant-design/pro-components'
import { Badge, Breadcrumb, Button, Dropdown, Menu, Tooltip, type MenuProps } from 'antd'
import {
  BellOutlined,
  DownOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  PicLeftOutlined,
  SearchOutlined,
  SplitCellsOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AdminUser } from '../api/authApi.ts'
import {
  adminNavigation,
  adminPageRoutes,
  createProLayoutMenuData,
  findNavigationPath,
  findNavigationSelection,
  getFirstNavigationPath,
} from '../config/adminNavigation.tsx'
import type { AppThemeMode } from '../theme.ts'
import './AdminLayout.css'

interface AdminLayoutProps {
  children?: ReactNode
  user: AdminUser
  themeMode: AppThemeMode
  onThemeModeChange: () => void
  onLogout: () => Promise<void>
}

type AdminLayoutMode = 'classic' | 'mixed' | 'dual'

const logoUrl = `${import.meta.env.BASE_URL}logo.png`
const layoutStorageKey = 'hlyq-admin-layout'
const mobileBreakpoint = 768

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人资料' },
  { key: 'security', label: '安全设置' },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
]

const layoutMenuItems: MenuProps['items'] = [
  { key: 'classic', icon: <PicLeftOutlined />, label: '经典布局' },
  { key: 'mixed', icon: <LayoutOutlined />, label: '混合布局' },
  { key: 'dual', icon: <SplitCellsOutlined />, label: '双列布局' },
]

/**
 * 获取后台初始布局模式。
 * @returns 已保存的布局模式，未保存时使用混合布局
 */
function getInitialLayoutMode(): AdminLayoutMode {
  try {
    const savedLayout = window.localStorage.getItem(layoutStorageKey)
    if (savedLayout === 'classic' || savedLayout === 'mixed' || savedLayout === 'dual') {
      return savedLayout
    }
  } catch {
    // 浏览器禁用本地存储时仍可在当前会话切换布局。
  }

  return 'mixed'
}

/**
 * 使用 ProLayout 承载运营后台的经典、混合和左侧双列布局。
 * @param props 布局属性
 * @param props.children 由业务路由渲染的页面内容
 * @returns 运营后台全局布局
 */
function AdminLayout({ children, user, themeMode, onThemeModeChange, onLogout }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [layoutMode, setLayoutMode] = useState<AdminLayoutMode>(getInitialLayoutMode)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const isMobile = viewportWidth <= mobileBreakpoint
  const effectiveLayoutMode = isMobile ? 'classic' : layoutMode

  const { topMenuKey: activeTopMenu, sideMenuKey: activeSideMenu, parentMenuKey } = useMemo(
    () => findNavigationSelection(location.pathname),
    [location.pathname],
  )
  const menuData = useMemo<MenuDataItem[]>(() => createProLayoutMenuData(), [])
  const activeTopNavigation = useMemo(
    () => adminNavigation.find((menu) => menu.key === activeTopMenu) ?? adminNavigation[0],
    [activeTopMenu],
  )
  const breadcrumbItems = useMemo(() => {
    const route = adminPageRoutes.find((candidate) => candidate.path === location.pathname)
    if (!route) return [{ title: '总览' }]

    return [route.topMenuLabel, route.parentMenuLabel, route.title]
      .filter((label): label is string => Boolean(label))
      .filter((label, index, labels) => index === 0 || label !== labels[index - 1])
      .map((label) => ({ title: label }))
  }, [location.pathname])

  const dualPrimaryMenuItems = useMemo<MenuProps['items']>(
    () => adminNavigation.map((menu) => ({ key: menu.key, icon: menu.icon, label: menu.label })),
    [],
  )
  const dualSecondaryMenuItems = useMemo<MenuProps['items']>(() => (
    activeTopNavigation.sections.flatMap((section) => section.items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children?.map((child) => ({ key: child.key, label: child.label })),
    })))
  ), [activeTopNavigation])

  useEffect(() => {
    try {
      window.localStorage.setItem(layoutStorageKey, layoutMode)
    } catch {
      // 本地存储不可用只影响布局偏好持久化。
    }
  }, [layoutMode])

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLayoutModeChange: MenuProps['onClick'] = ({ key }) => {
    setLayoutMode(key as AdminLayoutMode)
    setIsCollapsed(false)
  }

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') void onLogout()
  }

  const handleDualPrimaryClick: MenuProps['onClick'] = ({ key }) => {
    const target = adminNavigation.find((menu) => menu.key === key)
    if (target) navigate(getFirstNavigationPath(target.sections))
  }

  const handleDualSecondaryClick: MenuProps['onClick'] = ({ key }) => {
    navigate(findNavigationPath(activeTopMenu, key))
  }

  const avatarText = Array.from(user.nickname.trim() || user.username)[0] ?? '管'
  const useContextBar = !isMobile && effectiveLayoutMode !== 'classic'
  const proLayoutMode = effectiveLayoutMode === 'mixed' ? 'mix' : 'side'
  const expandedSiderWidth = effectiveLayoutMode === 'dual' ? 288 : 216
  const siderWidth = isMobile ? Math.round(viewportWidth * 0.7) : expandedSiderWidth

  return (
    <ProLayout
      className={`admin-pro-layout layout-${effectiveLayoutMode}`}
      layout={proLayoutMode}
      splitMenus={effectiveLayoutMode === 'mixed'}
      route={{ path: '/', children: menuData }}
      location={{ pathname: location.pathname }}
      logo={<img className="admin-brand-logo" src={logoUrl} alt="" aria-hidden="true" />}
      title="皓量云擎"
      locale="zh-CN"
      navTheme="light"
      fixedHeader
      fixSiderbar
      breakpoint="md"
      siderWidth={siderWidth}
      collapsed={isMobile ? isMobileCollapsed : isCollapsed}
      onCollapse={(collapsed) => {
        if (isMobile) {
          setIsMobileCollapsed(collapsed)
          return
        }

        setIsCollapsed(collapsed)
      }}
      collapsedButtonRender={(collapsed) => (
        collapsed ? <MenuUnfoldOutlined aria-label="展开侧边栏" /> : <MenuFoldOutlined aria-label="收起侧边栏" />
      )}
      menu={{ locale: false, defaultOpenAll: true, type: 'sub', autoClose: false }}
      breadcrumbRender={false}
      pageTitleRender={false}
      footerRender={false}
      onMenuHeaderClick={() => navigate('/dashboard')}
      menuItemRender={(item, defaultDom) => (
        item.path ? (
          <Link to={item.path} onClick={() => isMobile && setIsMobileCollapsed(true)}>
            {defaultDom}
          </Link>
        ) : defaultDom
      )}
      menuContentRender={(props, defaultDom) => {
        if (effectiveLayoutMode !== 'dual') return defaultDom

        return (
          <div className={`admin-dual-menu ${props.collapsed ? 'collapsed' : ''}`}>
            <div className="admin-dual-primary">
              <Menu
                mode="inline"
                inlineCollapsed
                selectedKeys={[activeTopMenu]}
                items={dualPrimaryMenuItems}
                onClick={handleDualPrimaryClick}
                style={{ width: '100%', background: 'transparent', borderInlineEnd: 0 }}
              />
            </div>
            <div className="admin-dual-secondary">
              <div className="admin-dual-heading">{activeTopNavigation.label}</div>
              <Menu
                key={activeTopMenu}
                mode="inline"
                selectedKeys={[activeSideMenu]}
                defaultOpenKeys={parentMenuKey ? [parentMenuKey] : []}
                items={dualSecondaryMenuItems}
                onClick={handleDualSecondaryClick}
                style={{ background: 'transparent', borderInlineEnd: 0 }}
              />
            </div>
          </div>
        )
      }}
      actionsRender={() => [
        <Dropdown
          key="layout"
          menu={{ items: layoutMenuItems, onClick: handleLayoutModeChange, selectedKeys: [layoutMode] }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Tooltip title="切换布局">
            <Button type="text" icon={<LayoutOutlined />} aria-label="切换布局" />
          </Tooltip>
        </Dropdown>,
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
      contentStyle={{ minHeight: '100vh', padding: 0, background: 'var(--nav-color-bg-canvas)' }}
    >
      {useContextBar ? (
        <div className="admin-context-bar">
          <Breadcrumb separator="/" items={breadcrumbItems} />
        </div>
      ) : null}
      <PageContainer
        className="admin-page-container"
        title={false}
        pageHeaderRender={useContextBar ? false : undefined}
        breadcrumbRender={useContextBar ? false : (_props, defaultDom) => defaultDom}
        breadcrumb={useContextBar ? undefined : { separator: '/', items: breadcrumbItems }}
        token={{ paddingInlinePageContainerContent: 0, paddingBlockPageContainerContent: 0 }}
      >
        {children}
      </PageContainer>
    </ProLayout>
  )
}

export default AdminLayout
