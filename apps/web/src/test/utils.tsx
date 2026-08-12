import {
  type MetaFieldDraft,
  STORE_APP_SETTINGS,
  STORE_META_FIELDS,
  STORE_NODE_SCHEMAS,
} from '@flowcanvas/core'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

import { getStorage } from '../adapters/storage'
import { metaFieldRepo } from '../repositories/meta-field-repo'
import { antdTheme } from '../theme/antd-theme'

/** 与生产同构的 Provider 栈——脱开 ConfigProvider 测出来的样式不算数。 */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <AntdApp>{ui}</AntdApp>
    </ConfigProvider>,
  )
}

export async function resetStores(): Promise<void> {
  const storage = getStorage()
  await storage.clear(STORE_META_FIELDS)
  await storage.clear(STORE_NODE_SCHEMAS)
  await storage.clear(STORE_APP_SETTINGS)
}

export async function seedMetaField(draft: Partial<MetaFieldDraft> = {}) {
  return metaFieldRepo.save({
    fieldKey: 'title',
    name: '标题',
    dataType: 'text',
    ...draft,
  })
}

/**
 * 注入一条引用该元字段的节点模型。
 *
 * **这是 D 组用例存在的理由**——节点模型页未开发，真实数据下 nodeSchemas 恒空，
 * 引用态（被引用列可点、引用清单模态、被引用禁删）永远不会自然出现（requirement §4）。
 */
export async function seedNodeSchemaReferencing(
  metaFieldId: string,
  name = '学习任务',
): Promise<void> {
  await getStorage().put(STORE_NODE_SCHEMAS, `ns_${name}`, {
    nodeSchemaId: `ns_${name}`,
    name,
    fields: [{ metaFieldId }],
  })
}
