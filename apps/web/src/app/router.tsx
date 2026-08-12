import type { ComponentType } from 'react'
import { createHashRouter, redirect } from 'react-router'

import { MetaFieldsPage } from '../pages/meta-fields/MetaFieldsPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { DEFAULT_PATH, MENUS } from '../shell/menus'
import { Shell } from '../shell/Shell'

/** 已实现的页面。未列出的一律走占位页（spec-ui.md §2.2）。 */
const PAGE_COMPONENTS: Partial<Record<string, ComponentType>> = {
  '/meta-fields': MetaFieldsPage,
}

/**
 * 06 §1：用 createHashRouter（data router）——`useMatches` 不支持 Declarative 模式。
 *
 * 每条路由的 `handle.title` **从 MENUS 派生**，不另写一份：
 * menus 是标题与菜单的单一来源（08 §2.1）。
 */
export const router = createHashRouter([
  {
    path: '/',
    Component: Shell,
    children: [
      { index: true, loader: () => redirect(DEFAULT_PATH) },
      ...MENUS.map((entry) => ({
        path: entry.path.replace(/^\//, ''),
        Component: PAGE_COMPONENTS[entry.path] ?? PlaceholderPage,
        handle: { title: entry.title },
      })),
    ],
  },
])
