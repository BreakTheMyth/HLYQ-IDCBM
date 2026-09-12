import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Avatar } from 'antd'
import {
  ApiOutlined,
  AppstoreOutlined,
  CloudOutlined,
  CloudServerOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DownOutlined,
  FileTextOutlined,
  GiftOutlined,
  LeftOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import './AdminLayout.css'

interface SideMenuItem {
  key: string
  label: string
  icon: ReactNode
  children?: Array<{
    key: string
    label: string
  }>
}

interface SideMenuSection {
  title: string
  items: SideMenuItem[]
}

interface TopMenuItem {
  key: string
  label: string
  sections: SideMenuSection[]
}

const topMenus: TopMenuItem[] = [
  {
    key: 'workspace',
    label: '工作台',
    sections: [
      {
        title: '工作台',
        items: [
          { key: 'dashboard', label: '经营概览', icon: <DashboardOutlined className="menu-icon" /> },
          { key: 'tasks', label: '待办事项', icon: <NotificationOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'products',
    label: '产品',
    sections: [
      {
        title: '产品中心',
        items: [
          {
            key: 'product-management',
            label: '产品管理',
            icon: <AppstoreOutlined className="menu-icon" />,
            children: [
              { key: 'product-list', label: '产品列表' },
              { key: 'product-category', label: '产品分类' },
              { key: 'product-pricing', label: '定价配置' },
            ],
          },
          { key: 'resource-pool', label: '资源池', icon: <DatabaseOutlined className="menu-icon" /> },
        ],
      },
      {
        title: '供应与交付',
        items: [
          { key: 'upstream', label: '上游管理', icon: <CloudServerOutlined className="menu-icon" /> },
          { key: 'connectors', label: '接口插件', icon: <ApiOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'orders',
    label: '订单',
    sections: [
      {
        title: '交易管理',
        items: [
          { key: 'order-list', label: '订单列表', icon: <ShoppingCartOutlined className="menu-icon" /> },
          { key: 'renewal-list', label: '续费管理', icon: <TransactionOutlined className="menu-icon" /> },
          { key: 'refund-list', label: '退款管理', icon: <FileTextOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'customers',
    label: '客户',
    sections: [
      {
        title: '客户管理',
        items: [
          { key: 'customer-list', label: '客户列表', icon: <UserOutlined className="menu-icon" /> },
          { key: 'customer-groups', label: '客户分组', icon: <TeamOutlined className="menu-icon" /> },
          { key: 'real-name', label: '实名认证', icon: <SafetyCertificateOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: '财务',
    sections: [
      {
        title: '财务中心',
        items: [
          { key: 'transactions', label: '资金流水', icon: <WalletOutlined className="menu-icon" /> },
          { key: 'invoices', label: '发票管理', icon: <FileTextOutlined className="menu-icon" /> },
          { key: 'settlement', label: '上下游结算', icon: <TransactionOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'marketing',
    label: '营销',
    sections: [
      {
        title: '营销中心',
        items: [
          { key: 'campaigns', label: '活动管理', icon: <GiftOutlined className="menu-icon" /> },
          { key: 'coupons', label: '优惠券', icon: <TagsOutlined className="menu-icon" /> },
          { key: 'referrals', label: '邀请返利', icon: <TeamOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'operations',
    label: '运营',
    sections: [
      {
        title: '运营管理',
        items: [
          { key: 'tickets', label: '工单管理', icon: <CustomerServiceOutlined className="menu-icon" /> },
          { key: 'announcements', label: '公告管理', icon: <NotificationOutlined className="menu-icon" /> },
          { key: 'website', label: '官网与主题', icon: <CloudOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'system',
    label: '系统',
    sections: [
      {
        title: '系统管理',
        items: [
          { key: 'administrators', label: '管理员', icon: <TeamOutlined className="menu-icon" /> },
          { key: 'roles', label: '角色权限', icon: <SafetyCertificateOutlined className="menu-icon" /> },
          { key: 'settings', label: '系统设置', icon: <SettingOutlined className="menu-icon" /> },
        ],
      },
    ],
  },
]

function getFirstMenuKey(sections: SideMenuSection[]) {
  const firstItem = sections[0]?.items[0]
  return firstItem?.children?.[0]?.key ?? firstItem?.key ?? ''
}

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [activeTopMenu, setActiveTopMenu] = useState(topMenus[0].key)
  const [activeSideMenu, setActiveSideMenu] = useState(getFirstMenuKey(topMenus[0].sections))
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  const activeSections = useMemo(
    () => topMenus.find((menu) => menu.key === activeTopMenu)?.sections ?? [],
    [activeTopMenu],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-actions')) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleTopMenuClick = (menu: TopMenuItem) => {
    setActiveTopMenu(menu.key)
    setActiveSideMenu(getFirstMenuKey(menu.sections))

    const firstExpandableItem = menu.sections
      .flatMap((section) => section.items)
      .find((item) => item.children?.length)

    setOpenSubmenus(firstExpandableItem ? { [firstExpandableItem.key]: true } : {})
  }

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="dmixed-container">
      <header className="header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo" aria-label="皓量云擎IDC业务管理系统运营后台">
              <div className="logo-icon" aria-hidden="true">
                <CloudServerOutlined />
              </div>
              <span className="brand-name">皓量云擎</span>
            </div>
          </div>

          <nav className="top-menu" aria-label="一级导航">
            {topMenus.map((menu) => (
              <button
                key={menu.key}
                type="button"
                className={`menu-item ${activeTopMenu === menu.key ? 'active' : ''}`}
                onClick={() => handleTopMenuClick(menu)}
              >
                {menu.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <div className="user-actions">
            <button
              type="button"
              className="user-trigger"
              aria-haspopup="menu"
              aria-expanded={userDropdownOpen}
              onClick={() => setUserDropdownOpen((open) => !open)}
            >
              <Avatar size={32} className="avatar">管</Avatar>
              <span className="user-name">系统管理员</span>
            </button>

            <div className={`dropdown ${userDropdownOpen ? 'show' : ''}`} role="menu">
              <button type="button" className="dropdown-item" role="menuitem">个人资料</button>
              <button type="button" className="dropdown-item" role="menuitem">意见反馈</button>
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item" role="menuitem">退出登录</button>
            </div>
          </div>
        </div>
      </header>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="侧边导航">
        <div className="sidebar-content">
          <div className="sidebar-menu">
            {activeSections.map((section) => (
              <section className="side-section" key={section.title}>
                <h2 className="side-section-title">{section.title}</h2>
                {section.items.map((item) => {
                  const hasChildren = Boolean(item.children?.length)
                  const hasActiveChild = item.children?.some((child) => child.key === activeSideMenu)
                  const isActive = item.key === activeSideMenu

                  return (
                    <div key={item.key} className="menu-item-wrapper">
                      {hasChildren ? (
                        <>
                          <button
                            type="button"
                            className={`menu-link ${isActive ? 'active' : ''} ${hasActiveChild ? 'has-active-child' : ''}`}
                            data-toggle="submenu"
                            aria-expanded={Boolean(openSubmenus[item.key])}
                            onClick={() => toggleSubmenu(item.key)}
                          >
                            {item.icon}
                            <span className="menu-text">{item.label}</span>
                            <DownOutlined className={`expand-arrow ${openSubmenus[item.key] ? 'rotated' : ''}`} />
                          </button>

                          <ul className={`submenu ${openSubmenus[item.key] ? 'expanded' : ''}`}>
                            {item.children?.map((child) => (
                              <li key={child.key}>
                                <button
                                  type="button"
                                  className={`menu-link ${activeSideMenu === child.key ? 'active' : ''}`}
                                  onClick={() => setActiveSideMenu(child.key)}
                                >
                                  {child.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={`menu-link ${isActive ? 'active' : ''}`}
                          onClick={() => setActiveSideMenu(item.key)}
                        >
                          {item.icon}
                          <span className="menu-text">{item.label}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={`toggle-sidebar ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed((collapsed) => !collapsed)}
        aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        <LeftOutlined className="toggle-sidebar-icon" />
      </button>

      <main className="main-container" aria-label="后台内容区域" />
    </div>
  )
}

export default AdminLayout
