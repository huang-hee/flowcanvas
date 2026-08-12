import {
  BlockOutlined,
  DashboardOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface MenuEntry {
  /** 路由 path（不含 hash 前缀） */
  path: string
  title: string
  icon: ReactNode
  /** 本次是否已实现；false 走占位页（spec-ui.md §2.2） */
  implemented: boolean
}

/**
 * **一份配置同时供给侧栏菜单与头部标题**（08 §2.1）——外壳读的是自己的配置，
 * 无跨层通信，菜单与标题永不失同步。
 *
 * 推论：**页面不参与头部渲染，禁止任何形式的回写**。
 *
 * 六项与 05 §1 的左菜单一致；path 中只有 /meta-fields 来自 05 §2 已定义的路由，
 * 其余五条为本次新拟，各页开工时须以 05 §2 复核。
 * 图标为本次新拟（08 §2.3 只要求「各配一枚 @ant-design/icons 图标」），无设计稿依据。
 */
export const MENUS: readonly MenuEntry[] = [
  { path: '/dashboard', title: '仪表盘', icon: <DashboardOutlined />, implemented: false },
  { path: '/meta-fields', title: '元字段', icon: <TagsOutlined />, implemented: true },
  { path: '/node-schemas', title: '节点模型', icon: <BlockOutlined />, implemented: false },
  { path: '/driver-plans', title: '驱动方案', icon: <ThunderboltOutlined />, implemented: false },
  { path: '/flows', title: '流程页面', icon: <PartitionOutlined />, implemented: false },
  { path: '/runs', title: '实例列表', icon: <PlayCircleOutlined />, implemented: false },
]

export const DEFAULT_PATH = '/dashboard'
