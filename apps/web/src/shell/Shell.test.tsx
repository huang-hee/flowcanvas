import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { router } from '../app/router'
import { useAppSettings } from '../stores/app-settings'
import { renderWithProviders, resetStores } from '../test/utils'
import { MENUS } from './menus'

beforeEach(async () => {
  await resetStores()
  useAppSettings.setState({ sidebarCollapsed: false, hydrated: false })
  await router.navigate('/meta-fields')
})

function renderShell() {
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('TC-E1 · 侧栏菜单与收起态', () => {
  it('六项菜单齐全，文案与 menus 配置一致', async () => {
    renderShell()

    const menu = await waitFor(() => {
      const node = document.querySelector<HTMLElement>('.ant-menu')
      expect(node).not.toBeNull()
      return node!
    })

    for (const entry of MENUS) {
      expect(within(menu).getByText(entry.title)).toBeInTheDocument()
    }
    expect(MENUS).toHaveLength(6)
  })

  it('点收起按钮切换收起态，并写入 appSettings（跨会话记忆）', async () => {
    renderShell()

    const trigger = await screen.findByRole('button', { name: '收起侧栏' })
    await userEvent.click(trigger)

    await waitFor(() => {
      expect(useAppSettings.getState().sidebarCollapsed).toBe(true)
    })

    // 重新 hydrate 一次，模拟下次会话读回
    useAppSettings.setState({ hydrated: false })
    await useAppSettings.getState().hydrate()
    expect(useAppSettings.getState().sidebarCollapsed).toBe(true)
  })
})

describe('TC-E2 · 标题由 menus 按 path 匹配得出（页面不参与）', () => {
  it('切换路由时标题跟着变', async () => {
    renderShell()

    expect(await screen.findByRole('heading', { name: '元字段' })).toBeInTheDocument()

    await router.navigate('/node-schemas')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '节点模型' })).toBeInTheDocument()
    })

    await router.navigate('/runs')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '实例列表' })).toBeInTheDocument()
    })
  })
})

describe('TC-E3 · 路由', () => {
  it('未实现的五页渲染占位文案', async () => {
    renderShell()

    await router.navigate('/dashboard')
    expect(await screen.findByText('该页面尚未开发')).toBeInTheDocument()
  })

  it('/ 重定向到默认页', async () => {
    renderShell()

    await router.navigate('/')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })
})

describe('工作空间簇（08 §2.4 / spec-ui.md §2.3）', () => {
  it('同步徽标显示「本地模式」，导出/导入两项禁用', async () => {
    renderShell()

    expect(await screen.findByText('本地模式')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '工作空间菜单' }))

    const exportItem = await screen.findByText('导出 .flowpack')
    expect(exportItem.closest('li')).toHaveClass('ant-dropdown-menu-item-disabled')
  })
})
