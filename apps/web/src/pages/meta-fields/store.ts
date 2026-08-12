import type { FieldDataType, MetaField } from '@flowcanvas/core'
import { create } from 'zustand'

import { metaFieldRepo } from '../../repositories/meta-field-repo'

export type ReferenceFilter = 'all' | 'referenced' | 'unreferenced'

export interface MetaFieldFilters {
  /** 名称 / 字段键 */
  keyword: string
  dataType?: FieldDataType
  referenced: ReferenceFilter
}

export const EMPTY_FILTERS: MetaFieldFilters = { keyword: '', referenced: 'all' }

interface MetaFieldsState {
  items: MetaField[]
  /** metaFieldId → 引用数。恒为 0，直到节点模型页做完（requirement §4） */
  referenceCounts: Record<string, number>
  loading: boolean
  /** 08 §5.4：页面持有 status，按它切 Table.locale.emptyText */
  status: 'ok' | 'error'
  /** **已应用**的筛选——点「查询」才写入，输入框的即时值不在这里（08 §7 / 09 §2.1） */
  applied: MetaFieldFilters
  load: () => Promise<void>
  apply: (filters: MetaFieldFilters) => void
  resetFilters: () => void
}

export const useMetaFields = create<MetaFieldsState>((set) => ({
  items: [],
  referenceCounts: {},
  loading: false,
  status: 'ok',
  applied: EMPTY_FILTERS,

  load: async () => {
    set({ loading: true })
    try {
      const items = await metaFieldRepo.list()
      const counts = await Promise.all(
        items.map(async (item) => [item.metaFieldId, await metaFieldRepo.countReferences(item.metaFieldId)] as const),
      )
      set({
        items,
        referenceCounts: Object.fromEntries(counts),
        status: 'ok',
        loading: false,
      })
    } catch {
      // 08 §5.4：失败时 loading 必须置 false，否则会一直转圈
      set({ status: 'error', loading: false })
    }
  },

  apply: (applied) => set({ applied }),
  resetFilters: () => set({ applied: EMPTY_FILTERS }),
}))

/** 筛选是纯函数——便于 TC-B1 直接测，不必挂组件。 */
export function filterMetaFields(
  items: readonly MetaField[],
  filters: MetaFieldFilters,
  referenceCounts: Record<string, number>,
): MetaField[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return items.filter((item) => {
    if (keyword) {
      const hit =
        item.name.toLowerCase().includes(keyword) || item.fieldKey.toLowerCase().includes(keyword)
      if (!hit) return false
    }

    if (filters.dataType && item.dataType !== filters.dataType) return false

    if (filters.referenced !== 'all') {
      const count = referenceCounts[item.metaFieldId] ?? 0
      if (filters.referenced === 'referenced' && count === 0) return false
      if (filters.referenced === 'unreferenced' && count > 0) return false
    }

    return true
  })
}
