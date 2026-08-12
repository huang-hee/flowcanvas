import type { FieldDataType } from './field-data-type'

/**
 * 按精度四舍五入，规则写死为 **round half away from zero**（01 §2.7）。
 *
 * 不能直接用 `Math.round(v * 10 ** p)`：
 * - JS 的 `Math.round` 对负数是「朝正无穷取整」，`Math.round(-2.5) === -2`，而本规范要 `-3`；
 * - `1.005 * 100 === 100.49999999999999`（二进制浮点误差），直接乘会得到 1.00 而非 1.01。
 *
 * 故先取绝对值、用指数记法移位（字符串路径不引入乘法误差），再对称地还原符号。
 */
export function roundToPrecision(value: number, precision: number): number {
  if (!Number.isFinite(value)) return value

  const sign = value < 0 ? -1 : 1
  const abs = Math.abs(value)

  const shifted = Number(`${abs}e${precision}`)
  // abs 本身已是指数记法（如 1e-7）时上面会得到 NaN，回退到乘法路径。
  const rounded = Number.isFinite(shifted)
    ? Math.round(shifted)
    : Math.round(abs * Math.pow(10, precision))

  const restored = Number(`${rounded}e-${precision}`)
  return sign * (Number.isFinite(restored) ? restored : rounded / Math.pow(10, precision))
}

/**
 * 空输入归一化（01 §2.5）。
 *
 * 「运行字段不存在空串、空白这类伪值」——显式清空一律落 `null`。
 *
 * ⚠️ `list` 是例外：**删光子项 = `[]`，是合法值不是清空**，没有 null 清空入口。
 * ⚠️ `object` 无整体清空，子字段各自归一，故原样返回。
 */
export function normalizeEmptyValue(dataType: FieldDataType, raw: unknown): unknown {
  switch (dataType) {
    case 'text':
    case 'multiline': {
      if (typeof raw !== 'string') return raw ?? null
      const trimmed = raw.trim()
      return trimmed === '' ? null : trimmed
    }

    case 'number':
    case 'date':
    case 'datetime': {
      if (raw === '' || raw === undefined) return null
      return raw ?? null
    }

    case 'enum':
    case 'link':
    case 'file': {
      if (raw === '' || raw === undefined) return null
      return raw ?? null
    }

    case 'boolean': {
      // 三态控件：未设置 → null
      return raw === undefined ? null : raw
    }

    case 'list': {
      // 空列表是合法值，不是清空
      if (raw === undefined || raw === null) return []
      return raw
    }

    case 'object': {
      // 无整体清空入口，子字段各自按本表归一
      return raw
    }

    default: {
      const exhaustive: never = dataType
      return exhaustive
    }
  }
}

/**
 * 01 §2.6：`link` 值仅当协议为 https / http / mailto 时才可渲染为可点击链接，
 * 其余一律按纯文本展示（杜绝 `javascript:` 注入）。
 *
 * 实现上**不用 `new URL()`**——`URL` 不在 core 的 lib 里（tsconfig 去掉了 DOM，见 06 §1
 * 「零浏览器依赖」），改用协议白名单正则。安全目的一致：非白名单协议（尤其 `javascript:`）
 * 一律判为不可渲染，由 UI 退化为纯文本。
 */
const RENDERABLE_LINK_PATTERN = /^(?:https?:\/\/|mailto:)\S/i

export function isRenderableLink(value: string): boolean {
  return RENDERABLE_LINK_PATTERN.test(value.trim())
}
