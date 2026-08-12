import { z } from 'zod'

/** 01 §2.7：精度上限 6（小数位 0–6，默认 0）。 */
export const PRECISION_MIN = 0
export const PRECISION_MAX = 6

/**
 * 单位三态（01 §2.7 / 09 §2.4）：
 * - 缺省 —— 无单位
 * - `label` —— 纯标注，仅展示，**无机器语义**（货币、计数类用它，跨组禁止换算）
 * - `grouped` —— 挂单位组，引擎可换算
 */
export const numberUnitSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('label'), text: z.string().min(1) }),
  z.object({
    kind: z.literal('grouped'),
    unitGroupId: z.string().min(1),
    code: z.string().min(1),
  }),
])

export type NumberUnit = z.infer<typeof numberUnitSchema>

export const numberConfigSchema = z.object({
  precision: z.number().int().min(PRECISION_MIN).max(PRECISION_MAX),
  unit: numberUnitSchema.optional(),
})

export type NumberConfig = z.infer<typeof numberConfigSchema>

export const unitGroupSchema = z.object({
  unitGroupId: z.string().min(1),
  name: z.string().min(1),
  baseUnit: z.string().min(1),
  units: z
    .array(
      z.object({
        code: z.string().min(1),
        label: z.string().min(1),
        /** value_base = value × factor + (offset ?? 0) */
        factor: z.number().positive(),
        /** 温度类 affine 预留，MVP 无温度组（01 §2.7） */
        offset: z.number().optional(),
      }),
    )
    .min(1),
})

export type UnitGroup = z.infer<typeof unitGroupSchema>

/**
 * 01 §2.7：**单位组内置、不可改**，随代码发布。MVP 仅「时间」组，基准 minute。
 */
export const TIME_UNIT_GROUP: UnitGroup = {
  unitGroupId: 'time',
  name: '时间',
  baseUnit: 'minute',
  units: [
    { code: 'minute', label: '分钟', factor: 1 },
    { code: 'hour', label: '小时', factor: 60 },
    { code: 'day', label: '天', factor: 1440 },
    { code: 'week', label: '周', factor: 10080 },
  ],
}

export const BUILTIN_UNIT_GROUPS: readonly UnitGroup[] = [TIME_UNIT_GROUP]

export function findUnitGroup(unitGroupId: string): UnitGroup | undefined {
  return BUILTIN_UNIT_GROUPS.find((group) => group.unitGroupId === unitGroupId)
}
