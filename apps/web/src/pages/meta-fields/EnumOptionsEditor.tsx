import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { EnumOption } from '@flowcanvas/core'
import { Button, Input } from 'antd'

import styles from './RuleBuilder.module.css'
import ownStyles from './EnumOptionsEditor.module.css'

interface EnumOptionsEditorProps {
  value?: EnumOption[]
  onChange?: (options: EnumOption[]) => void
}

/**
 * enum 选项行编辑器。
 *
 * ⚠️ **无设计稿依据**（spec-ui.md §4.1）——Figma 的抽屉表单只画了 number 类型的态，
 * enum 选项行与 list 子项类型两个控件稿子根本没画。停顿 2 拍板「按现有形制推导」，
 * 形制取自校验规则构建器的 RuleRow（同为「一行一条 + 删除 + dashed 添加」的重复项编辑器），
 * 以免页内出现第二套视觉语言。**补稿后以稿为准，本组件需回头对齐。**
 */
export function EnumOptionsEditor({ value = [], onChange }: EnumOptionsEditorProps) {
  const update = (index: number, patch: Partial<EnumOption>) => {
    onChange?.(value.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  return (
    <div className={styles.builder}>
      {value.map((option, index) => (
        <div className={styles.row} key={index}>
          <div className={ownStyles.fields}>
            <Input
              size="small"
              className={ownStyles.valueInput}
              placeholder="选项值"
              aria-label={`选项 ${String(index + 1)} 的值`}
              value={option.value}
              onChange={(event) => update(index, { value: event.target.value })}
            />
            <Input
              size="small"
              className={ownStyles.labelInput}
              placeholder="显示名"
              aria-label={`选项 ${String(index + 1)} 的显示名`}
              value={option.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
          </div>

          <Button
            type="text"
            size="small"
            aria-label={`删除选项 ${String(index + 1)}`}
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}

      <Button
        block
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => onChange?.([...value, { value: '', label: '' }])}
      >
        添加选项
      </Button>
    </div>
  )
}
