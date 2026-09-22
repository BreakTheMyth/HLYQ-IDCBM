import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { PageContainer, ProBreadcrumb, ProLayout, type MenuDataItem } from '@ant-design/pro-components'
import { ConfigProvider, Grid } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AdminUser } from '../api/authApi.ts'
import { adminPageRoutes, createProLayoutMenuData } from '../config/adminNavigation.tsx'
import { adminLayoutPalettes, type AppThemeMode } from '../theme.ts'
import AdminHeader from './AdminHeader.tsx'
import './AdminLayout.css'

interface AdminLayoutProps {
  children?: ReactNode
  user: AdminUser
  themeMode: AppThemeMode
  onThemeModeChange: () => void
  onLogout: () => Promise<void>
}

const logoUrl = `${import.meta.env.BASE_URL}logo.png`

/**
 * 使用企业顶栏与 ProLayout 混合导航承载运营后台。
 * @param props 布局属性
 * @param props.children 由业务路由渲染的页面内容
 * @param props.user 当前登录管理员
 * @param props.themeMode 当前明暗主题
 * @param props.onThemeModeChange 切换明暗主题
 * @param props.onLogout 退出登录
 * @returns 运营后台混合布局
 */
function AdminLayout({ children, user, themeMode, onThemeModeChange, onLogout }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const palette = adminLayoutPalettes[themeMode]
  const isMobile = screens.md === false
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(() => (
    window.matchMedia('(max-width: 767px)').matches
  ))
  const [mobileMenuHeight, setMobileMenuHeight] = useState(0)
  const menuData = useMemo<MenuDataItem[]>(() => createProLayoutMenuData(), [])
  const breadcrumbItems = useMemo(() => {
    const activeRoute = adminPageRoutes.find((route) => route.path === location.pathname)
    if (!activeRoute) return []

    return [
      activeRoute.topMenuLabel,
      activeRoute.parentMenuLabel,
      activeRoute.title,
    ].filter((title): title is string => Boolean(title)).map((title) => ({ title }))
  }, [location.pathname])

  // ProLayout 的内联移动抽屉不会锁定页面滚动，需要避免滚出抽屉的视口覆盖范围。
  useEffect(() => {
    if (!isMobile || isMenuCollapsed) return

    const updateMobileMenuHeight = () => {
      setMobileMenuHeight(Math.max(
        window.innerHeight,
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ))
    }
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    updateMobileMenuHeight()
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    window.addEventListener('resize', updateMobileMenuHeight)
    window.visualViewport?.addEventListener('resize', updateMobileMenuHeight)

    return () => {
      window.removeEventListener('resize', updateMobileMenuHeight)
      window.visualViewport?.removeEventListener('resize', updateMobileMenuHeight)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isMenuCollapsed, isMobile])

  const layoutStyle = useMemo(() => ({
    '--admin-mobile-menu-height': mobileMenuHeight > 0 ? `${mobileMenuHeight}px` : '100dvh',
  }) as CSSProperties, [mobileMenuHeight])

  return (
    <ProLayout
      className="admin-pro-layout"
      style={layoutStyle}
      layout="mix"
      token={{
        bgLayout: palette.canvas,
        header: {
          heightLayoutHeader: isMobile ? 56 : 64,
          colorBgHeader: palette.surface,
          colorBgScrollHeader: palette.surface,
        },
        sider: {
          colorMenuBackground: palette.surface,
          colorMenuItemDivider: palette.border,
          colorTextMenu: palette.text,
          colorTextMenuTitle: palette.muted,
          colorTextMenuSecondary: palette.muted,
          colorBgMenuItemSelected: palette.selected,
          colorBgMenuItemHover: palette.hover,
          colorBgMenuItemActive: palette.selected,
          colorTextMenuSelected: palette.selectedText,
          colorTextSubMenuSelected: palette.selectedText,
          colorTextMenuActive: palette.selectedText,
          colorTextMenuItemHover: palette.text,
          colorBgMenuItemCollapsedElevated: palette.surface,
        },
      }}
      menuRender={(_props, defaultDom) => (
        <ConfigProvider theme={{
          components: {
            Menu: {
              // 侧栏暗色菜单的选中态与实色布局配色保持一致。
              darkItemBg: palette.surface,
              darkItemColor: palette.text,
              darkItemSelectedBg: palette.selected,
              darkItemSelectedColor: palette.selectedText,
              darkItemHoverBg: palette.hover,
              darkItemHoverColor: palette.text,
              darkSubMenuItemBg: palette.surface,
              darkPopupBg: palette.surface,
              darkGroupTitleColor: palette.muted,
            },
          },
        }}>
          {defaultDom}
        </ConfigProvider>
      )}
      headerRender={() => (
        <AdminHeader
          user={user}
          isMobile={isMobile}
          collapsed={isMenuCollapsed}
          onCollapse={setIsMenuCollapsed}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          onLogout={onLogout}
        />
      )}
      splitMenus
      // 收起后使用原生子菜单，保留父级图标及悬浮子菜单入口。
      siderMenuType={isMobile || isMenuCollapsed ? 'sub' : 'group'}
      collapsed={isMenuCollapsed}
      route={{ path: '/', children: menuData }}
      location={{ pathname: location.pathname }}
      logo={<img className="admin-brand-logo" src={logoUrl} alt="皓量云擎" />}
      title="皓量云擎"
      locale="zh-CN"
      menu={{ locale: false, collapsedShowGroupTitle: false }}
      pageTitleRender={false}
      footerRender={false}
      collapsedButtonRender={(collapsed, defaultDom) => {
        if (isMobile) return defaultDom

        const label = collapsed ? '展开侧边菜单' : '收起侧边菜单'
        return (
          <button
            type="button"
            className="admin-collapse-button"
            aria-label={label}
            onClick={() => setIsMenuCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        )
      }}
      onCollapse={setIsMenuCollapsed}
      onMenuHeaderClick={() => navigate('/dashboard')}
      menuItemRender={(item, defaultDom) => (
        item.path ? <Link to={item.path}>{defaultDom}</Link> : defaultDom
      )}
    >
      <PageContainer
        title={false}
        pageHeaderRender={false}
        breadcrumbRender={false}
        token={{
          paddingInlinePageContainerContent: 20,
          paddingBlockPageContainerContent: 16,
        }}
      >
        {!isMobile && breadcrumbItems.length > 0 ? (
          <div className="admin-page-breadcrumb">
            <ProBreadcrumb separator="/" items={breadcrumbItems} />
          </div>
        ) : null}
        {children}
      </PageContainer>
    </ProLayout>
  )
}

export default AdminLayout
