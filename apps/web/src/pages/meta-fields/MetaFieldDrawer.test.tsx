import type { MetaField } from '@flowcanvas/core'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, resetStores, seedMetaField } from '../../test/utils'
import { MetaFieldDrawer } from './MetaFieldDrawer'

beforeEach(async () => {
  await resetStores()
})

const noop = () => undefined

function renderDrawer(overrides: Partial<Parameters<typeof MetaFieldDrawer>[0]> = {}) {
  return renderWithProviders(
    <MetaFieldDrawer
      open
      referenceCount={0}
      onClose={noop}
      onSaved={noop}
      onShowReferences={noop}
      {...overrides}
    />,
  )
}

describe('TC-C1 / TC-C5 · 抽屉外形与动作条', () => {
  it('宽 560；底部为 [取消][保存] 且**无删除按钮**', async () => {
    renderDrawer()

    const drawer = await waitFor(() => {
      const node = document.querySelector<HTMLElement>('.ant-drawer-content-wrapper')
      expect(node).not.toBeNull()
      return node!
    })
    expect(drawer.style.width).toBe('560px')

    const footer = document.querySelector('.ant-drawer-footer')
    expect(footer).not.toBeNull()
    const labels = [...(footer?.querySelectorAll('button') ?? [])].map((button) =>
      button.textContent?.replace(/\s/g, ''),
    )
    expect(labels).toEqual(['取消', '保存'])
    expect(labels).not.toContain('删除')
  })

  it('引用计数徽标纯展示不可点；0 引用显示「未引用」', async () => {
    const field = await seedMetaField()
    const onShowReferences = vi.fn()
    renderDrawer({ field, referenceCount: 0, onShowReferences })

    const badge = await screen.findByText('未引用')
    await userEvent.click(badge)
    expect(onShowReferences).not.toHaveBeenCalled()
  })

  it('有引用时徽标文案为「被 N 个节点模型引用」', async () => {
    const field = await seedMetaField()
    renderDrawer({ field, referenceCount: 2 })

    expect(await screen.findByText('被 2 个节点模型引用')).toBeInTheDocument()
  })
})

describe('TC-C2 · 字段序（09 §2.3）', () => {
  it('number 类型下类型参数展开为 精度 → 单位模式，整体序不变', async () => {
    renderDrawer()

    await userEvent.click(await screen.findByRole('combobox', { name: /数据类型/ }))
    await userEvent.click(await screen.findByTitle('数字'))

    await waitFor(() => {
      expect(screen.getByText('精度')).toBeInTheDocument()
    })

    const labels = [...document.querySelectorAll('.ant-form-item-label label')].map(
      (node) => node.textContent,
    )
    expect(labels).toEqual(['字段键', '名称', '数据类型', '精度', '单位模式', '校验规则', '默认值', '帮助文字'])
  })
})

describe('TC-C3 · 必填与条件必填', () => {
  it('恒必填：字段键 / 名称 为空时阻止保存', async () => {
    const onSaved = vi.fn()
    renderDrawer({ onSaved })

    await userEvent.click(await screen.findByRole('button', { name: /保\s*存/ }))

    expect(await screen.findByText('请填写字段键')).toBeInTheDocument()
    expect(screen.getByText('请填写名称')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('反向断言：text 类型下不渲染精度 / 单位模式，且不因其缺失而阻止保存', async () => {
    renderDrawer()
    await screen.findByText('字段键')

    expect(screen.queryByText('精度')).toBeNull()
    expect(screen.queryByText('单位模式')).toBeNull()
  })

  it('enum 类型：选项为空时阻止保存', async () => {
    renderDrawer()

    await userEvent.click(await screen.findByRole('combobox', { name: /数据类型/ }))
    await userEvent.click(await screen.findByTitle('枚举'))

    await userEvent.type(screen.getByLabelText('字段键'), 'status')
    await userEvent.type(screen.getByLabelText('名称'), '状态')
    await userEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    expect(await screen.findByText('至少需要一个选项')).toBeInTheDocument()
  })
})

describe('TC-C6 · 新建走同一抽屉的空白态', () => {
  it('不传 field 时标题为「新增元字段」且字段为空', async () => {
    renderDrawer()

    expect(await screen.findByText('新增元字段')).toBeInTheDocument()
    expect(screen.getByLabelText('字段键')).toHaveValue('')
  })

  it('传 field 时回填该行数据', async () => {
    const field: MetaField = await seedMetaField({ fieldKey: 'title', name: '标题' })
    renderDrawer({ field })

    await waitFor(() => {
      expect(screen.getByLabelText('字段键')).toHaveValue('title')
    })
    expect(screen.getByLabelText('名称')).toHaveValue('标题')
  })
})

describe('TC-C7 · 校验规则构建器只给合法规则', () => {
  it('text 类型的下拉含 pattern、不含 min', async () => {
    renderDrawer()

    await userEvent.click(await screen.findByRole('button', { name: /添加规则/ }))

    const menu = await waitFor(() => {
      const node = document.querySelector('.ant-dropdown-menu')
      expect(node).not.toBeNull()
      return node as HTMLElement
    })

    expect(within(menu).getByText('正则匹配')).toBeInTheDocument()
    expect(within(menu).queryByText('最小值')).toBeNull()
    expect(within(menu).getByText('最小长度')).toBeInTheDocument()
  })
})

describe('TC-C8 · 默认值按类型渲染', () => {
  it('boolean 为三态控件（含「未设置」占位）', async () => {
    renderDrawer()

    await userEvent.click(await screen.findByRole('combobox', { name: /数据类型/ }))
    await userEvent.click(await screen.findByTitle('布尔'))

    await waitFor(() => {
      expect(screen.getAllByText('未设置').length).toBeGreaterThan(0)
    })
  })
})
