import type { MetaField } from '@flowcanvas/core'
import { Button, Modal, Table } from 'antd'
import { useEffect, useState } from 'react'

import { metaFieldRepo, type ReferenceEntry } from '../../repositories/meta-field-repo'

interface ReferenceListModalProps {
  field: MetaField | undefined
  onClose: () => void
}

/**
 * 引用清单模态（08 §4.4 / 09 §2.5）。
 *
 * **全站唯一载体**——元字段、节点模型、流程的引用清单与改动影响提示都走它，
 * 不做抽屉、不做就地展开、不做 Popover。
 *
 * 只读，不承载破坏性动作；底部**仅一个「关闭」**，按 08 §4.2 判据属「知道了」性质，取主按钮。
 * 宽 728 取自 Figma `212:1579`；三列列宽取自 `206:778`。
 */
export function ReferenceListModal({ field, onClose }: ReferenceListModalProps) {
  const [entries, setEntries] = useState<ReferenceEntry[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const next = field ? await metaFieldRepo.listReferences(field.metaFieldId) : []
      if (!cancelled) setEntries(next)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [field])

  return (
    <Modal
      open={Boolean(field)}
      onCancel={onClose}
      title={field ? `「${field.name}」的引用清单` : ''}
      width={728}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Table<ReferenceEntry>
        rowKey={(entry, index) => `${entry.name}-${entry.location}-${String(index)}`}
        dataSource={entries}
        pagination={false}
        bordered={false}
        columns={[
          { title: '引用方名称', dataIndex: 'name', key: 'name', width: 280 },
          { title: '类型', dataIndex: 'type', key: 'type', width: 160 },
          { title: '位置 / 说明', dataIndex: 'location', key: 'location', width: 240 },
        ]}
      />
    </Modal>
  )
}
