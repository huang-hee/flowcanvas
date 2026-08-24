# React Flow 常用 API 速查

> 文档基线：`@xyflow/react` 12.11.3（2026-08-24）。本页按日常开发任务组织，不替代官方逐字段类型定义；需要确认边缘参数时，以 IDE 类型提示和[官方 API Reference](https://reactflow.dev/api-reference)为准。

## 1. 导入模板

```tsx
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
```

## 2. `<ReactFlow />`

### 2.1 状态与渲染

| Prop | 类型摘要 | 用途 |
|---|---|---|
| `nodes` | `Node[]` | 受控节点数组 |
| `edges` | `Edge[]` | 受控连线数组 |
| `defaultNodes` | `Node[]` | 非受控模式的初始节点 |
| `defaultEdges` | `Edge[]` | 非受控模式的初始连线 |
| `nodeTypes` | `NodeTypes` | `node.type` 到自定义节点组件的映射 |
| `edgeTypes` | `EdgeTypes` | `edge.type` 到自定义连线组件的映射 |
| `defaultEdgeOptions` | `DefaultEdgeOptions` | 新建连线的公共默认值 |
| `colorMode` | `'light' | 'dark' | 'system'` | 内置配色模式，默认 `light` |
| `width` / `height` | `number` | 显式指定画布尺寸；通常由父容器尺寸决定 |

受控与非受控二选一。编辑器通常用 `nodes` / `edges`，不要同时混用 `defaultNodes` / `defaultEdges`。

### 2.2 视口

| Prop | 类型摘要 | 默认值 / 说明 |
|---|---|---|
| `fitView` | `boolean` | 首次渲染时适配全部节点；会覆盖 `defaultViewport` |
| `fitViewOptions` | `FitViewOptions` | 适配范围、padding、动画时长等 |
| `defaultViewport` | `Viewport` | `{ x: 0, y: 0, zoom: 1 }` |
| `viewport` | `Viewport` | 受控视口；同时提供 `onViewportChange` |
| `minZoom` | `number` | 默认 `0.5` |
| `maxZoom` | `number` | 默认 `2` |
| `snapToGrid` | `boolean` | 开启网格吸附 |
| `snapGrid` | `[number, number]` | 网格 x/y 步长 |
| `translateExtent` | `CoordinateExtent` | 限制视口可移动范围 |
| `nodeExtent` | `CoordinateExtent` | 限制节点可拖动范围 |
| `onlyRenderVisibleElements` | `boolean` | 只渲染视口内元素，默认 `false` |
| `preventScrolling` | `boolean` | 指针位于画布上时阻止页面滚动，默认 `true` |

### 2.3 基础事件

| Prop | 触发时机 | 常见用途 |
|---|---|---|
| `onInit` | 视口初始化完成 | 保存实例、首次定位 |
| `onNodesChange` | 节点移动、选择、删除、尺寸等变化 | 更新受控节点状态 |
| `onEdgesChange` | 连线选择、删除等变化 | 更新受控连线状态 |
| `onConnect` | 用户成功连接两个端口 | `addEdge(connection, edges)` |
| `onBeforeDelete` | 删除前 | 阻止删除或改写删除集合 |
| `onDelete` | 节点或连线删除后 | 审计、联动清理 |
| `onNodeClick` | 单击节点 | 打开属性面板 |
| `onNodeDoubleClick` | 双击节点 | 进入编辑态 |
| `onNodeDragStart/Drag/Stop` | 节点拖拽阶段 | 对齐线、历史记录、落盘 |
| `onEdgeClick` | 单击连线 | 编辑关系类型 |
| `onPaneClick` | 单击画布空白处 | 清空业务侧选中状态 |
| `onSelectionChange` | 节点或连线选区变化 | 同步右侧属性区 |
| `onMoveStart/Move/End` | 视口移动或缩放 | 保存视口、埋点 |
| `onError` | React Flow 捕获内部错误 | 接入错误提示或日志 |

所有回调都应定义在组件外，或用 `useCallback` 保持稳定引用。

### 2.4 连线与重连

| Prop | 用途 |
|---|---|
| `isValidConnection` | 新连线业务校验；返回 `false` 拒绝 |
| `onConnectStart` / `onConnectEnd` | 监听拖线开始和结束，包括失败的拖线 |
| `connectionMode` | 控制严格或宽松连接模式 |
| `connectionLineType` | 拖线过程中的预览线类型 |
| `connectionLineComponent` | 自定义拖线预览组件 |
| `edgesReconnectable` | 是否允许拖动既有连线端点，默认 `true` |
| `onReconnect` | 既有连线端点重连；通常配合 `reconnectEdge` |
| `reconnectRadius` | 连线端点重连热区，默认 10 |

### 2.5 交互开关

| Prop | 默认值 | 说明 |
|---|---:|---|
| `nodesDraggable` | `true` | 全局节点可拖拽 |
| `nodesConnectable` | `true` | 全局节点可连接 |
| `elementsSelectable` | `true` | 节点和连线可选择 |
| `nodesFocusable` | `true` | 节点可键盘聚焦 |
| `edgesFocusable` | `true` | 连线可键盘聚焦 |
| `panOnDrag` | `true` | 拖拽画布时平移 |
| `zoomOnScroll` | `true` | 滚轮缩放 |
| `zoomOnPinch` | `true` | 双指缩放 |
| `panOnScroll` | `false` | 滚轮平移 |
| `selectNodesOnDrag` | `true` | 开始拖动节点时选中它 |
| `autoPanOnConnect` | `true` | 拖线到边缘时自动平移 |
| `autoPanOnNodeDrag` | `true` | 拖节点到边缘时自动平移 |
| `autoPanOnSelection` | `true` | 框选到边缘时自动平移 |
| `autoPanSpeed` | `15` | 自动平移速度 |

## 3. 核心类型

### 3.1 `Node<Data, Type>`

| 字段 | 必填 | 含义 |
|---|---:|---|
| `id` | 是 | 图内唯一节点 ID |
| `position` | 是 | 画布坐标 `{ x, y }` |
| `data` | 是 | 自定义节点组件接收的数据 |
| `type` | 否 | 自定义节点类型；默认 `default` |
| `sourcePosition` / `targetPosition` | 否 | 内置节点默认端口方向 |
| `hidden` | 否 | 隐藏节点 |
| `selected` | 否 | 选中状态，常由 React Flow 管理 |
| `draggable` | 否 | 覆盖全局拖拽设置 |
| `selectable` | 否 | 覆盖全局选择设置 |
| `connectable` | 否 | 覆盖全局连接设置 |
| `deletable` | 否 | 是否可删除 |
| `dragHandle` | 否 | 指定节点内部拖拽把手的 CSS 类名 |
| `parentId` | 否 | 父节点 ID，用于子流程或分组 |
| `extent` | 否 | 节点拖动边界，可设为 `'parent'` |
| `expandParent` | 否 | 子节点拖到边缘时扩展父节点 |
| `origin` | 否 | 节点位置原点，默认左上 `[0, 0]` |
| `measured` | 只读为主 | React Flow 测量出的宽高 |
| `style` / `className` | 否 | 节点外层样式 |

内置节点类型：`default`、`input`、`output`、`group`。

不要用 `width` / `height` 写回测量结果；控制视觉尺寸时优先使用 `style` 或 `className`。

### 3.2 `Edge<Data, Type>`

| 字段 | 必填 | 含义 |
|---|---:|---|
| `id` | 是 | 图内唯一连线 ID |
| `source` | 是 | 起点节点 ID |
| `target` | 是 | 终点节点 ID |
| `sourceHandle` / `targetHandle` | 多端口时 | 对应 Handle ID |
| `type` | 否 | 连线类型 |
| `data` | 否 | 业务关系数据 |
| `label` | 否 | 连线标签或 React 元素 |
| `animated` | 否 | 使用内置动画 |
| `markerStart` / `markerEnd` | 否 | 起点、终点箭头 |
| `hidden` | 否 | 隐藏连线 |
| `selected` | 否 | 选中状态 |
| `deletable` / `selectable` | 否 | 删除和选择开关 |
| `reconnectable` | 否 | 是否允许重连，或限定某一端 |
| `interactionWidth` | 否 | 不可见点击热区宽度 |
| `style` / `className` | 否 | SVG 样式 |

内置连线类型：`default`（Bezier）、`straight`、`step`、`smoothstep`、`simplebezier`。

### 3.3 `Connection`

用户拖线完成时的最小关系对象：

```ts
type Connection = {
  source: string | null;
  target: string | null;
  sourceHandle: string | null;
  targetHandle: string | null;
};
```

它没有完整 `Edge` 所需的 `id`、样式等字段。交给 `addEdge` 转成连线。

### 3.4 常用回调类型

```ts
import type {
  IsValidConnection,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnNodeDrag,
  OnReconnect,
} from '@xyflow/react';
```

给复杂回调显式标类型，可以避免把 `Node`、`Connection` 和 `Edge` 混淆。

## 4. 内置组件

| 组件 | 用途 | 关键点 |
|---|---|---|
| `<ReactFlowProvider>` | 在更大组件树共享 store / instance | `useReactFlow` 等 Hooks 必须位于 Provider 内 |
| `<Background>` | 点阵、线或十字背景 | 可设 `variant`、`gap`、`size`、`color` |
| `<Controls>` | 缩放、适配、交互锁定控制条 | 可隐藏单个按钮或加入 `ControlButton` |
| `<ControlButton>` | 自定义控制条按钮 | 放在 `Controls` 内 |
| `<MiniMap>` | 缩略图 | 大图中注意订阅和渲染开销 |
| `<Panel>` | 固定在画布四周的浮层 | 工具栏、状态栏、保存按钮 |
| `<Handle>` | 自定义节点端口 | `type`、`position`、`id`、`isConnectable` |
| `<NodeToolbar>` | 节点旁工具条 | 常按选中态显示 |
| `<NodeResizer>` | 节点缩放控件 | 用于允许用户改变节点大小 |
| `<NodeResizeControl>` | 更底层的缩放控制点 | 自定义尺寸交互 |
| `<BaseEdge>` | 自定义连线的 SVG path 基础组件 | 接收计算好的 `path` |
| `<EdgeText>` | SVG 连线文字 | 简单标签 |
| `<EdgeLabelRenderer>` | 在连线上方渲染 HTML | 按钮、菜单等可交互标签 |
| `<EdgeToolbar>` | 连线旁工具栏 | 删除、改类型等操作 |
| `<ViewportPortal>` | 把自定义内容放入画布坐标系 | 内容随缩放和平移变化 |

## 5. Hooks

| Hook | 返回 / 用途 | 重渲染注意点 |
|---|---|---|
| `useNodesState(initial)` | `[nodes, setNodes, onNodesChange]` | 适合示例和中小型受控编辑器 |
| `useEdgesState(initial)` | `[edges, setEdges, onEdgesChange]` | 同上 |
| `useReactFlow()` | `ReactFlowInstance` | 调实例方法本身不会订阅状态 |
| `useNodes()` | 当前全部节点 | 任一节点变化都会触发订阅组件更新 |
| `useEdges()` | 当前全部连线 | 任一连线变化都会触发更新 |
| `useNodesData(ids)` | 指定节点的 data | 比订阅全部节点更精确 |
| `useNodeConnections(options)` | 指定节点或 Handle 的连接 | 端口数量、输入输出计算 |
| `useConnection()` | 当前正在拖拽的连接状态 | Handle 高亮和合法性反馈 |
| `useNodeId()` | 当前自定义节点 ID | 深层子组件免传 id |
| `useInternalNode(id)` | 带内部测量信息的节点 | 布局和高级连线计算 |
| `useNodesInitialized()` | 节点是否已测量完成 | 自动布局触发时机 |
| `useUpdateNodeInternals()` | 通知重新测量节点 | 动态增删或移动 Handle 后调用 |
| `useOnSelectionChange()` | 监听选择集合变化 | 回调需稳定引用 |
| `useOnViewportChange()` | 监听视口 start/change/end | 保存视图状态 |
| `useViewport()` | 当前 `{ x, y, zoom }` | 每次视口变化都会更新 |
| `useKeyPress(key)` | 某按键或组合键是否按下 | 快捷键 |
| `useStore(selector)` | 精确订阅内部 store | 高级场景；避免依赖内部实现细节 |
| `useStoreApi()` | 直接访问 store API | 高级场景；读取而不持续订阅 |
| `useHandleConnections()` | 旧 Handle 连接查询 | **已弃用**，改用 `useNodeConnections` |

## 6. `ReactFlowInstance`

通过 `useReactFlow()` 或 `onInit` 获得实例。

### 6.1 节点和连线

| 方法 | 用途 |
|---|---|
| `getNodes()` / `getEdges()` | 获取当前节点、连线 |
| `getNode(id)` / `getEdge(id)` | 按 ID 查询 |
| `setNodes(updater)` / `setEdges(updater)` | 替换或函数式更新 |
| `addNodes(payload)` / `addEdges(payload)` | 添加一个或多个元素 |
| `updateNode(id, update)` | 更新节点属性 |
| `updateNodeData(id, update)` | 只更新节点 `data` |
| `updateEdge(id, update)` | 更新连线属性 |
| `updateEdgeData(id, update)` | 只更新连线 `data` |
| `deleteElements({ nodes, edges })` | 删除元素并处理关联关系，返回实际删除集合 |
| `getNodesBounds(nodesOrIds)` | 计算一组节点的包围矩形 |
| `getNodeConnections(options)` | 查询节点连接 |
| `getHandleConnections(options)` | 查询 Handle 连接 |
| `toObject()` | 导出 `{ nodes, edges, viewport }` |

`setNodes` / `setEdges` 的函数式更新必须返回新数组，不要原地修改。

### 6.2 视口和坐标

| 方法 | 用途 |
|---|---|
| `getViewport()` | 获取当前视口 |
| `setViewport(viewport, options?)` | 设置完整视口 |
| `fitView(options?)` | 适配全部或指定节点 |
| `zoomIn(options?)` / `zoomOut(options?)` | 相对缩放 |
| `zoomTo(zoom, options?)` | 缩放到指定倍率 |
| `setCenter(x, y, options?)` | 将画布坐标移到视口中心 |
| `screenToFlowPosition(point)` | 屏幕坐标转画布坐标 |
| `flowToScreenPosition(point)` | 画布坐标转屏幕坐标 |

带动画的视口方法通常返回 `Promise<boolean>`，需要连续操作时可以 `await`。

## 7. 工具函数

| 函数 | 作用 |
|---|---|
| `addEdge(connectionOrEdge, edges)` | 校验并添加连线；拒绝无效或同端口重复关系 |
| `applyNodeChanges(changes, nodes)` | 把 `NodeChange[]` 应用到节点数组 |
| `applyEdgeChanges(changes, edges)` | 把 `EdgeChange[]` 应用到连线数组 |
| `reconnectEdge(oldEdge, connection, edges)` | 更新既有连线端点 |
| `getIncomers(node, nodes, edges)` | 获取直接上游节点 |
| `getOutgoers(node, nodes, edges)` | 获取直接下游节点 |
| `getConnectedEdges(nodes, edges)` | 获取与一组节点相连的连线 |
| `getNodesBounds(nodes)` | 计算节点包围矩形 |
| `getViewportForBounds(bounds, width, height, minZoom, maxZoom, padding)` | 为边界计算合适视口 |
| `getBezierPath(options)` | 计算 Bezier 连线路径和标签位置 |
| `getSimpleBezierPath(options)` | 计算简化 Bezier 路径 |
| `getSmoothStepPath(options)` | 计算折线圆角路径 |
| `getStraightPath(options)` | 计算直线路径 |
| `isNode(value)` | 运行时判断是否像 Node |
| `isEdge(value)` | 运行时判断是否像 Edge |

## 8. 常用枚举与配置类型

| 类型 / 值 | 示例 | 用途 |
|---|---|---|
| `Position` | `Position.Left` | Handle 或内置节点端口方位 |
| `MarkerType` | `MarkerType.ArrowClosed` | 连线箭头 |
| `BackgroundVariant` | `Dots` / `Lines` / `Cross` | 背景样式 |
| `ConnectionMode` | `Strict` / `Loose` | 端口连接约束 |
| `SelectionMode` | `Partial` / `Full` | 框选命中规则 |
| `PanOnScrollMode` | `Free` / `Vertical` / `Horizontal` | 滚轮平移方向 |
| `Viewport` | `{ x, y, zoom }` | 视口状态 |
| `XYPosition` | `{ x, y }` | 画布位置 |
| `CoordinateExtent` | `[[minX,minY],[maxX,maxY]]` | 坐标边界 |
| `FitViewOptions` | `{ padding, duration, nodes }` | 适配视图参数 |
| `ReactFlowJsonObject` | `{ nodes, edges, viewport }` | `toObject()` 导出结构 |

## 9. CSS 工具类

| 类名 | 放置位置 | 效果 |
|---|---|---|
| `nodrag` | 节点内按钮、输入框 | 不从该元素启动节点拖拽 |
| `nopan` | 节点内可交互区域 | 不从该元素启动画布平移 |
| `nowheel` | 节点内滚动容器 | 滚轮事件不交给画布 |

## 10. 高频组合

### 10.1 受控编辑器

```ts
const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);
```

### 10.2 新增连线

```ts
const onConnect: OnConnect = useCallback(
  (connection) => setEdges((edges) => addEdge(connection, edges)),
  [setEdges],
);
```

### 10.3 更新单节点业务数据

```ts
setNodes((nodes) =>
  nodes.map((node) =>
    node.id === id
      ? { ...node, data: { ...node.data, status: 'done' } }
      : node,
  ),
);
```

### 10.4 重连

```ts
const onReconnect: OnReconnect = useCallback(
  (oldEdge, newConnection) => {
    setEdges((edges) => reconnectEdge(oldEdge, newConnection, edges));
  },
  [setEdges],
);
```

### 10.5 保存快照

```ts
const { toObject } = useReactFlow<AppNode, AppEdge>();
const snapshot = toObject();
```

## 11. 选择 API 的快速判断

| 目标 | 优先 API |
|---|---|
| 原型快速管理节点/连线 | `useNodesState`、`useEdgesState` |
| 业务 store 管理画布 | `applyNodeChanges`、`applyEdgeChanges` |
| 组件内精准读一个节点数据 | `useNodesData` |
| 命令式更新、定位、坐标转换 | `useReactFlow` |
| 动态端口后重新测量 | `useUpdateNodeInternals` |
| 连线业务约束 | `isValidConnection` |
| 查询上下游 | `getIncomers`、`getOutgoers` |
| 自定义连线路径 | `getBezierPath` 等 + `BaseEdge` |
| 简单保存整个画布 | `toObject()` |

## 12. 官方索引

- [`<ReactFlow />`](https://reactflow.dev/api-reference/react-flow)
- [Components](https://reactflow.dev/api-reference/components)
- [Hooks](https://reactflow.dev/api-reference/hooks)
- [Types](https://reactflow.dev/api-reference/types)
- [Utils](https://reactflow.dev/api-reference/utils)
- [`ReactFlowInstance`](https://reactflow.dev/api-reference/types/react-flow-instance)

