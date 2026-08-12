import { describe, expect, it } from 'vitest'

import { FIELD_DATA_TYPES, type FieldDataType } from './field-data-type'
import { metaFieldSchema } from './meta-field'
import { normalizeEmptyValue, roundToPrecision } from './normalize'
import { legalRulesFor } from './validation-rule'

const NOW = '2026-08-12T12:00:00.000Z'

/** 造一个该类型下的最小合法元字段。类型参数按 dataType 补齐。 */
function makeField(dataType: FieldDataType, overrides: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = {
    metaFieldId: 'mf_test',
    fieldKey: 'sampleKey',
    name: '示例字段',
    dataType,
    createdAt: NOW,
    updatedAt: NOW,
  }

  if (dataType === 'number') base.numberConfig = { precision: 0 }
  if (dataType === 'enum') base.enumOptions = [{ value: 'a', label: '甲' }]
  if (dataType === 'list') base.itemType = 'text'

  return { ...base, ...overrides }
}

describe('TC-A1 · 11 种数据类型全覆盖', () => {
  it.each(FIELD_DATA_TYPES)('%s 的最小合法元字段可通过校验', (dataType) => {
    const result = metaFieldSchema.safeParse(makeField(dataType))
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
  })

  it('数据类型恰好 11 种，无遗漏无多余', () => {
    expect(FIELD_DATA_TYPES).toHaveLength(11)
  })

  it('未知数据类型被拒绝', () => {
    expect(metaFieldSchema.safeParse(makeField('unknown' as FieldDataType)).success).toBe(false)
  })
})

describe('TC-A1 补 · 字段键形状', () => {
  it.each(['title', 'estimatedDuration', 'a1'])('小驼峰 %s 通过', (fieldKey) => {
    expect(metaFieldSchema.safeParse(makeField('text', { fieldKey })).success).toBe(true)
  })

  it.each(['Title', '1abc', 'snake_case', 'kebab-case', ''])('非法键 %s 被拒', (fieldKey) => {
    expect(metaFieldSchema.safeParse(makeField('text', { fieldKey })).success).toBe(false)
  })
})

describe('TC-A5 · precision 四舍五入（round half away from zero）', () => {
  it('1.005 在 precision=2 下进位到 1.01（不被二进制浮点误差带偏）', () => {
    expect(roundToPrecision(1.005, 2)).toBe(1.01)
  })

  it('正负对称：2.5 → 3，-2.5 → -3', () => {
    expect(roundToPrecision(2.5, 0)).toBe(3)
    expect(roundToPrecision(-2.5, 0)).toBe(-3)
  })

  it('不足位不补、超位截断', () => {
    expect(roundToPrecision(1.2, 3)).toBe(1.2)
    expect(roundToPrecision(1.23456789, 4)).toBe(1.2346)
  })

  it('precision 超出 0–6 被协议拒绝', () => {
    expect(metaFieldSchema.safeParse(makeField('number', { numberConfig: { precision: 7 } })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('number', { numberConfig: { precision: -1 } })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('number', { numberConfig: { precision: 6 } })).success).toBe(true)
  })
})

describe('TC-A6 · 单位三态', () => {
  it('缺省 / 纯标注 / 时间单位组 均合法', () => {
    expect(metaFieldSchema.safeParse(makeField('number', { numberConfig: { precision: 0 } })).success).toBe(true)
    expect(
      metaFieldSchema.safeParse(
        makeField('number', { numberConfig: { precision: 0, unit: { kind: 'label', text: '次' } } }),
      ).success,
    ).toBe(true)
    expect(
      metaFieldSchema.safeParse(
        makeField('number', {
          numberConfig: { precision: 0, unit: { kind: 'grouped', unitGroupId: 'time', code: 'hour' } },
        }),
      ).success,
    ).toBe(true)
  })

  it('未知单位组被拒', () => {
    const result = metaFieldSchema.safeParse(
      makeField('number', {
        numberConfig: { precision: 0, unit: { kind: 'grouped', unitGroupId: 'temperature', code: 'c' } },
      }),
    )
    expect(result.success).toBe(false)
  })

  it('单位不属于该组被拒（time 组没有 month）', () => {
    const result = metaFieldSchema.safeParse(
      makeField('number', {
        numberConfig: { precision: 0, unit: { kind: 'grouped', unitGroupId: 'time', code: 'month' } },
      }),
    )
    expect(result.success).toBe(false)
  })
})

describe('TC-A7 · 校验规则与数据类型的合法组合', () => {
  it('pattern 只允许出现在文本类上', () => {
    expect(
      metaFieldSchema.safeParse(makeField('text', { validations: [{ rule: 'pattern', value: '^a.*$' }] })).success,
    ).toBe(true)
    expect(
      metaFieldSchema.safeParse(
        makeField('number', { validations: [{ rule: 'pattern', value: '^a.*$' }] }),
      ).success,
    ).toBe(false)
  })

  it('min/max 只允许出现在 number 上', () => {
    expect(metaFieldSchema.safeParse(makeField('number', { validations: [{ rule: 'min', value: 0 }] })).success).toBe(true)
    expect(metaFieldSchema.safeParse(makeField('text', { validations: [{ rule: 'min', value: 0 }] })).success).toBe(false)
  })

  it('minItems 只允许出现在 list 上', () => {
    expect(
      metaFieldSchema.safeParse(makeField('list', { itemType: 'text', validations: [{ rule: 'minItems', value: 1 }] }))
        .success,
    ).toBe(true)
    expect(metaFieldSchema.safeParse(makeField('text', { validations: [{ rule: 'minItems', value: 1 }] })).success).toBe(
      false,
    )
  })

  it('required 对全部类型合法', () => {
    for (const dataType of FIELD_DATA_TYPES) {
      expect(legalRulesFor(dataType)).toContain('required')
      expect(
        metaFieldSchema.safeParse(makeField(dataType, { validations: [{ rule: 'required' }] })).success,
      ).toBe(true)
    }
  })

  it('无法编译的正则被拒（01 §2.1：编译失败即配置错误）', () => {
    expect(
      metaFieldSchema.safeParse(makeField('text', { validations: [{ rule: 'pattern', value: '([a-z' }] })).success,
    ).toBe(false)
  })
})

describe('TC-A8 · 空输入归一化（01 §2.5）', () => {
  it('文本类 trim 后为空 → null', () => {
    expect(normalizeEmptyValue('text', '   ')).toBeNull()
    expect(normalizeEmptyValue('multiline', '')).toBeNull()
    expect(normalizeEmptyValue('text', ' 有值 ')).toBe('有值')
  })

  it('number / date / datetime 清空 → null', () => {
    expect(normalizeEmptyValue('number', '')).toBeNull()
    expect(normalizeEmptyValue('date', undefined)).toBeNull()
    expect(normalizeEmptyValue('datetime', null)).toBeNull()
  })

  it('enum 未选择 → null；boolean 未设置 → null', () => {
    expect(normalizeEmptyValue('enum', '')).toBeNull()
    expect(normalizeEmptyValue('boolean', undefined)).toBeNull()
    expect(normalizeEmptyValue('boolean', false)).toBe(false)
  })

  it('list 删光子项 → [] 而非 null（是合法值不是清空）', () => {
    expect(normalizeEmptyValue('list', undefined)).toEqual([])
    expect(normalizeEmptyValue('list', null)).toEqual([])
    expect(normalizeEmptyValue('list', [])).toEqual([])
  })
})

describe('类型参数的有无（09 §2.4 / 01 §3）', () => {
  it('number 缺 numberConfig 被拒', () => {
    expect(metaFieldSchema.safeParse(makeField('number', { numberConfig: undefined })).success).toBe(false)
  })

  it('非 number 带 numberConfig 被拒', () => {
    expect(metaFieldSchema.safeParse(makeField('text', { numberConfig: { precision: 2 } })).success).toBe(false)
  })

  it('enum 选项为空或 value 重复被拒', () => {
    expect(metaFieldSchema.safeParse(makeField('enum', { enumOptions: [] })).success).toBe(false)
    expect(
      metaFieldSchema.safeParse(
        makeField('enum', {
          enumOptions: [
            { value: 'a', label: '甲' },
            { value: 'a', label: '乙' },
          ],
        }),
      ).success,
    ).toBe(false)
  })

  it('list 缺 itemType 被拒；list(list) 被拒（限深两层）', () => {
    expect(metaFieldSchema.safeParse(makeField('list', { itemType: undefined })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('list', { itemType: 'list' })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('list', { itemType: 'object' })).success).toBe(true)
  })

  it('object / list(object) 不接受整体默认值（01 §3）', () => {
    expect(metaFieldSchema.safeParse(makeField('object', { defaultValue: {} })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('list', { itemType: 'object', defaultValue: [] })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('list', { itemType: 'text', defaultValue: [] })).success).toBe(true)
  })
})

describe('TC-A10 · 时间戳', () => {
  it('非 ISO 8601 被拒', () => {
    expect(metaFieldSchema.safeParse(makeField('text', { createdAt: '2026-08-12' })).success).toBe(false)
    expect(metaFieldSchema.safeParse(makeField('text', { updatedAt: 'not-a-date' })).success).toBe(false)
  })

  it('UTC ISO 8601 通过', () => {
    expect(metaFieldSchema.safeParse(makeField('text')).success).toBe(true)
  })
})
