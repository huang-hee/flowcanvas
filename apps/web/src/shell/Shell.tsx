import { MenuFoldOutlined, MenuUnfoldOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, Layout, Menu, Tag, Tooltip } from 'antd'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router'

import { useAppSettings } from '../stores/app-settings'
import { MENUS } from './menus'
import styles from './Shell.module.css'

interface RouteHandle {
  title?: string
}

/**
 * 控制台外壳（08 §2）。左右两栏：Sidebar 固定宽全高、MainColumn flex 占剩余。
 * **页面级永不滚动**，一切滚动发生在面板主体内（08 §2.1）。
 */
export function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const matches = useMatches()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppSettings()

  /**
   * 标题由 menus 配置按当前 path 匹配得出（08 §2.1）。
   * 走 useMatches + route.handle —— 这正是 06 §1 选 React Router 的理由：
   * 「路由携带元数据 + 读出当前匹配」。页面不参与，也无法回写。
   */
  const title =
    [...matches].reverse().find((match) => (match.handle as RouteHandle | undefined)?.title)
      ?.handle as RouteHandle | undefined

  const selectedKey = MENUS.find((entry) => location.pathname.startsWith(entry.path))?.path

  return (
    <Layout className={styles.shell}>
      <Layout.Sider
        theme="light"
        width={240}
        collapsedWidth={64}
        collapsed={sidebarCollapsed}
        trigger={null}
        className={styles.sidebar}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} aria-hidden />
          {!sidebarCollapsed && <span className={styles.appName}>FlowCanvas</span>}
        </div>

        <div className={styles.sidebarBody}>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={MENUS.map((entry) => ({
              key: entry.path,
              icon: entry.icon,
              label: entry.title,
            }))}
            onClick={({ key }) => void navigate(key)}
          />
        </div>

        <div className={styles.sidebarFooter}>
          <Button
            type="text"
            aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
      </Layout.Sider>

      <Layout className={styles.mainColumn}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{title?.title ?? ''}</h1>

          {/* 工作空间簇永远钉在最右角，跨页位置恒定（08 §2.4） */}
          <div className={styles.headerRight}>
            <Divider type="vertical" />
            <Tag className={styles.syncBadge}>本地模式</Tag>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'export',
                    label: (
                      <Tooltip title="阶段一后续提供" placement="left">
                        <span>导出 .flowpack</span>
                      </Tooltip>
                    ),
                    disabled: true,
                  },
                  {
                    key: 'import',
                    label: (
                      <Tooltip title="阶段一后续提供" placement="left">
                        <span>导入 .flowpack</span>
                      </Tooltip>
                    ),
                    disabled: true,
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} aria-label="工作空间菜单" />
            </Dropdown>
          </div>
        </div>

        <div className={styles.pageBody}>
          <Outlet />
        </div>
      </Layout>
    </Layout>
  )
}
