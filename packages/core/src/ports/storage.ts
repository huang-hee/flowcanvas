/**
 * 存储端口（06 §1：core 保持零浏览器依赖，存储与同步全部走 ports/ 适配器接口）。
 *
 * 这里**只有接口，没有实现**——IndexedDB / 文件 / 内存的具体实现住在 apps 侧。
 * core 因此可以独立测试，也不会把浏览器 API 泄进纯逻辑层。
 */
export interface StorageAdapter {
  list<T>(store: string): Promise<T[]>
  get<T>(store: string, id: string): Promise<T | undefined>
  put<T>(store: string, id: string, value: T): Promise<void>
  delete(store: string, id: string): Promise<void>
  clear(store: string): Promise<void>
}

/** 对象仓库名。新增仓库时同步改这里与适配器的建库逻辑。 */
export const STORE_META_FIELDS = 'metaFields'
export const STORE_NODE_SCHEMAS = 'nodeSchemas'
export const STORE_APP_SETTINGS = 'appSettings'

export const ALL_STORES = [STORE_META_FIELDS, STORE_NODE_SCHEMAS, STORE_APP_SETTINGS] as const

export type StoreName = (typeof ALL_STORES)[number]
