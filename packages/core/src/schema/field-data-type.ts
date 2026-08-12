import { z } from 'zod'

/**
 * 元字段数据类型全集（01 §2）。顺序与文档一致，UI 的下拉选项也按此序渲染。
 *
 * 注意：`duration` 不在此列——时长即数字（00 决策 32），结构化时长只存在于驱动槽位（01 §2.3）。
 */
export const FIELD_DATA_TYPES = [
  'text',
  'multiline',
  'number',
  'boolean',
  'date',
  'datetime',
  'enum',
  'link',
  'file',
  'object',
  'list',
] as const

export const fieldDataTypeSchema = z.enum(FIELD_DATA_TYPES)

export type FieldDataType = z.infer<typeof fieldDataTypeSchema>

/**
 * 「文本类」的判据来源：01 §2.1「pattern 只允许出现在文本类字段上」。
 * link 不在其中——它是独立数据类型，文档的措辞是「文本类」而非「字符串型」。
 */
export const TEXT_LIKE_TYPES = ['text', 'multiline'] as const satisfies readonly FieldDataType[]

/** 供 UI 渲染的中文标签（09 §2.2 数据类型列为 Tag 型徽章）。 */
export const FIELD_DATA_TYPE_LABELS: Record<FieldDataType, string> = {
  text: '文本',
  multiline: '多行文本',
  number: '数字',
  boolean: '布尔',
  date: '日期',
  datetime: '日期时间',
  enum: '枚举',
  link: '链接',
  file: '文件',
  object: '对象',
  list: '列表',
}
