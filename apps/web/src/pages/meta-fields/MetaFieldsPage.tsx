import { ExclamationCircleFilled } from '@ant-design/icons'
import {
  FIELD_DATA_TYPE_LABELS,
  FIELD_DATA_TYPES,
  type FieldDataType,
  type MetaField,
} from '@flowcanvas/core'
import { App, Button, ConfigProvider, Form, Input, Modal, Select, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { Panel } from '../../components/Panel'
import { metaFieldRepo } from '../../repositories/meta-field-repo'
import { formatDateTime } from '../../utils/format'
import { MetaFieldDrawer } from './MetaFieldDrawer'
import styles from './MetaFieldsPage.module.css'
import { ReferenceListModal } from './ReferenceListModal'
import { EMPTY_FILTERS, filterMetaFields, type MetaFieldFilters, useMetaFields } from './store'

export function MetaFieldsPage() {
  const { items, referenceCounts, loading, status, applied, load, apply, resetFilters } =
    useMetaFields()
  const { message } = App.useApp()

  // ⛔ 必须用 Modal.useModal() + contextHolder：静态 Modal.confirm() 通过 ReactDOM.render
  // 另起实体，拿不到 ConfigProvider 上下文，确认框会渲染成 antd 默认主题（08 §4.3）。
  const [modal, modalContextHolder] = Modal.useModal()

  const [form] = Form.useForm<MetaFieldFilters>()
  const bodyRef = useRef<HTMLDivElement>(null)

  const [editing, setEditing] = useState<{ open: boolean; field?: MetaField }>({ open: false })
  const [referenceTarget, setReferenceTarget] = useState<MetaField | undefined>()

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(
    () => filterMetaFields(items, applied, referenceCounts),
    [items, applied, referenceCounts],
  )

  const countOf = (field: MetaField) => referenceCounts[field.metaFieldId] ?? 0

  const askDelete = (field: MetaField) => {
    void modal.confirm({
      icon: <ExclamationCircleFilled className={styles.dangerIcon} />,
      title: '确认删除元字段',
      content: '删除后不可恢复。该元字段当前未被引用，可安全删除。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await metaFieldRepo.remove(field.metaFieldId)
        await load()
        message.success('已删除')
      },
    })
  }

  const columns: ColumnsType<MetaField> = [
    // 只有「名称」不写 width——它最长且长度不可预期，让它吃剩余宽（09 §2.2）
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '字段键',
      dataIndex: 'fieldKey',
      key: 'fieldKey',
      width: 200,
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 140,
      render: (value: FieldDataType) => <Tag>{FIELD_DATA_TYPE_LABELS[value]}</Tag>,
    },
    {
      title: '被引用',
      key: 'referenced',
      width: 120,
      render: (_, record) => {
        const count = countOf(record)
        // 无引用为纯展示不可点；颜色是「这里可点」的唯一提示，不得混用（08 §5.2）
        if (count === 0) return <span>未引用</span>
        return (
          <a
            onClick={(event) => {
              event.stopPropagation()
              setReferenceTarget(record)
            }}
          >
            {count} 个模型
          </a>
        )
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        const count = countOf(record)
        return (
          <span className={styles.actions} onClick={(event) => event.stopPropagation()}>
            <Button type="link" onClick={() => setEditing({ open: true, field: record })}>
              编辑
            </Button>
            {count > 0 ? (
              // disabled 元素不派发指针事件，Tooltip 须套一层包裹元素（08 §8.4 / 07 §6 偏离 7）
              <Tooltip title={`被 ${count} 个节点模型引用，解除引用后方可删除`}>
                <span>
                  <Button type="link" disabled>
                    删除
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button type="link" onClick={() => askDelete(record)}>
                删除
              </Button>
            )}
          </span>
        )
      },
    },
  ]

  return (
    <div className={styles.page}>
      {modalContextHolder}

      {/* 筛选面板：card · flex · 高 hug（08 §5.1 A 型） */}
      <Panel height="hug" className={styles.filterPanel}>
        {/*
          行间距 8 与 Form.Item 自带的 16 会冲突——面板内嵌一层 ConfigProvider 局部覆盖，
          **不要再给容器加 gap**，会叠加（08 §7）。
        */}
        <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 8 } } }}>
          <Form<MetaFieldFilters>
            form={form}
            initialValues={EMPTY_FILTERS}
            onFinish={(values) => apply(values)}
            className={styles.filterGrid}
          >
            {/*
              内联 label 用控件的 prefix 属性实现，不另起独立 label 元素（08 §7）。
              ⚠️ 不能用 noStyle——筛选表单的行间距 8 正是由 Form.itemMarginBottom 承载的
              （上面那层 ConfigProvider），noStyle 不渲染 form-item，覆盖就落空了。
            */}
            <Form.Item name="keyword">
              <Input prefix="名称 / 字段键" placeholder="请输入名称或字段键查询" allowClear />
            </Form.Item>

            <Form.Item name="dataType">
              <Select
                prefix="数据类型"
                placeholder="请选择数据类型"
                allowClear
                options={FIELD_DATA_TYPES.map((type) => ({
                  value: type,
                  label: FIELD_DATA_TYPE_LABELS[type],
                }))}
              />
            </Form.Item>

            <Form.Item name="referenced">
              <Select
                prefix="引用状态"
                placeholder="请选择引用状态"
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'referenced', label: '已被引用' },
                  { value: 'unreferenced', label: '未引用' },
                ]}
              />
            </Form.Item>

            {/* 3 项形态：按钮块占第 1 行第 4 列（08 §7） */}
            <div className={styles.filterActions}>
              <Button
                onClick={() => {
                  form.resetFields()
                  resetFilters()
                }}
              >
                重置
              </Button>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
            </div>
          </Form>
        </ConfigProvider>
      </Panel>

      {/* 表格面板：既无 panel.header 也无 panel.footer，三段全在 body 内（08 §5.1） */}
      <Panel bodyRef={bodyRef} bodyPadding={false} className={styles.tablePanel}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>元字段列表</span>
          <Button type="primary" onClick={() => setEditing({ open: true })}>
            新增元字段
          </Button>
        </div>

        <div className={styles.tableWrap}>
          <Table<MetaField>
            rowKey="metaFieldId"
            columns={columns}
            dataSource={rows}
            loading={loading}
            bordered={false}
            // 表头吸到**表格面板顶部**而非视口——页面级永不滚动（08 §5.3）。
            // ⚠️ 不要用 scroll={{ y }}，那会让表格自己滚。
            sticky={{ getContainer: () => bodyRef.current ?? window }}
            onRow={(record) => ({
              onClick: () => setEditing({ open: true, field: record }),
              className: styles.clickableRow,
            })}
            locale={{
              emptyText:
                status === 'error' ? (
                  <EmptyState text="请求出错，" actionText="重新请求" onAction={() => void load()} />
                ) : (
                  <EmptyState
                    text="暂无元字段数据，"
                    actionText="刷新列表"
                    onAction={() => void load()}
                  />
                ),
            }}
            pagination={{
              defaultPageSize: 20,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </div>
      </Panel>

      <MetaFieldDrawer
        open={editing.open}
        field={editing.field}
        referenceCount={editing.field ? countOf(editing.field) : 0}
        onClose={() => setEditing({ open: false })}
        onSaved={() => {
          setEditing({ open: false })
          void load()
        }}
        onShowReferences={(field) => setReferenceTarget(field)}
      />

      <ReferenceListModal
        field={referenceTarget}
        onClose={() => setReferenceTarget(undefined)}
      />
    </div>
  )
}
