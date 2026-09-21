import type { ReactNode } from 'react'
import type { MenuDataItem } from '@ant-design/pro-components'
import {
  ApiOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  CloudOutlined,
  CloudServerOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  GiftOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'

/** 三级菜单配置。 */
export interface AdminNavigationLeaf {
  key: string
  label: string
  path: string
}

/** 二级菜单配置。 */
export interface AdminNavigationItem {
  key: string
  label: string
  icon: ReactNode
  path?: string
  children?: AdminNavigationLeaf[]
}

/** 侧边菜单区域配置。 */
export interface AdminNavigationSection {
  title?: string
  items: AdminNavigationItem[]
}

/** 一级菜单配置。 */
export interface AdminTopNavigationItem {
  key: string
  label: string
  icon: ReactNode
  sections: AdminNavigationSection[]
}

/** 路由对应的菜单选中信息。 */
export interface AdminNavigationSelection {
  topMenuKey: string
  sideMenuKey: string
  parentMenuKey: string | null
}

/** 后台业务页面路由定义。 */
export interface AdminPageRoute {
  key: string
  path: string
  title: string
  topMenuLabel: string
  parentMenuLabel?: string
}

/** 运营后台完整导航配置。 */
export const adminNavigation: AdminTopNavigationItem[] = [
  {
    key: 'workspace',
    label: '总览',
    icon: <DashboardOutlined />,
    sections: [
      {
        items: [
          { key: 'dashboard', label: '工作台', path: '/dashboard', icon: <DashboardOutlined className="side-menu-icon" /> },
          { key: 'analysis', label: '分析页', path: '/analysis', icon: <DatabaseOutlined className="side-menu-icon" /> },
          { key: 'tasks', label: '待办事项', path: '/tasks', icon: <NotificationOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: '资源',
    icon: <CloudServerOutlined />,
    sections: [
      {
        items: [
          { key: 'resource-pool', label: '资源池', path: '/resource-pools', icon: <DatabaseOutlined className="side-menu-icon" /> },
          { key: 'upstream', label: '上游管理', path: '/upstreams', icon: <CloudServerOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'products',
    label: '产品',
    icon: <AppstoreOutlined />,
    sections: [
      {
        items: [
          {
            key: 'product-management',
            label: '产品管理',
            icon: <AppstoreOutlined className="side-menu-icon" />,
            children: [
              { key: 'product-list', label: '产品列表', path: '/products' },
              { key: 'product-category', label: '产品分类', path: '/product-categories' },
              { key: 'product-pricing', label: '定价配置', path: '/product-pricing' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: '服务',
    icon: <CustomerServiceOutlined />,
    sections: [
      {
        items: [
          {
            key: 'order-services',
            label: '订单服务',
            icon: <ShoppingCartOutlined className="side-menu-icon" />,
            children: [
              { key: 'order-list', label: '订单列表', path: '/orders' },
              { key: 'renewal-list', label: '续费管理', path: '/renewals' },
              { key: 'refund-list', label: '退款管理', path: '/refunds' },
            ],
          },
          { key: 'tickets', label: '工单管理', path: '/tickets', icon: <CustomerServiceOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'customers',
    label: '客户',
    icon: <TeamOutlined />,
    sections: [
      {
        items: [
          { key: 'customer-list', label: '客户列表', path: '/customers', icon: <UserOutlined className="side-menu-icon" /> },
          { key: 'customer-groups', label: '客户分组', path: '/customer-groups', icon: <TeamOutlined className="side-menu-icon" /> },
          { key: 'real-name', label: '实名认证', path: '/real-name-verifications', icon: <SafetyCertificateOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: '财务',
    icon: <WalletOutlined />,
    sections: [
      {
        items: [
          { key: 'transactions', label: '资金流水', path: '/transactions', icon: <WalletOutlined className="side-menu-icon" /> },
          { key: 'invoices', label: '发票管理', path: '/invoices', icon: <FileTextOutlined className="side-menu-icon" /> },
          { key: 'settlement', label: '上下游结算', path: '/settlements', icon: <TransactionOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'marketing',
    label: '营销',
    icon: <GiftOutlined />,
    sections: [
      {
        items: [
          { key: 'campaigns', label: '活动管理', path: '/campaigns', icon: <GiftOutlined className="side-menu-icon" /> },
          { key: 'coupons', label: '优惠券', path: '/coupons', icon: <TagsOutlined className="side-menu-icon" /> },
          { key: 'referrals', label: '邀请返利', path: '/referrals', icon: <TeamOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'site',
    label: '站务',
    icon: <CloudOutlined />,
    sections: [
      {
        items: [
          { key: 'announcements', label: '公告管理', path: '/announcements', icon: <NotificationOutlined className="side-menu-icon" /> },
          { key: 'website', label: '官网与主题', path: '/website-themes', icon: <CloudOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'application-center',
    label: '应用',
    icon: <AppstoreAddOutlined />,
    sections: [
      {
        items: [
          { key: 'applications', label: '应用管理', path: '/applications', icon: <AppstoreAddOutlined className="side-menu-icon" /> },
          { key: 'application-market', label: '应用市场', path: '/application-market', icon: <ShopOutlined className="side-menu-icon" /> },
          { key: 'connectors', label: '对接插件', path: '/connectors', icon: <ApiOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'system',
    label: '系统',
    icon: <SettingOutlined />,
    sections: [
      {
        items: [
          { key: 'administrators', label: '管理员', path: '/administrators', icon: <TeamOutlined className="side-menu-icon" /> },
          { key: 'roles', label: '角色权限', path: '/roles', icon: <SafetyCertificateOutlined className="side-menu-icon" /> },
          { key: 'settings', label: '系统设置', path: '/settings', icon: <SettingOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
  {
    key: 'audit',
    label: '审计',
    icon: <FileTextOutlined />,
    sections: [
      {
        items: [
          { key: 'operation-logs', label: '操作日志', path: '/audit/operations', icon: <FileTextOutlined className="side-menu-icon" /> },
          { key: 'login-logs', label: '登录日志', path: '/audit/logins', icon: <SafetyCertificateOutlined className="side-menu-icon" /> },
          { key: 'system-logs', label: '系统日志', path: '/audit/system', icon: <DatabaseOutlined className="side-menu-icon" /> },
        ],
      },
    ],
  },
]

/** 由导航配置生成全部可访问页面路由。 */
export const adminPageRoutes: AdminPageRoute[] = adminNavigation.flatMap((topMenu) =>
  topMenu.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      if (item.children?.length) {
        return item.children.map((child) => ({
          key: child.key,
          path: child.path,
          title: child.label,
          topMenuLabel: topMenu.label,
          parentMenuLabel: item.label,
        }))
      }

      return item.path
        ? [{ key: item.key, path: item.path, title: item.label, topMenuLabel: topMenu.label }]
        : []
    }),
  ),
)

/**
 * 将后台导航配置转换为 ProLayout 菜单数据。
 * @returns ProLayout 可直接消费的分层菜单数据
 */
export function createProLayoutMenuData(): MenuDataItem[] {
  return adminNavigation.map((topMenu) => ({
    key: topMenu.key,
    path: getFirstNavigationPath(topMenu.sections),
    name: topMenu.label,
    icon: topMenu.icon,
    children: topMenu.sections.flatMap((section) => section.items.map((item) => ({
      key: item.key,
      path: item.path ?? item.children?.[0]?.path,
      name: item.label,
      icon: item.icon,
      children: item.children?.map((child) => ({
        key: child.key,
        path: child.path,
        name: child.label,
      })),
    }))),
  }))
}

/**
 * 获取一级菜单对应的默认页面路径。
 * @param sections 一级菜单下的侧边菜单区域
 * @returns 首个可访问菜单的路径
 */
export function getFirstNavigationPath(sections: AdminNavigationSection[]): string {
  const firstItem = sections[0]?.items[0]
  return firstItem?.children?.[0]?.path ?? firstItem?.path ?? '/dashboard'
}

/**
 * 根据当前路由定位导航选中状态。
 * @param pathname 当前相对后台根路径的路由
 * @returns 匹配到的一级、二级或三级菜单信息
 */
export function findNavigationSelection(pathname: string): AdminNavigationSelection {
  for (const topMenu of adminNavigation) {
    for (const section of topMenu.sections) {
      for (const item of section.items) {
        if (item.path === pathname) {
          return { topMenuKey: topMenu.key, sideMenuKey: item.key, parentMenuKey: null }
        }

        const child = item.children?.find((candidate) => candidate.path === pathname)
        if (child) {
          return { topMenuKey: topMenu.key, sideMenuKey: child.key, parentMenuKey: item.key }
        }
      }
    }
  }

  return { topMenuKey: adminNavigation[0].key, sideMenuKey: adminNavigation[0].sections[0].items[0].key, parentMenuKey: null }
}

/**
 * 根据菜单标识查找目标页面路径。
 * @param topMenuKey 一级菜单标识
 * @param sideMenuKey 二级或三级菜单标识
 * @returns 匹配到的页面路径，未匹配时返回默认工作台路径
 */
export function findNavigationPath(topMenuKey: string, sideMenuKey: string): string {
  const topMenu = adminNavigation.find((menu) => menu.key === topMenuKey)
  if (!topMenu) {
    return '/dashboard'
  }

  for (const item of topMenu.sections.flatMap((section) => section.items)) {
    if (item.key === sideMenuKey && item.path) {
      return item.path
    }

    const child = item.children?.find((candidate) => candidate.key === sideMenuKey)
    if (child) {
      return child.path
    }
  }

  return getFirstNavigationPath(topMenu.sections)
}
