import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders, resetStores, seedMetaField, seedNodeSchemaReferencing } from '../../test/utils'
import { MetaFieldsPage } from './MetaFieldsPage'
import { useMetaFields } from './store'

beforeEach(async () => {
  await resetStores()
  useMetaFields.setState({ items: [], referenceCounts: {}, status: 'ok', loading: false })
})

async function renderPage() {
  const result = renderWithProviders(<MetaFieldsPage />)
  await waitFor(() => {
    expect(screen.getByText('元字段列表')).toBeInTheDocument()
  })
  return result
}

describe('TC-B2 / TC-B9 · 表格结构与工具条', () => {
  it('六列齐全且顺序正确，工具条左标题右主按钮', async () => {
    await seedMetaField()
    await renderPage()

    const headers = await screen.findAllByRole('columnheader')
    expect(headers.map((cell) => cell.textContent)).toEqual([
      '名称',
      '字段键',
      '数据类型',
      '被引用',
      '更新时间',
      '操作',
    ])

    expect(screen.getByText('元字段列表')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增元字段' })).toBeInTheDocument()
  })

  it('TC-B7 · 不开列排序与表头筛选漏斗', async () => {
    await seedMetaField()
    await renderPage()

    expect(document.querySelectorAll('.ant-table-column-sorter')).toHaveLength(0)
    expect(document.querySelectorAll('.ant-table-filter-trigger')).toHaveLength(0)
  })
})

describe('TC-B3 / TC-B4 · 单元格渲染', () => {
  it('更新时间按 YYYY-MM-DD HH:mm 渲染（无秒）', async () => {
    await seedMetaField()
    await renderPage()

    const cell = await screen.findByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(cell).toBeInTheDocument()
  })

  it('数据类型渲染为 Tag 而非纯文本', async () => {
    await seedMetaField({ dataType: 'text' })
    await renderPage()

    const tag = document.querySelector('.ant-tag')
    expect(tag).not.toBeNull()
    expect(tag?.textContent).toBe('文本')
  })
})

describe('TC-B5 · 被引用列', () => {
  it('无引用时显示「未引用」且不可点', async () => {
    await seedMetaField()
    await renderPage()

    const cell = await screen.findByText('未引用')
    expect(cell.tagName).not.toBe('A')
  })

  it('有引用时显示「N 个模型」且可点', async () => {
    const field = await seedMetaField()
    await seedNodeSchemaReferencing(field.metaFieldId)
    await renderPage()

    const link = await screen.findByText('1 个模型')
    expect(link.tagName).toBe('A')
  })
})

describe('TC-B6 · 行点击与 stopPropagation', () => {
  it('点行空白处打开编辑抽屉', async () => {
    await seedMetaField({ name: '标题' })
    await renderPage()

    await userEvent.click(await screen.findByText('标题'))

    await waitFor(() => {
      expect(document.querySelector('.ant-drawer')).not.toBeNull()
    })
  })

  it('点「被引用」单元格只开引用清单模态，不开抽屉', async () => {
    const field = await seedMetaField()
    await seedNodeSchemaReferencing(field.metaFieldId)
    await renderPage()

    await userEvent.click(await screen.findByText('1 个模型'))

    await waitFor(() => {
      expect(document.querySelector('.ant-modal')).not.toBeNull()
    })
    expect(document.querySelector('.ant-drawer-open')).toBeNull()
  })
})

describe('TC-B8 · 空态与错误态（08 §5.4）', () => {
  it('无数据时展示空态文案，且筛选面板与工具条仍可见', async () => {
    await renderPage()

    expect(await screen.findByText(/暂无元字段数据，/)).toBeInTheDocument()
    expect(screen.getByText('元字段列表')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入名称或字段键查询')).toBeInTheDocument()
    // antd 的 autoInsertSpace 会把双字按钮渲染成「查 询」（仅对有边框的变体生效，
    // type="link" 的「编辑」「删除」不受影响），故用正则匹配可访问名。
    expect(screen.getByRole('button', { name: /查\s*询/ })).toBeInTheDocument()
  })

  it('错误态切换文案，且 loading 必须为 false（否则会一直转圈）', async () => {
    await renderPage()
    useMetaFields.setState({ status: 'error', loading: false })

    expect(await screen.findByText(/请求出错，/)).toBeInTheDocument()
    expect(useMetaFields.getState().loading).toBe(false)
  })
})

describe('TC-B1 · 筛选点「查询」才生效', () => {
  it('输入关键词后不点查询，列表不变；点查询后过滤；点重置恢复', async () => {
    await seedMetaField({ fieldKey: 'title', name: '标题' })
    await seedMetaField({ fieldKey: 'duration', name: '预计时长', dataType: 'number', numberConfig: { precision: 0 } })
    await renderPage()

    expect(await screen.findByText('标题')).toBeInTheDocument()
    expect(screen.getByText('预计时长')).toBeInTheDocument()

    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByPlaceholderText('请输入名称或字段键查询'), '时长')
    // 未点查询——两行都还在
    expect(screen.getByText('标题')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /查\s*询/ }))
    await waitFor(() => {
      expect(screen.queryByText('标题')).toBeNull()
    })
    expect(screen.getByText('预计时长')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /重\s*置/ }))
    await waitFor(() => {
      expect(screen.getByText('标题')).toBeInTheDocument()
    })
  })
})

describe('TC-D3 / TC-D4 · 删除确认与被引用禁删', () => {
  it('未被引用：确认框文案与按钮符合确认型规格', async () => {
    await seedMetaField()
    await renderPage()

    await userEvent.click(await screen.findByRole('button', { name: '删除' }))

    const dialog = await screen.findByRole('dialog')
    // Modal.confirm 的标题同时出现在 .ant-modal-confirm-title 与 aria-labelledby 关联处
    expect(within(dialog).getAllByText('确认删除元字段').length).toBeGreaterThan(0)
    expect(
      within(dialog).getByText('删除后不可恢复。该元字段当前未被引用，可安全删除。'),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /取\s*消/ })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /确\s*认/ })).toBeInTheDocument()
  })

  it('被引用：删除按钮禁用，点击不打开确认框', async () => {
    const field = await seedMetaField()
    await seedNodeSchemaReferencing(field.metaFieldId)
    await renderPage()

    const deleteButton = await screen.findByRole('button', { name: '删除' })
    expect(deleteButton).toBeDisabled()

    // antd 的禁用按钮带 pointer-events: none，userEvent 会因指针检查而挂起；
    // 这里要验的是「点下去也不会开确认框」，用 fireEvent 直接派发即可。
    fireEvent.click(deleteButton)
    expect(screen.queryByText('确认删除元字段')).toBeNull()
  })
})

describe('TC-D1 · 引用清单模态', () => {
  it('列头与底部按钮符合规格：三列 + 仅一个「关闭」', async () => {
    const field = await seedMetaField()
    await seedNodeSchemaReferencing(field.metaFieldId)
    await renderPage()

    await userEvent.click(await screen.findByText('1 个模型'))

    const dialog = await screen.findByRole('dialog')
    const headers = within(dialog).getAllByRole('columnheader')
    expect(headers.map((cell) => cell.textContent)).toEqual(['引用方名称', '类型', '位置 / 说明'])

    const footerButtons = dialog.querySelectorAll('.ant-modal-footer button')
    expect(footerButtons).toHaveLength(1)
    // antd 的 autoInsertSpace 会在两个汉字之间插空格，断言前先去空白
    expect(footerButtons[0]?.textContent?.replace(/\s/g, '')).toBe('关闭')
  })
})
