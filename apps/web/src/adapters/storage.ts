import { ALL_STORES, type StorageAdapter } from '@flowcanvas/core'
import { type IDBPDatabase, openDB } from 'idb'

const DB_NAME = 'flowcanvas'
const DB_VERSION = 1

/**
 * IndexedDB 适配器（06 §1 阶段一步骤 5）。
 *
 * 全部仓库用 **out-of-line key**（建库时不指定 keyPath），键由调用方显式传入——
 * 这样 `StorageAdapter` 的四个方法对所有仓库同构，`appSettings` 这种没有 ID 字段的
 * 单例配置也能走同一套接口。
 *
 * 用 `idb` 而非原生 IDBRequest：原生 API 的事务会在微任务空转时自动提交，
 * 一不小心 await 一下就 TransactionInactiveError。
 */
export class IndexedDBAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBPDatabase> | undefined

  constructor(private readonly dbName: string = DB_NAME) {}

  private db(): Promise<IDBPDatabase> {
    this.dbPromise ??= openDB(this.dbName, DB_VERSION, {
      upgrade(database) {
        for (const store of ALL_STORES) {
          if (!database.objectStoreNames.contains(store)) {
            database.createObjectStore(store)
          }
        }
      },
    })
    return this.dbPromise
  }

  async list<T>(store: string): Promise<T[]> {
    return (await this.db()).getAll(store) as Promise<T[]>
  }

  async get<T>(store: string, id: string): Promise<T | undefined> {
    return (await this.db()).get(store, id) as Promise<T | undefined>
  }

  async put<T>(store: string, id: string, value: T): Promise<void> {
    await (await this.db()).put(store, value, id)
  }

  async delete(store: string, id: string): Promise<void> {
    await (await this.db()).delete(store, id)
  }

  async clear(store: string): Promise<void> {
    await (await this.db()).clear(store)
  }
}

let instance: StorageAdapter | undefined

export function getStorage(): StorageAdapter {
  instance ??= new IndexedDBAdapter()
  return instance
}

/** 测试用：替换实现或重置单例。 */
export function setStorage(adapter: StorageAdapter | undefined): void {
  instance = adapter
}
