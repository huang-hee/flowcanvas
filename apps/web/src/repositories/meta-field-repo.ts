import {
  type MetaField,
  type MetaFieldDraft,
  metaFieldSchema,
  roundToPrecision,
  STORE_META_FIELDS,
  STORE_NODE_SCHEMAS,
} from '@flowcanvas/core'

import { getStorage } from '../adapters/storage'

/**
 * 引用方的最小只读形状。
 *
 * ⚠️ NodeSchema 的**完整协议不在本次范围**（requirement §2.2：节点模型页未开发），
 * 这里只声明「读引用关系」所需的字段，形状取自 01 §3。
 * 节点模型页开工时，完整协议进 core/schema，此处改为引用它。
 */
interface NodeSchemaLike {
  nodeSchemaId: string
  name: string
  fields?: FieldBindingLike[]
}

interface FieldBindingLike {
  metaFieldId: string
  /** 子组装（01 §3）：object / list(object) 的内部结构，递归引用基础类型元字段 */
  itemBindings?: FieldBindingLike[]
}

export interface ReferenceEntry {
  /** 引用方名称 */
  name: string
  /** 类型：节点模型 / 流程草稿 */
  type: string
  /** 位置 / 说明 */
  location: string
}

export class FieldKeyConflictError extends Error {
  constructor(readonly fieldKey: string) {
    super(`字段键「${fieldKey}」已存在`)
    this.name = 'FieldKeyConflictError'
  }
}

function generateId(existing: readonly MetaField[]): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const id = `mf_${Math.random().toString(36).slice(2, 8)}`
    if (!existing.some((field) => field.metaFieldId === id)) return id
  }
  throw new Error('无法生成唯一的 metaFieldId')
}

/**
 * 元字段的 defaultValue 若是数字，按 precision 归一后才落库——
 * 01 §2.7「精度即真相：所见 = 所存 = 所比」。
 */
function normalizeDraft(draft: MetaFieldDraft): MetaFieldDraft {
  if (draft.dataType !== 'number' || typeof draft.defaultValue !== 'number') return draft
  const precision = draft.numberConfig?.precision ?? 0
  return { ...draft, defaultValue: roundToPrecision(draft.defaultValue, precision) }
}

export const metaFieldRepo = {
  async list(): Promise<MetaField[]> {
    return getStorage().list<MetaField>(STORE_META_FIELDS)
  },

  /**
   * 新建或更新。`fieldKey` 唯一性在这里校验（01 §1.2：项目内唯一，保存时校验）——
   * 改 fieldKey 不断任何引用，因为关联走 metaFieldId。
   */
  async save(draft: MetaFieldDraft, metaFieldId?: string): Promise<MetaField> {
    const existing = await this.list()

    const conflict = existing.some(
      (field) => field.fieldKey === draft.fieldKey && field.metaFieldId !== metaFieldId,
    )
    if (conflict) throw new FieldKeyConflictError(draft.fieldKey)

    const now = new Date().toISOString()
    const previous = metaFieldId
      ? existing.find((field) => field.metaFieldId === metaFieldId)
      : undefined

    const candidate: MetaField = {
      ...normalizeDraft(draft),
      metaFieldId: metaFieldId ?? generateId(existing),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }

    // zod 是协议唯一真相源（01 §1.1）——落库前必须过一遍，UI 校验不算数。
    const parsed = metaFieldSchema.parse(candidate)
    await getStorage().put(STORE_META_FIELDS, parsed.metaFieldId, parsed)
    return parsed
  },

  async remove(metaFieldId: string): Promise<void> {
    await getStorage().delete(STORE_META_FIELDS, metaFieldId)
  },

  /**
   * 引用清单：扫 nodeSchemas，含 itemBindings 的递归子组装（01 §3）。
   *
   * ⚠️ 本次 nodeSchemas 表**恒为空**（节点模型页未开发），故实际返回恒为 []。
   * 这是按真实逻辑实现、等节点模型页做完自动生效（停顿 1 决策），
   * 不是占位——正确性由 TC-D1 / TC-D4 用注入数据的组件测试保证。
   */
  async listReferences(metaFieldId: string): Promise<ReferenceEntry[]> {
    const schemas = await getStorage().list<NodeSchemaLike>(STORE_NODE_SCHEMAS)
    const entries: ReferenceEntry[] = []

    for (const schema of schemas) {
      collectReferences(schema, schema.fields ?? [], metaFieldId, '字段位', entries)
    }

    return entries
  },

  async countReferences(metaFieldId: string): Promise<number> {
    return (await this.listReferences(metaFieldId)).length
  },
}

function collectReferences(
  schema: NodeSchemaLike,
  bindings: readonly FieldBindingLike[],
  metaFieldId: string,
  locationPrefix: string,
  out: ReferenceEntry[],
): void {
  bindings.forEach((binding, index) => {
    if (binding.metaFieldId === metaFieldId) {
      out.push({
        name: `${schema.name} · 节点模型`,
        type: '节点模型',
        location: `${locationPrefix} · 第 ${index + 1} 位`,
      })
    }
    if (binding.itemBindings?.length) {
      collectReferences(
        schema,
        binding.itemBindings,
        metaFieldId,
        `${locationPrefix} · 第 ${index + 1} 位 · 子组装`,
        out,
      )
    }
  })
}
