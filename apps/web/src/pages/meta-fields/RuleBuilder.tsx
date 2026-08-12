import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  type FieldDataType,
  legalRulesFor,
  VALIDATION_RULE_LABELS,
  type ValidationRule,
} from '@flowcanvas/core'
import { Button, Dropdown, Input, InputNumber } from 'antd'

import styles from './RuleBuilder.module.css'

interface RuleBuilderProps {
  dataType: FieldDataType
  value?: ValidationRule[]
  onChange?: (rules: ValidationRule[]) => void
}

type RuleName = ValidationRule['rule']

/** 规则名 → 默认参数。`required` 无参数。 */
function makeRule(rule: RuleName): ValidationRule {
  switch (rule) {
    case 'required':
      return { rule }
    case 'pattern':
      return { rule, value: '' }
    case 'earliest':
    case 'latest':
      return { rule, value: '' }
    default:
      return { rule, value: 0 }
  }
}

/**
 * 校验规则构建器（09 §2.4，**自研组件**，登记于 08 §9.2）。
 *
 * 规格取自 Figma `205:1838`：RuleRow 底 --fill-muted、圆角 6、高 32、pl 12 / pr 4；
 * 规则名 text/body + 参数 text/mono-sm；「添加规则」为 dashed block 按钮 + PlusOutlined。
 *
 * 「添加规则」下拉**只列该数据类型的合法规则**——合法组合以 core/schema 的
 * `legalRulesFor` 为准，UI 不另存一份规则表（否则两处必然漂移）。
 */
export function RuleBuilder({ dataType, value = [], onChange }: RuleBuilderProps) {
  const used = new Set(value.map((rule) => rule.rule))
  const available = legalRulesFor(dataType).filter((rule) => !used.has(rule))

  const update = (index: number, next: ValidationRule) => {
    onChange?.(value.map((rule, i) => (i === index ? next : rule)))
  }

  return (
    <div className={styles.builder}>
      {value.map((rule, index) => (
        <div className={styles.row} key={rule.rule}>
          <div className={styles.ruleContent}>
            <span className={styles.ruleName}>{VALIDATION_RULE_LABELS[rule.rule]}</span>

            {rule.rule === 'pattern' || rule.rule === 'earliest' || rule.rule === 'latest' ? (
              <Input
                size="small"
                className={styles.param}
                value={rule.value}
                aria-label={`${VALIDATION_RULE_LABELS[rule.rule]}参数`}
                onChange={(event) => update(index, { ...rule, value: event.target.value })}
              />
            ) : rule.rule === 'required' ? null : (
              <InputNumber
                size="small"
                className={styles.param}
                value={rule.value}
                aria-label={`${VALIDATION_RULE_LABELS[rule.rule]}参数`}
                onChange={(next) => update(index, { ...rule, value: next ?? 0 })}
              />
            )}
          </div>

          <Button
            type="text"
            size="small"
            aria-label={`删除规则：${VALIDATION_RULE_LABELS[rule.rule]}`}
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}

      <Dropdown
        trigger={['click']}
        disabled={available.length === 0}
        menu={{
          items: available.map((rule) => ({ key: rule, label: VALIDATION_RULE_LABELS[rule] })),
          onClick: ({ key }) => onChange?.([...value, makeRule(key as RuleName)]),
        }}
      >
        <Button block type="dashed" icon={<PlusOutlined />} disabled={available.length === 0}>
          添加规则
        </Button>
      </Dropdown>
    </div>
  )
}
