import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Avatar, Badge, Breadcrumb, Button, Drawer, Dropdown, Tooltip, type MenuProps } from 'antd'
import {
  BellOutlined,
  DownOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  MoreOutlined,
  PicLeftOutlined,
  SearchOutlined,
  SplitCellsOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import './AdminLayout.css'
import {
  adminNavigation,
  adminPageRoutes,
  findNavigationPath,
  findNavigationSelection,
  getFirstNavigationPath,
  type AdminNavigationSection,
  type AdminTopNavigationItem,
} from '../config/adminNavigation.tsx'
import type { AppThemeMode } from '../theme.ts'

interface AdminLayoutProps {
  children?: ReactNode
  themeMode: AppThemeMode
  onThemeModeChange: () => void
}

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人资料' },
  { key: 'security', label: '安全设置' },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
]

const logoUrl = `${import.meta.env.BASE_URL}logo.png`
const layoutStorageKey = 'hlyq-admin-layout'

type AdminLayoutMode = 'classic' | 'mixed' | 'dual'

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
 * 运营后台可切换导航布局。
 * @param props 布局属性
 * @param props.children 由业务路由渲染的页面内容
 * @returns 包含经典、混合及双列导航模式的后台布局
 */
function AdminLayout({ children, themeMode, onThemeModeChange }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const topNavigationRef = useRef<HTMLElement>(null)
  const topNavigationMeasureRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [layoutMode, setLayoutMode] = useState<AdminLayoutMode>(getInitialLayoutMode)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [openClassicTopMenus, setOpenClassicTopMenus] = useState<Record<string, boolean>>({})
  const [openMobileTopMenu, setOpenMobileTopMenu] = useState<string | null>(adminNavigation[0].key)
  const [openMobileSideMenu, setOpenMobileSideMenu] = useState<string | null>(null)
  const [visibleTopMenuCount, setVisibleTopMenuCount] = useState(adminNavigation.length)

  const { topMenuKey: activeTopMenu, sideMenuKey: activeSideMenu, parentMenuKey } = useMemo(
    () => findNavigationSelection(location.pathname),
    [location.pathname],
  )

  const primaryTopMenus = adminNavigation.slice(0, visibleTopMenuCount)
  const overflowTopMenus = adminNavigation.slice(visibleTopMenuCount)

  const activeSections = useMemo(
    () => adminNavigation.find((menu) => menu.key === activeTopMenu)?.sections ?? [],
    [activeTopMenu],
  )

  const breadcrumbItems = useMemo(() => {
    const route = adminPageRoutes.find((candidate) => candidate.path === location.pathname)
    if (!route) {
      return [{ title: '总览' }]
    }

    const labels = [route.topMenuLabel, route.parentMenuLabel, route.title]
      .filter((label): label is string => Boolean(label))
      .filter((label, index, items) => index === 0 || label !== items[index - 1])

    return labels.map((label) => ({ title: label }))
  }, [location.pathname])

  useEffect(() => {
    try {
      window.localStorage.setItem(layoutStorageKey, layoutMode)
    } catch {
      // 本地存储不可用只影响布局偏好持久化。
    }
  }, [layoutMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)

      if (!event.matches) {
        setIsMobileMenuOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  useLayoutEffect(() => {
    const navigation = topNavigationRef.current
    const measurer = topNavigationMeasureRef.current
    if (!navigation || !measurer) {
      return
    }

    const updateVisibleMenuCount = () => {
      const availableWidth = navigation.getBoundingClientRect().width
      const menuWidths = Array.from(measurer.querySelectorAll<HTMLElement>('[data-menu-measure]')).map(
        (item) => item.getBoundingClientRect().width,
      )
      const moreWidth =
        measurer.querySelector<HTMLElement>('[data-menu-measure-more]')?.getBoundingClientRect().width ?? 0
      const totalMenuWidth = menuWidths.reduce((total, width) => total + width, 0)

      if (totalMenuWidth <= availableWidth) {
        setVisibleTopMenuCount(adminNavigation.length)
        return
      }

      const menuAvailableWidth = Math.max(0, availableWidth - moreWidth)
      let usedWidth = 0
      let nextVisibleCount = 0

      for (const width of menuWidths) {
        if (usedWidth + width > menuAvailableWidth) {
          break
        }

        usedWidth += width
        nextVisibleCount += 1
      }

      setVisibleTopMenuCount(nextVisibleCount)
    }

    updateVisibleMenuCount()
    const resizeObserver = new ResizeObserver(updateVisibleMenuCount)
    resizeObserver.observe(navigation)

    return () => resizeObserver.disconnect()
  }, [])

  const handleTopMenuClick = (menu: AdminTopNavigationItem) => {
    navigate(getFirstNavigationPath(menu.sections))
  }

  const handleMobileMenuClick = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const openMobileNavigation = () => {
    setOpenMobileTopMenu(activeTopMenu)
    setOpenMobileSideMenu(parentMenuKey)
    setIsMobileMenuOpen(true)
  }

  const toggleMobileTopMenu = (key: string) => {
    setOpenMobileTopMenu((current) => (current === key ? null : key))
    setOpenMobileSideMenu(null)
  }

  const toggleMobileSideMenu = (key: string) => {
    setOpenMobileSideMenu((current) => (current === key ? null : key))
  }

  const handleToolNavigation = (topMenuKey: string, sideMenuKey: string) => {
    navigate(findNavigationPath(topMenuKey, sideMenuKey))
    setOpenSubmenus({})
  }

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleLayoutModeChange = (mode: AdminLayoutMode) => {
    setLayoutMode(mode)
    setIsCollapsed(false)
  }

  const layoutMenuItems: MenuProps['items'] = [
    { key: 'classic', icon: <PicLeftOutlined />, label: '经典布局' },
    { key: 'mixed', icon: <LayoutOutlined />, label: '混合布局' },
    { key: 'dual', icon: <SplitCellsOutlined />, label: '双列布局' },
  ]

  const handleLayoutMenuClick: MenuProps['onClick'] = ({ key }) => {
    handleLayoutModeChange(key as AdminLayoutMode)
  }

  const renderSideSections = (sections: AdminNavigationSection[]) =>
    sections.map((section, sectionIndex) => (
      <section className="side-section" key={section.title ?? `section-${sectionIndex}`}>
        {section.title ? <h2 className="side-section-title">{section.title}</h2> : null}
        {section.items.map((item) => {
          const hasChildren = Boolean(item.children?.length)
          const hasActiveChild = item.children?.some((child) => child.key === activeSideMenu)
          const isActive = item.key === activeSideMenu
          const isSubmenuExpanded = Boolean(openSubmenus[item.key] || parentMenuKey === item.key)

          return (
            <div key={item.key} className="side-menu-item-wrapper">
              <Tooltip
                title={isCollapsed && !isMobile ? item.label : null}
                placement="right"
                mouseEnterDelay={0.15}
              >
                <button
                  type="button"
                  className={`side-menu-item ${isActive ? 'active' : ''} ${hasActiveChild ? 'has-active-child' : ''}`}
                  aria-expanded={hasChildren ? isSubmenuExpanded : undefined}
                  onClick={() => {
                    if (hasChildren) {
                      toggleSubmenu(item.key)
                      return
                    }

                    if (item.path) {
                      navigate(item.path)
                    }
                  }}
                >
                  {item.icon}
                  <span className="side-menu-text">{item.label}</span>
                  {hasChildren ? (
                    <DownOutlined className={`submenu-arrow ${isSubmenuExpanded ? 'expanded' : ''}`} />
                  ) : null}
                </button>
              </Tooltip>

              {hasChildren ? (
                <ul className={`submenu ${isSubmenuExpanded ? 'expanded' : ''}`}>
                  {item.children?.map((child) => (
                    <li key={child.key}>
                      <button
                        type="button"
                        className={`submenu-item ${activeSideMenu === child.key ? 'active' : ''}`}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )
        })}
      </section>
    ))

  const overflowMenuItems: MenuProps['items'] = overflowTopMenus.map((menu) => ({
    key: menu.key,
    icon: menu.icon,
    label: menu.label,
  }))

  const handleOverflowMenuClick: MenuProps['onClick'] = ({ key }) => {
    const targetMenu = overflowTopMenus.find((menu) => menu.key === key)
    if (targetMenu) {
      handleTopMenuClick(targetMenu)
    }
  }

  return (
    <div className={`admin-shell layout-${layoutMode}`}>
      <header className="admin-header">
        <div className={`brand-section ${isCollapsed && !isMobile ? 'collapsed' : ''}`}>
          <div className="brand" aria-label="皓量云擎IDC业务管理系统运营后台">
            <img className="brand-logo-image" src={logoUrl} alt="" aria-hidden="true" />
            <span className="brand-name">皓量云擎</span>
          </div>
        </div>

        <Button
          type="text"
          className={`sidebar-toggle ${isMobile ? 'mobile' : ''}`}
          icon={
            isMobile ? (
              <MenuOutlined />
            ) : (
              isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            )
          }
          aria-label={isMobile ? '打开全部菜单' : isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          onClick={() => {
            if (isMobile) {
              openMobileNavigation()
              return
            }

            setIsCollapsed((collapsed) => !collapsed)
          }}
        />

        <nav
          ref={topNavigationRef}
          className={`top-navigation ${layoutMode !== 'mixed' ? 'hidden' : ''}`}
          aria-label="一级导航"
        >
          {primaryTopMenus.map((menu) => (
            <button
              key={menu.key}
              type="button"
              className={`top-navigation-item ${activeTopMenu === menu.key ? 'active' : ''}`}
              onClick={() => handleTopMenuClick(menu)}
            >
              <span className="top-navigation-icon">{menu.icon}</span>
              <span>{menu.label}</span>
            </button>
          ))}

          {overflowTopMenus.length > 0 ? (
            <Dropdown
              menu={{ items: overflowMenuItems, onClick: handleOverflowMenuClick }}
              classNames={{ root: 'top-navigation-overflow-dropdown' }}
              styles={{
                item: { fontSize: 'calc(var(--font-size-sm) + 1px)', lineHeight: '23px' },
                itemContent: { fontSize: 'calc(var(--font-size-sm) + 1px)', lineHeight: '23px' },
                itemIcon: { width: 16, minWidth: 16, fontSize: 16 },
              }}
              placement="bottom"
              trigger={['click']}
            >
              <button
                type="button"
                className={`top-navigation-item top-navigation-more ${overflowTopMenus.some((menu) => menu.key === activeTopMenu) ? 'active' : ''}`}
                aria-label="打开更多一级导航"
              >
                <MoreOutlined className="top-navigation-icon" />
              </button>
            </Dropdown>
          ) : null}

          <div ref={topNavigationMeasureRef} className="top-navigation-measurer" aria-hidden="true">
            {adminNavigation.map((menu) => (
              <span className="top-navigation-item" data-menu-measure key={menu.key}>
                <span className="top-navigation-icon">{menu.icon}</span>
                <span>{menu.label}</span>
              </span>
            ))}
            <span className="top-navigation-item top-navigation-more" data-menu-measure-more>
              <MoreOutlined className="top-navigation-icon" />
            </span>
          </div>
        </nav>

        <div className="header-tools">
          <Dropdown
            menu={{
              items: layoutMenuItems,
              onClick: handleLayoutMenuClick,
              selectedKeys: [layoutMode],
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Tooltip title="切换布局">
              <Button
                type="text"
                className="header-tool-button"
                icon={<LayoutOutlined />}
                aria-label="切换布局"
              />
            </Tooltip>
          </Dropdown>

          <Tooltip title="搜索">
            <Button
              type="text"
              className="header-tool-button"
              icon={<SearchOutlined />}
              aria-label="搜索"
            />
          </Tooltip>

          <Tooltip title={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'}>
            <Button
              type="text"
              className="header-tool-button"
              icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              aria-label={themeMode === 'dark' ? '切换为浅色主题' : '切换为深色主题'}
              aria-pressed={themeMode === 'dark'}
              onClick={onThemeModeChange}
            />
          </Tooltip>

          <Tooltip title="通知中心">
            <Badge dot size="small" offset={[-5, 5]}>
              <Button
                type="text"
                className="header-tool-button"
                icon={<BellOutlined />}
                aria-label="通知中心"
                onClick={() => handleToolNavigation('operations', 'announcements')}
              />
            </Badge>
          </Tooltip>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <button type="button" className="user-trigger" aria-label="打开管理员菜单">
              <Avatar size={32} className="user-avatar">超</Avatar>
              <span className="user-name">超级管理员</span>
              <DownOutlined className="user-arrow" />
            </button>
          </Dropdown>
        </div>
      </header>

      {layoutMode === 'classic' ? (
        <aside className={`admin-sidebar classic-sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="经典侧边导航">
          <nav className="classic-navigation">
            {adminNavigation.map((topMenu) => {
              const isExpanded = openClassicTopMenus[topMenu.key] ?? activeTopMenu === topMenu.key
              const isActive = activeTopMenu === topMenu.key

              return (
                <div className="classic-menu-node" key={topMenu.key}>
                  <Tooltip
                    title={isCollapsed && !isMobile ? topMenu.label : null}
                    placement="right"
                    mouseEnterDelay={0.15}
                  >
                    <button
                      type="button"
                      className={`classic-top-menu ${isActive ? 'active' : ''}`}
                      aria-expanded={!isCollapsed ? isExpanded : undefined}
                      onClick={() => {
                        if (isCollapsed) {
                          handleTopMenuClick(topMenu)
                          return
                        }

                        if (!isActive) {
                          handleTopMenuClick(topMenu)
                        }
                        setOpenClassicTopMenus((current) => ({
                          ...current,
                          [topMenu.key]: !isExpanded,
                        }))
                      }}
                    >
                      <span className="classic-top-menu-icon">{topMenu.icon}</span>
                      <span className="classic-top-menu-label">{topMenu.label}</span>
                      <DownOutlined className={`classic-top-menu-arrow ${isExpanded ? 'expanded' : ''}`} />
                    </button>
                  </Tooltip>

                  <div className={`classic-menu-children ${isExpanded ? 'expanded' : ''}`}>
                    {renderSideSections(topMenu.sections)}
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>
      ) : (
        <>
          {layoutMode === 'dual' ? (
            <aside className="dual-primary-rail" aria-label="一级导航">
              {adminNavigation.map((menu) => (
                <Tooltip title={menu.label} placement="right" mouseEnterDelay={0.2} key={menu.key}>
                  <button
                    type="button"
                    className={`dual-primary-item ${activeTopMenu === menu.key ? 'active' : ''}`}
                    onClick={() => handleTopMenuClick(menu)}
                  >
                    <span className="dual-primary-icon">{menu.icon}</span>
                    <span className="dual-primary-label">{menu.label}</span>
                  </button>
                </Tooltip>
              ))}
            </aside>
          ) : null}

          <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="侧边导航">
            {layoutMode === 'dual' && !isCollapsed ? (
              <div className="dual-secondary-heading">
                {adminNavigation.find((menu) => menu.key === activeTopMenu)?.label}
              </div>
            ) : null}
            <div className="sidebar-menu">{renderSideSections(activeSections)}</div>
          </aside>
        </>
      )}

      {!isMobile && layoutMode !== 'classic' ? (
        <div className={`admin-context-bar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Breadcrumb separator="/" items={breadcrumbItems} />
        </div>
      ) : null}

      <Drawer
        className="mobile-navigation-drawer"
        rootClassName="mobile-navigation-drawer-root"
        placement="left"
        size="70vw"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={
          <div className="mobile-drawer-brand">
            <img className="mobile-drawer-logo" src={logoUrl} alt="" aria-hidden="true" />
            <span>皓量云擎</span>
          </div>
        }
      >
        <nav className="mobile-navigation" aria-label="移动端全部导航">
          {adminNavigation.map((topMenu) => {
            const isTopMenuExpanded = openMobileTopMenu === topMenu.key
            const sideMenuItems = topMenu.sections.flatMap((section) => section.items)

            return (
              <div className="mobile-menu-node" key={topMenu.key}>
                <button
                  type="button"
                  className={`mobile-menu-top-item ${activeTopMenu === topMenu.key ? 'active' : ''}`}
                  aria-expanded={isTopMenuExpanded}
                  onClick={() => toggleMobileTopMenu(topMenu.key)}
                >
                  <span className="mobile-menu-icon">{topMenu.icon}</span>
                  <span className="mobile-menu-label">{topMenu.label}</span>
                  <DownOutlined className={`mobile-menu-arrow ${isTopMenuExpanded ? 'expanded' : ''}`} />
                </button>

                <div className={`mobile-menu-children ${isTopMenuExpanded ? 'expanded' : ''}`}>
                  {sideMenuItems.map((item) => {
                    const hasChildren = Boolean(item.children?.length)
                    const hasActiveChild = item.children?.some((child) => child.key === activeSideMenu)
                    const isSideMenuExpanded = openMobileSideMenu === item.key

                    return (
                      <div className="mobile-menu-item-wrapper" key={item.key}>
                        <button
                          type="button"
                          className={`mobile-menu-item ${activeTopMenu === topMenu.key && activeSideMenu === item.key ? 'active' : ''} ${activeTopMenu === topMenu.key && hasActiveChild ? 'has-active-child' : ''}`}
                          aria-expanded={hasChildren ? isSideMenuExpanded : undefined}
                          onClick={() => {
                            if (hasChildren) {
                              toggleMobileSideMenu(item.key)
                              return
                            }

                            if (item.path) {
                              handleMobileMenuClick(item.path)
                            }
                          }}
                        >
                          {item.icon}
                          <span className="mobile-menu-label">{item.label}</span>
                          {hasChildren ? (
                            <DownOutlined className={`mobile-menu-arrow ${isSideMenuExpanded ? 'expanded' : ''}`} />
                          ) : null}
                        </button>

                        {hasChildren ? (
                          <div className={`mobile-submenu ${isSideMenuExpanded ? 'expanded' : ''}`}>
                            {item.children?.map((child) => (
                              <button
                                type="button"
                                key={child.key}
                                className={`mobile-submenu-item ${activeTopMenu === topMenu.key && activeSideMenu === child.key ? 'active' : ''}`}
                                onClick={() => handleMobileMenuClick(child.path)}
                              >
                                {child.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </Drawer>

      <main className={`admin-main ${isCollapsed ? 'sidebar-collapsed' : ''}`} aria-label="后台内容区域">
        {isMobile || layoutMode === 'classic' ? (
          <Breadcrumb className="admin-content-breadcrumb" separator="/" items={breadcrumbItems} />
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
