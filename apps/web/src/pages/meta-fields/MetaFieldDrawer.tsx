import {
  type EnumOption,
  FIELD_DATA_TYPE_LABELS,
  FIELD_DATA_TYPES,
  type FieldDataType,
  type MetaField,
  type MetaFieldDraft,
  PRECISION_MAX,
  PRECISION_MIN,
  TIME_UNIT_GROUP,
  type ValidationRule,
} from '@flowcanvas/core'
import { App, Button, Drawer, Form, Input, InputNumber, Modal, Segmented, Select, Tag } from 'antd'
import { useState } from 'react'

import { FieldKeyConflictError, metaFieldRepo } from '../../repositories/meta-field-repo'
import { DefaultValueInput } from './DefaultValueInput'
import { EnumOptionsEditor } from './EnumOptionsEditor'
import styles from './MetaFieldDrawer.module.css'
import { RuleBuilder } from './RuleBuilder'

type UnitMode = 'none' | 'label' | 'grouped'

interface FormValues {
  fieldKey: string
  name: string
  dataType: FieldDataType
  precision?: number
  unitMode?: UnitMode
  unitLabel?: string
  unitCode?: string
  enumOptions?: EnumOption[]
  itemType?: FieldDataType
  validations?: ValidationRule[]
  defaultValue?: unknown
  helpText?: string
}

interface MetaFieldDrawerProps {
  open: boolean
  field?: MetaField
  referenceCount: number
  onClose: () => void
  onSaved: () => void
  onShowReferences: (field: MetaField) => void
}

const NEW_FIELD_VALUES: FormValues = {
  fieldKey: '',
  name: '',
  dataType: 'text',
  precision: 0,
  unitMode: 'none',
}

function toFormValues(field: MetaField | undefined): FormValues {
  if (!field) return NEW_FIELD_VALUES

  const unit = field.numberConfig?.unit
  return {
    fieldKey: field.fieldKey,
    name: field.name,
    dataType: field.dataType,
    precision: field.numberConfig?.precision ?? 0,
    unitMode: unit?.kind ?? 'none',
    unitLabel: unit?.kind === 'label' ? unit.text : undefined,
    unitCode: unit?.kind === 'grouped' ? unit.code : undefined,
    enumOptions: field.enumOptions,
    itemType: field.itemType,
    validations: field.validations,
    defaultValue: field.defaultValue,
    helpText: field.helpText,
  }
}

function toDraft(values: FormValues): MetaFieldDraft {
  const draft: MetaFieldDraft = {
    fieldKey: values.fieldKey,
    name: values.name,
    dataType: values.dataType,
  }

  if (values.helpText) draft.helpText = values.helpText
  if (values.defaultValue !== undefined && values.defaultValue !== null) {
    draft.defaultValue = values.defaultValue
  }
  if (values.validations?.length) draft.validations = values.validations

  if (values.dataType === 'number') {
    draft.numberConfig = {
      precision: values.precision ?? 0,
      ...(values.unitMode === 'label' && values.unitLabel
        ? { unit: { kind: 'label' as const, text: values.unitLabel } }
        : {}),
      ...(values.unitMode === 'grouped' && values.unitCode
        ? { unit: { kind: 'grouped' as const, unitGroupId: TIME_UNIT_GROUP.unitGroupId, code: values.unitCode } }
        : {}),
    }
  }

  if (values.dataType === 'enum') draft.enumOptions = values.enumOptions ?? []
  if (values.dataType === 'list') draft.itemType = values.itemType

  return draft
}

/**
 * 元字段编辑抽屉（09 §2.3，Figma `207:852` / 内容组件 `204:1037`）。
 *
 * 宽 560、全高；**抽屉内无删除按钮**——删除入口在表格操作列。
 * 头部引用计数徽标**纯展示不可点**：引用清单的入口只在表格「被引用」列（09 §2.3）。
 */
export function MetaFieldDrawer({
  open,
  field,
  referenceCount,
  onClose,
  onSaved,
  onShowReferences,
}: MetaFieldDrawerProps) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const [modal, modalContextHolder] = Modal.useModal()
  const [saving, setSaving] = useState(false)

  const dataType = Form.useWatch('dataType', form) ?? 'text'
  const unitMode = Form.useWatch('unitMode', form) ?? 'none'
  const enumOptions = Form.useWatch('enumOptions', form)
  // 必须 useWatch 而不是 form.getFieldValue：后者在渲染期读值但**不订阅变更**，
  // 改了子项类型后默认值字段的显隐不会跟着更新。
  const itemType = Form.useWatch('itemType', form)

  /**
   * 每次打开都让 Form 重新挂载，`initialValues` 随之生效——
   * 比在 effect 里 setFieldsValue 干净：不必手动重置脏标记，也不触发级联渲染。
   */
  const formKey = `${field?.metaFieldId ?? 'new'}-${String(open)}`

  /**
   * 08 §8.1：关闭带脏标记的表单给未保存确认。
   * 脏标记直接从 Form 派生（`isFieldsTouched`），不另存一份 state。
   */
  const requestClose = () => {
    if (!form.isFieldsTouched()) {
      onClose()
      return
    }
    void modal.confirm({
      title: '放弃未保存的修改？',
      content: '关闭后本次编辑的内容不会被保存。',
      okText: '放弃',
      cancelText: '继续编辑',
      onOk: onClose,
    })
  }

  const handleSave = async () => {
    let values: FormValues
    try {
      values = await form.validateFields()
    } catch {
      // 校验不过：错误已由 Form 落到各字段上（08 §8.3 字段级），
      // 这里必须吞掉 rejection——否则调用处的 void 会产生 unhandled rejection。
      return
    }

    setSaving(true)
    try {
      await metaFieldRepo.save(toDraft(values), field?.metaFieldId)
      message.success('已保存')
      onSaved()
    } catch (error) {
      if (error instanceof FieldKeyConflictError) {
        // 唯一性冲突落到字段上，而不是弹一个飘走的 toast
        form.setFields([{ name: 'fieldKey', errors: [error.message] }])
      } else {
        message.error(error instanceof Error ? error.message : '保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const title = field ? field.name || '编辑元字段' : '新增元字段'

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      width={560}
      maskClosable={false}
      title={
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {field && (
            /* 纯展示不可点（09 §2.3）；0 引用时显示「未引用」——稿子未覆盖 0 态，
               停顿 2 拍板按表格列口径收敛（spec-ui.md §1.3） */
            <Tag className={styles.badge}>
              {referenceCount > 0 ? `被 ${String(referenceCount)} 个节点模型引用` : '未引用'}
            </Tag>
          )}
        </div>
      }
      footer={
        <div className={styles.footer}>
          <Button onClick={requestClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            保存
          </Button>
        </div>
      }
    >
      {modalContextHolder}

      <Form<FormValues>
        key={formKey}
        form={form}
        layout="vertical"
        initialValues={toFormValues(field)}
      >
        <Form.Item
          name="fieldKey"
          label="字段键"
          extra="保存时校验唯一性；配置域关联走 metaFieldId，改键不断链"
          rules={[
            { required: true, message: '请填写字段键' },
            { pattern: /^[a-z][a-zA-Z0-9]*$/, message: '字段键须为英文小驼峰，且以小写字母开头' },
          ]}
        >
          {/* 始终可编辑，无锁定态（09 §2.4） */}
          <Input className={styles.mono} />
        </Form.Item>

        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请填写名称' }]}>
          <Input />
        </Form.Item>

        <Form.Item
          name="dataType"
          label="数据类型"
          rules={[{ required: true, message: '请选择数据类型' }]}
        >
          {/* 随时可改；已被引用时修改后弹影响提示，即引用清单模态（09 §2.4） */}
          <Select
            options={FIELD_DATA_TYPES.map((type) => ({
              value: type,
              label: FIELD_DATA_TYPE_LABELS[type],
            }))}
            onChange={() => {
              if (field && referenceCount > 0) onShowReferences(field)
            }}
          />
        </Form.Item>

        {/* —— 类型参数：按 dataType 显隐（spec-ui.md §4.3）—— */}

        {dataType === 'number' && (
          <>
            <Form.Item
              name="precision"
              label="精度"
              extra="小数位 0–6，默认 0；保存时按 precision 四舍五入归一"
              rules={[{ required: true, message: '请填写精度' }]}
            >
              <InputNumber min={PRECISION_MIN} max={PRECISION_MAX} className={styles.shortControl} />
            </Form.Item>

            <Form.Item
              name="unitMode"
              label="单位模式"
              rules={[{ required: true, message: '请选择单位模式' }]}
            >
              <Segmented<UnitMode>
                block
                options={[
                  { value: 'none', label: '无' },
                  { value: 'label', label: '纯标注' },
                  { value: 'grouped', label: '时间单位组' },
                ]}
              />
            </Form.Item>

            {unitMode === 'label' && (
              <Form.Item
                name="unitLabel"
                label="单位标注"
                extra="仅展示，无机器语义——货币、计数类用它"
                rules={[{ required: true, message: '请填写单位标注' }]}
              >
                <Input />
              </Form.Item>
            )}

            {unitMode === 'grouped' && (
              <Form.Item
                name="unitCode"
                label="具体单位"
                extra="选项来自内置「时间」单位组：分钟 / 小时 / 天 / 周"
                rules={[{ required: true, message: '请选择具体单位' }]}
              >
                {/* 宽度跟随 Form.Item 撑满——09 §2.3：稿子里的 320 是 kit 限制，不是宽度真相 */}
                <Select
                  options={TIME_UNIT_GROUP.units.map((unit) => ({
                    value: unit.code,
                    label: unit.label,
                  }))}
                />
              </Form.Item>
            )}
          </>
        )}

        {dataType === 'enum' && (
          <Form.Item
            name="enumOptions"
            label="选项"
            rules={[
              {
                validator: (_, value: EnumOption[] | undefined) => {
                  if (!value || value.length === 0) return Promise.reject(new Error('至少需要一个选项'))
                  if (value.some((option) => !option.value.trim()))
                    return Promise.reject(new Error('选项值不能为空'))
                  const values = value.map((option) => option.value)
                  if (new Set(values).size !== values.length)
                    return Promise.reject(new Error('选项值不能重复'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <EnumOptionsEditor />
          </Form.Item>
        )}

        {dataType === 'list' && (
          <Form.Item
            name="itemType"
            label="子项类型"
            extra="选 object 时，内部结构在节点模型页的子组装中定义"
            rules={[{ required: true, message: '请选择子项类型' }]}
          >
            <Select
              options={FIELD_DATA_TYPES.filter((type) => type !== 'list').map((type) => ({
                value: type,
                label: FIELD_DATA_TYPE_LABELS[type],
              }))}
            />
          </Form.Item>
        )}

        <Form.Item name="validations" label="校验规则">
          <RuleBuilder dataType={dataType} />
        </Form.Item>

        {/* object / list(object) 不提供整体默认值，默认值由子字段承担（01 §3） */}
        {dataType !== 'object' && !(dataType === 'list' && itemType === 'object') && (
          <Form.Item name="defaultValue" label="默认值">
            <DefaultValueInput dataType={dataType} enumOptions={enumOptions} />
          </Form.Item>
        )}

        <Form.Item name="helpText" label="帮助文字">
          <Input.TextArea
            autoSize={{ minRows: 2 }}
            placeholder="向执行者说明该字段的用途与填写方式（纯文本展示）"
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
