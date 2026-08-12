import { z } from 'zod'

import { fieldDataTypeSchema } from './field-data-type'
import { findUnitGroup, numberConfigSchema } from './number-config'
import { isRuleLegalFor, validationRuleSchema, VALIDATION_RULE_LABELS } from './validation-rule'

/** 01 §1.2：字段键为英文小驼峰，项目内唯一（唯一性在仓储层校验，此处只管形状）。 */
export const FIELD_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*$/

export const enumOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export type EnumOption = z.infer<typeof enumOptionSchema>

const metaFieldShape = z.object({
  /** 系统生成 ID（如 mf_x7k2）。配置域关联一律用它，改 fieldKey 不断链（01 §1.2）。 */
  metaFieldId: z.string().min(1),
  fieldKey: z.string().regex(FIELD_KEY_PATTERN, '字段键须为英文小驼峰，且以小写字母开头'),
  name: z.string().min(1, '名称不能为空'),
  dataType: fieldDataTypeSchema,
  helpText: z.string().optional(),
  defaultValue: z.unknown().optional(),
  /** 输入组件标识，由 UI 层解释。09 §2.4 明确本期「不做 inputComponent 暴露」，字段保留但 UI 不给入口。 */
  inputComponent: z.string().optional(),
  numberConfig: numberConfigSchema.optional(),
  enumOptions: z.array(enumOptionSchema).optional(),
  /** dataType = list 时的子项类型，含 "object"（内部结构在节点组装层组合，01 §2）。 */
  itemType: fieldDataTypeSchema.optional(),
  validations: z.array(validationRuleSchema).optional(),
  /** 01 §2.4：UTC ISO 8601 存储、本地时区渲染。 */
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

/**
 * MetaField 完整协议。
 *
 * 跨字段约束集中在这里——**zod 是协议的唯一真相源**（01 §1.1），
 * UI 不得另存一份规则表，否则两处必然漂移。
 */
export const metaFieldSchema = metaFieldShape.superRefine((field, ctx) => {
  const { dataType } = field

  // —— 类型参数：该有的必须有，不该有的不许有 ——

  if (dataType === 'number') {
    if (!field.numberConfig) {
      ctx.addIssue({
        code: 'custom',
        path: ['numberConfig'],
        message: 'number 类型必须提供 numberConfig（精度必填，01 §2.7）',
      })
    } else {
      const unit = field.numberConfig.unit
      if (unit?.kind === 'grouped') {
        const group = findUnitGroup(unit.unitGroupId)
        if (!group) {
          ctx.addIssue({
            code: 'custom',
            path: ['numberConfig', 'unit', 'unitGroupId'],
            message: `未知单位组：${unit.unitGroupId}（单位组内置、不可改，01 §2.7）`,
          })
        } else if (!group.units.some((item) => item.code === unit.code)) {
          ctx.addIssue({
            code: 'custom',
            path: ['numberConfig', 'unit', 'code'],
            message: `单位 ${unit.code} 不属于单位组「${group.name}」`,
          })
        }
      }
    }
  } else if (field.numberConfig) {
    ctx.addIssue({
      code: 'custom',
      path: ['numberConfig'],
      message: 'numberConfig 只允许出现在 number 类型上',
    })
  }

  if (dataType === 'enum') {
    if (!field.enumOptions || field.enumOptions.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['enumOptions'],
        message: 'enum 类型至少需要一个选项',
      })
    } else {
      const seen = new Set<string>()
      field.enumOptions.forEach((option, index) => {
        if (seen.has(option.value)) {
          ctx.addIssue({
            code: 'custom',
            path: ['enumOptions', index, 'value'],
            message: `选项值重复：${option.value}`,
          })
        }
        seen.add(option.value)
      })
    }
  } else if (field.enumOptions) {
    ctx.addIssue({
      code: 'custom',
      path: ['enumOptions'],
      message: 'enumOptions 只允许出现在 enum 类型上',
    })
  }

  if (dataType === 'list') {
    if (!field.itemType) {
      ctx.addIssue({
        code: 'custom',
        path: ['itemType'],
        message: 'list 类型必须指定子项类型',
      })
    } else if (field.itemType === 'list') {
      // 01 §3：结构性限深两层，list(list) 无处安放
      ctx.addIssue({
        code: 'custom',
        path: ['itemType'],
        message: 'list 的子项类型不能仍是 list（结构性限深两层，01 §3）',
      })
    }
  } else if (field.itemType) {
    ctx.addIssue({
      code: 'custom',
      path: ['itemType'],
      message: 'itemType 只允许出现在 list 类型上',
    })
  }

  // —— 校验规则与数据类型的合法组合（01 §2.1）——

  field.validations?.forEach((rule, index) => {
    if (!isRuleLegalFor(dataType, rule.rule)) {
      ctx.addIssue({
        code: 'custom',
        path: ['validations', index, 'rule'],
        message: `「${VALIDATION_RULE_LABELS[rule.rule]}」不适用于该数据类型`,
      })
    }
  })

  // —— 默认值边界（01 §3 第 4 条）——
  // object / list(object) 不提供整体 defaultValue，默认值由子字段承担。
  const isObjectLike = dataType === 'object' || (dataType === 'list' && field.itemType === 'object')
  if (isObjectLike && field.defaultValue !== undefined && field.defaultValue !== null) {
    ctx.addIssue({
      code: 'custom',
      path: ['defaultValue'],
      message: 'object / list(object) 不提供整体默认值，默认值由子字段承担（01 §3）',
    })
  }
})

export type MetaField = z.infer<typeof metaFieldSchema>

/** 新建时的输入（ID 与时间戳由仓储层生成）。 */
export const metaFieldDraftSchema = metaFieldShape.omit({
  metaFieldId: true,
  createdAt: true,
  updatedAt: true,
})

export type MetaFieldDraft = z.infer<typeof metaFieldDraftSchema>
