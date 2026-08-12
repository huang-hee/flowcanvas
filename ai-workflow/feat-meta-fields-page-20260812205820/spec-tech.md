# 技术方案 · 元字段页

> 角色：`coder`｜停顿 2 已确认（2026-08-12）
> 上游：[requirement.md](requirement.md) · [06 §1](../../docs/06-实施计划.md) 技术栈 · [01](../../docs/01-领域模型与协议.md) 协议 · [07](../../docs/07-主题与设计系统.md) token

## 1. 版本锁定

**全部为 2026-08-12 实测 npm registry 的 latest**，非记忆推断。

| 包 | 版本 | 备注 |
|---|---|---|
| `typescript` | **6.0.3** | ⚠️ 不取 latest 7.0.2 —— `typescript-eslint@8.67.0` 的 peer 是 `>=4.8.4 <6.1.0`，无支持 TS 7 的正式版（仅 canary `8.67.1-alpha.2`）。停顿 2 拍板锁 6.0.3 换取完整 lint 链路 |
| `react` / `react-dom` | 19.2.8 | |
| `antd` | 6.6.0 | peer 仅要求 React ≥18 |
| `@ant-design/icons` | 6.3.2 | 大版本须与 antd 一致 |
| `react-router` | 8.3.0 | **从 `react-router` 直接 import**，v7 起已合并 `react-router-dom` |
| `zod` | 4.4.3 | v4，`z.toJSONSchema()` 为原生 API |
| `vite` | 8.2.1 | |
| `vitest` | 4.1.10 | |
| `eslint` / `typescript-eslint` / `prettier` | 10.8.1 / 8.67.0 / 3.9.6 | |
| `zustand` / `idb` | 5.0.14 / 8.0.3 | |
| 环境 | node 22.22.2 / pnpm 11.8.0 | 本地实测 |

**路由 API 查证结论**（react-router 8.3.0 官方文档，2026-08-12）：`createHashRouter(routes, opts)` 与 `useMatches()` 均存在；`useMatches()` 返回 `UIMatch[]`，含 `id / pathname / params / loaderData / handle`。`06 §1` 依赖的「路由携带元数据 + 读出当前匹配」能力经由 **`route.handle`** 成立。⚠️ `useMatches` 不支持 Declarative 模式，必须走 data router。

## 2. 目录结构

照 `06 §1`，本次只落其中用得到的部分：

```text
flowcanvas/
├── package.json                  # workspace 根，scripts: lint / typecheck / test / dev / build
├── pnpm-workspace.yaml
├── tsconfig.base.json            # strict: true
├── eslint.config.js              # flat config
├── .prettierrc
├── .github/workflows/ci.yml      # lint + typecheck + test
├── packages/
│   └── core/                     # 零浏览器依赖
│       ├── schema/               # zod：MetaField 及其依赖
│       └── ports/                # StorageAdapter 接口
└── apps/
    └── web/
        ├── adapters/             # IndexedDBAdapter（idb）
        ├── shell/                # Sidebar / PageHeader / menus 配置
        ├── pages/                # meta-fields/ + placeholder/
        └── stores/               # zustand
```

**依赖方向单向**：`apps/web → packages/core`，`core` 不反向依赖，且 `core` 内**不得出现 `window` / `indexedDB` / `document`**（`06 §1`「零浏览器依赖，可独立测试」）。

## 3. `core/schema` —— MetaField 协议

`01 §2` 的 TS 接口是**协议的可读投影**，真相源是 zod（`01 §1.1`）。本次落地 `MetaField` 及其全部依赖类型：

- `FieldDataType`：11 值枚举（text / multiline / number / boolean / date / datetime / enum / link / file / object / list）
- `ValidationRule`：判别联合 8 型（`01 §2.1`）。**按数据类型约束合法组合**在 schema 层做（如 `pattern` 只允许文本类）
- `NumberConfig`：`precision` 0–6 + `unit` 三态判别联合（`01 §2.7`）
- `UnitGroup`：MVP 仅内置 `time` 组 —— minute(1) / hour(60) / day(1440) / week(10080)，基准 minute
- `MetaField`：`01 §2` 全字段

### 3.1 协议变更（停顿 2 拍板，动接口）

`MetaField` **新增 `createdAt` / `updatedAt`**，UTC ISO 8601 字符串，对齐 `01 §2.4`「`datetime` 一律 UTC ISO 8601 存储、本地时区渲染」。

- 新建时二者相同；每次保存刷新 `updatedAt`。
- **`docs/01 §2` 的接口定义同步回写**（事项 I10）——协议文档与 zod 不得漂移。
- 原缺口：`09 §2.2` / `08 §5.1` / `05 §5` 三处 UI 都要求「更新时间」列，而 `01 §2` 无此字段，全库仅 `FlowRun` 有 `createdAt`。

### 3.2 三条必须落在 core 而非 UI 的规则

| 规则 | 依据 | 为什么不能放 UI |
|---|---|---|
| **precision 四舍五入**（round half away from zero）后才落库 | `01 §2.7`「精度即真相：所见 = 所存 = 所比」 | 条件树 constant target 也要按同一规则归一，UI 层做则引擎侧拿不到 |
| **空值归一化**（`01 §2.5` 全表） | 同上 | 「显式清空 → `null`」是求值语义的一部分（`02 §5.1`） |
| **`fieldKey` 唯一性** | `01 §1.2` | 保存时校验，属协议约束 |

> ⚠️ `list` 的空值语义特殊：**删光子项 = 值 `[]`，是合法值不是清空**，无 null 清空入口（`01 §2.5`）。

## 4. 存储层

```ts
// packages/core/ports/storage.ts —— 零浏览器依赖，只有接口
interface StorageAdapter {
  list(store: string): Promise<unknown[]>
  get(store: string, id: string): Promise<unknown | undefined>
  put(store: string, id: string, value: unknown): Promise<void>
  delete(store: string, id: string): Promise<void>
}
```

- `apps/web/adapters/IndexedDBAdapter` 用 **`idb@8.0.3`** 实现（promise 封装，避开原生 IDB 的事务自动提交坑）。
- 对象仓库：`metaFields`（keyPath `metaFieldId`）、`nodeSchemas`（本次**只读**，用于引用计数；表恒空）、`appSettings`（侧栏收起态，`08 §2.3` 要求跨会话记忆）。
- **引用计数走真实查询**：扫 `nodeSchemas` 统计引用某 `metaFieldId` 的条数，包含 `FieldBinding.itemBindings` 的递归子组装（`01 §3`）。现阶段恒返回 0，节点模型页做完自动生效。

## 5. `apps/web` 关键实现约束

从 `07` / `08` 提取的、**会写错就得返工**的硬约束：

| # | 约束 | 依据 |
|---|---|---|
| T1 | 主题走 `ConfigProvider`，**4 个 map token 必须显式覆盖**：`colorPrimaryHover` `#74593F`、`colorPrimaryBg` `#F1EAE0`、`colorErrorBg` `#FAE9E6`（算法派生不命中） | `07 §1.3` |
| T2 | `Sidebar` 用 `<Layout.Sider theme="light">`，菜单 `<Menu theme="light">`——**必须 light**，chrome 配色填的是浅色档 | `08 §2.1` |
| T3 | 确认框**必须 `Modal.useModal()` + `contextHolder`**，静态 `Modal.confirm()` 拿不到 `ConfigProvider` 上下文会脱主题 | `08 §4.3` |
| T4 | 表头 sticky 用 `sticky={{ getContainer: () => 面板主体 ref }}`，**禁用 `scroll={{ y }}`**——后者让表格自己滚，违反「页面级永不滚动，只在面板主体内滚」 | `08 §2.1` / `§5.3` |
| T5 | 筛选面板内嵌 `ConfigProvider` 局部覆盖 `components.Form.itemMarginBottom = 8`，**不要再给容器加 gap**（会叠加） | `08 §7` |
| T6 | 头部竖分隔线 `Divider type="vertical"` 须设 `components.Divider.verticalMarginInline = 0`，否则与容器 gap 叠成两侧各 20 | `08 §2.4` |
| T7 | 禁用按钮的 Tooltip 须**套一层可接收事件的包裹元素**——HTML `disabled` 元素不派发指针事件 | `08 §8.4` / `07 §6` 偏离 7 |
| T8 | 「被引用」单元格与操作列按钮的点击须 `stopPropagation`，不触发行点击 | `09 §2.2` |
| T9 | 分页器 sticky bottom 四条一体：上 padding 16、下 padding 0、**不透明底 `--surface`**、占位高 48 | `08 §6` |
| T10 | 空/错/加载三态按 `status` 切 `Table.locale.emptyText`；**失败时 `loading` 置 false** 否则一直转圈 | `08 §5.4` |
| T11 | 页面标题**只由外壳读 `menus` 配置按 path 匹配得出**，页面禁止任何形式回写 | `08 §2.1` |
| T12 | Tag 型徽章走纯 token：`components.Tag.fontFamily` + `fontSizeSM = 11`，零自定义 CSS | `08 §5.2` / `07 §6` 偏离 10 |

## 6. 路由

`createHashRouter`，六条路由 + 根布局。`menus` 配置 `{ path, title, icon }` 为**单一来源**，同时供给侧栏菜单与头部标题（`08 §2.1`）。

```
/#/                 → redirect /#/dashboard
/#/dashboard        仪表盘        （占位）
/#/meta-fields      元字段        （本次实现）
/#/node-schemas     节点模型      （占位）
/#/driver-plans     驱动方案      （占位）
/#/flows            流程页面      （占位）
/#/runs             实例列表      （占位）
```

路径取自 `05 §2` 已定的 `/#/meta-fields`；其余五条为本次新拟，**待各页开工时以 `05 §2` 为准复核**。

## 7. 测试

| 层 | 工具 | 覆盖 |
|---|---|---|
| 协议 | vitest（node 环境） | `spec-test.md` A 组 |
| 数据层 | vitest + `fake-indexeddb` 或 jsdom | A 组 IndexedDB 往返 |
| 组件 | vitest + `@testing-library/react` + jsdom | B / C / D / E 组 |

**D1 / D4（引用清单模态、被引用禁删）在真实数据下永不触发**（`nodeSchemas` 恒空），只能靠组件测试注入 mock 引用数据验证——这是引入组件测试的直接理由。

## 8. 已知风险

| 风险 | 缓解 |
|---|---|
| TS 6.0.x 可能很快停更，而 typescript-eslint 迟迟不支持 TS 7 | 版本锁在 `package.json`；typescript-eslint 发布支持 TS 7 的正式版后单独起一次升级 |
| antd v6 大改组件 DOM 并弃用 100+ API，网上多数示例仍是 v5 | 一切 API 以本地 `node_modules` 的 `.d.ts` 为准，不照抄记忆 |
| `06 §1` 的技术栈段落未记版本，与本次锁定值不同步 | 本文件是本需求的版本真相源；是否回写 `06 §1` 在汇报时提请用户决定，**不擅自改** |
