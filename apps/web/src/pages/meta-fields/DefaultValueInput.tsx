import type { EnumOption, FieldDataType } from '@flowcanvas/core'
import { DatePicker, Input, InputNumber, Select } from 'antd'
import dayjs from 'dayjs'

interface DefaultValueInputProps {
  dataType: FieldDataType
  enumOptions?: EnumOption[]
  value?: unknown
  onChange?: (value: unknown) => void
}

const UNSET = '未设置'

/**
 * 默认值控件（09 §2.4）：**按类型渲染，皆含「未设置」态**。
 *
 * 「未设置」= `undefined`/`null`，与 01 §2.5 的清空语义一致：
 * `defaultValue` 只对**从未写过值**的字段兜底，显式清空后不回落默认值（01 §2.2）。
 */
export function DefaultValueInput({ dataType, enumOptions, value, onChange }: DefaultValueInputProps) {
  switch (dataType) {
    case 'boolean':
      // 三态控件：未设置 / 是 / 否（01 §2.5）
      return (
        <Select
          allowClear
          placeholder={UNSET}
          value={value as boolean | undefined}
          onChange={(next) => onChange?.(next ?? null)}
          options={[
            { value: true, label: '是' },
            { value: false, label: '否' },
          ]}
        />
      )

    case 'number':
      return (
        <InputNumber
          className="w-full"
          style={{ width: '100%' }}
          placeholder={UNSET}
          value={value as number | undefined}
          onChange={(next) => onChange?.(next ?? null)}
        />
      )

    case 'date':
      return (
        <DatePicker
          allowClear
          style={{ width: '100%' }}
          placeholder={UNSET}
          value={typeof value === 'string' && value ? dayjs(value) : null}
          onChange={(next) => onChange?.(next ? next.format('YYYY-MM-DD') : null)}
        />
      )

    case 'datetime':
      return (
        <DatePicker
          showTime
          allowClear
          style={{ width: '100%' }}
          placeholder={UNSET}
          value={typeof value === 'string' && value ? dayjs(value) : null}
          onChange={(next) => onChange?.(next ? next.toISOString() : null)}
        />
      )

    case 'enum':
      return (
        <Select
          allowClear
          placeholder={UNSET}
          value={(value as string | undefined) ?? undefined}
          onChange={(next) => onChange?.(next ?? null)}
          options={(enumOptions ?? [])
            .filter((option) => option.value)
            .map((option) => ({ value: option.value, label: option.label || option.value }))}
        />
      )

    case 'multiline':
      return (
        <Input.TextArea
          placeholder={UNSET}
          autoSize={{ minRows: 2 }}
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange?.(event.target.value || null)}
        />
      )

    default:
      return (
        <Input
          placeholder={UNSET}
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange?.(event.target.value || null)}
        />
      )
  }
}
