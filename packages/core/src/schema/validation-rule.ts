import { z } from 'zod'

import type { FieldDataType } from './field-data-type'

/**
 * 用户在 UI 里配置出来的校验规则是**数据**，由引擎解释执行（01 §2.1）——
 * 不是代码、不是 JSON Schema，系统中不存在表达式 parser（01 §1.5）。
 */
export const validationRuleSchema = z.discriminatedUnion('rule', [
  z.object({ rule: z.literal('required') }),
  z.object({ rule: z.literal('minLength'), value: z.number().int().nonnegative() }),
  z.object({ rule: z.literal('maxLength'), value: z.number().int().nonnegative() }),
  z.object({
    rule: z.literal('pattern'),
    // 01 §2.1：「正则字符串，编译失败即配置错误」
    value: z.string().refine(
      (pattern) => {
        try {
          new RegExp(pattern)
          return true
        } catch {
          return false
        }
      },
      { message: '正则表达式无法编译' },
    ),
  }),
  z.object({ rule: z.literal('min'), value: z.number() }),
  z.object({ rule: z.literal('max'), value: z.number() }),
  z.object({ rule: z.literal('minItems'), value: z.number().int().nonnegative() }),
  z.object({ rule: z.literal('maxItems'), value: z.number().int().nonnegative() }),
  // 01 §2.1：日期类，ISO 字符串
  z.object({ rule: z.literal('earliest'), value: z.string().min(1) }),
  z.object({ rule: z.literal('latest'), value: z.string().min(1) }),
])

export type ValidationRule = z.infer<typeof validationRuleSchema>
export type ValidationRuleName = ValidationRule['rule']

/**
 * 数据类型 → 合法校验规则。
 *
 * **依据**：01 §2.1「规则集合按数据类型约束合法组合（zod 层校验）：如 `pattern` 只允许出现在文本类字段上」。
 *
 * ⚠️ **文档只给了 pattern 一个例子**，本表其余映射按规则语义推导：
 * - 长度类 `minLength`/`maxLength` → 仅文本类
 * - 数值界 `min`/`max` → 仅 number
 * - 条目数 `minItems`/`maxItems` → 仅 list
 * - 日期界 `earliest`/`latest` → 仅 date / datetime
 * - `required` → 全部类型合法
 *
 * object 只留 `required`——它不定义内部结构（01 §2 元字段保持原子），
 * 子字段的校验由节点模型层子组装引用的那些元字段各自承担。
 */
export const LEGAL_RULES_BY_TYPE: Record<FieldDataType, readonly ValidationRuleName[]> = {
  text: ['required', 'minLength', 'maxLength', 'pattern'],
  multiline: ['required', 'minLength', 'maxLength', 'pattern'],
  number: ['required', 'min', 'max'],
  boolean: ['required'],
  date: ['required', 'earliest', 'latest'],
  datetime: ['required', 'earliest', 'latest'],
  enum: ['required'],
  link: ['required'],
  file: ['required'],
  object: ['required'],
  list: ['required', 'minItems', 'maxItems'],
}

/** 该数据类型下可供「添加规则」下拉列出的规则（09 §2.4：只给该类型的合法规则）。 */
export function legalRulesFor(dataType: FieldDataType): readonly ValidationRuleName[] {
  return LEGAL_RULES_BY_TYPE[dataType]
}

export function isRuleLegalFor(dataType: FieldDataType, rule: ValidationRuleName): boolean {
  return LEGAL_RULES_BY_TYPE[dataType].includes(rule)
}

/** 规则名的中文标签（09 §2.4 RuleRow 的「规则名」列）。 */
export const VALIDATION_RULE_LABELS: Record<ValidationRuleName, string> = {
  required: '必填',
  minLength: '最小长度',
  maxLength: '最大长度',
  pattern: '正则匹配',
  min: '最小值',
  max: '最大值',
  minItems: '最少条目',
  maxItems: '最多条目',
  earliest: '最早',
  latest: '最晚',
}
