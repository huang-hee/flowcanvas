# FlowCanvas · Figma kit 全量接线审计与变量影响图

> 审计对象：kit fileKey `85BxV83FJxRMq32fLiP5bj`（`Ant Design System - v6` / AntUIKit v1.0.7）
> 审计时间：2026-08-12
> 审计方式：**纯只读**（Figma Plugin API `use_figma`，全部脚本无写操作），未修改任何变量 / 组件 / 节点
> 代码侧对照基准：**antd 6.6.0**
> 配套文档：`/Users/fisher_shen/Sites/www/flowcanvas/docs/07-主题与设计系统.md`（下文所有 §x.y 引用均指该文档）

---

## 0. 读取时点声明（重要）

审计期间**另有一个 agent 正在修改 kit 的圆角与控件高变量值**。本报告读到的几何值是**瞬时快照**，与 07 §7.8 记载不一致：

| 变量 | 07 §7.8 记载 | 本次读到 | 说明 |
|---|---|---|---|
| `seed/borderRadius` | 10 | **6** | antd 默认值 |
| `map/borderRadiusSM` | 6 | **4** | antd 默认值 |
| `map/borderRadiusLG` | 14 | **10** | antd 默认值 |
| `map/borderRadiusXL` | 8 | **8** | ✅ 已是返工后的值 |
| `seed/controlHeight` | 36 | **32** | antd 默认值 |
| `map/controlHeightSM` | 27 | **24** | antd 默认值 |
| `map/controlHeightLG` | 45 | **40** | antd 默认值 |
| `map/controlHeightXS` | 18 | **16** | antd 默认值 |

颜色类（`colorPrimary*` / `colorError*` / `colorBgMask` / `Tag/default*` / `Layout/siderBg` / `Menu/dark*` 等）**全部读到本项目的值**，未受影响。

> **本报告的审计对象是「绑定关系」，绑定关系与值无关，故本次结论不受上述值变动影响。** 表 B 中的「当前 Light 值」列仅供参考，几何行请以 07 §3.2 / §3.3 为准。

---

## 1. 摘要

| 指标 | 数值 |
|---|---|
| 覆盖页面 | 28 页（FlowCanvas 必需组件全覆盖） |
| 覆盖组件集 / 独立组件 | **164 个** |
| 遍历节点 | **约 12,100 个**（变体全展开；不下钻 INSTANCE 子树，避免重复计数） |
| 采集属性 | 背景色 / 文字色 / 边框色 / 圆角 / 高度 / 内边距 / 阴影 |
| ⚠️ 裸值未绑 | **约 1,260 处**（按「属性 × 签名」聚合统计），分 4 档见 §3 |
| ❌ 疑似接错 | **10 项**，见 §4 |
| 返工遗漏（浮层档） | **3 项**，见 §5.3 |
| 反向索引变量数 | 197 个（`seed` / `map` / `alias` / `components` 四层） |

**三条最该记住的结论：**

1. **阴影这一整类属性在 kit 里不可主题化。** 28 个 effect style 中，浮层阴影全族（`boxShadow` / `boxShadowSecondary` / `boxShadowTertiary` / `boxShadowCard` / `boxShadowPopoverArrow` / `boxShadowDrawer*` 共 12 个）**零变量绑定**，是三层纯黑字面值。07 §4 定义的暖墨三级阴影**从未在 kit 落地**。
2. **`Tooltip` 的圆角接线与 antd 不符。** kit 绑 `borderRadiusXL`，但 antd Tooltip 根本不读 `borderRadiusLG` —— 它读 `borderRadius`（控件档）。07 §3.2「浮层一律逐组件覆盖 `borderRadiusLG`」对 Tooltip **不成立**，26 个节点受影响。
3. **antd 支持逐组件覆盖 `borderRadiusLG`**（类型为 `ComponentToken & AliasToken`），所以「浮层 8」这一档**在代码里能实现** —— 但只对 32/66 处适用，Tooltip 26 处与 Drawer 8 处需另走别的路。

---

## 2. A · 接线审计表（按组件分组）

### 图例

| 记号 | 含义 |
|---|---|
| `$集合/变量名` | 已绑该变量。集合缩写：`s`=seed、`m`=map、`a`=alias、`c`=components、`st`=static、`co`=colors |
| `!值` | **裸值未绑** |
| `~hug值` | 高度由 auto-layout HUG 算出（**非缺陷**，不计入裸值） |
| `STY:名` | 绑了 Figma **样式**（非变量） |
| `A\|B\|C\|D` | 四角分别为 左上\|右上\|左下\|右下 |

> 「当前值」列为读取瞬时值，几何量参见 §0。

---

### 2.1 Button / Default Button / Danger Button

**结论：✅ 全清。三个组件集在七类属性上零裸值，是 kit 里接线质量最高的一组。**

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Button | solid 默认 ×15 | 背景 | `#8A6F52` | `$s/colorPrimary` | ✅ |
| Button | solid hover ×15 | 背景 | `#74593F` | `$m/colorPrimaryHover` | ✅ 悬停变深，符 §2.4 |
| Button | solid active ×15 | 背景 | `#5B412A` | `$m/colorPrimaryActive` | ✅ |
| Button | outlined ×90 | 背景 | `#FFFFFF` | `$m/colorBgContainer` | ✅ |
| Button | filled ×30 | 背景 | `#F1EAE0` | `$m/colorPrimaryBg` | ✅ |
| Button | Disabled=True ×60 | 背景 | → `colorFillTertiary` | `$a/colorBgContainerDisabled` | ✅ antd `colorBgContainerDisabled` |
| Button | Disabled=True ×60 | 边框 | `#E6E1D8` | `$m/colorBorder` | ⚠️ antd 禁用边框读 `colorBorderDisabled`（同值，语义偏差，无实害） |
| Button | outlined ×30 | 边框 | `#8A6F52` | `$s/colorPrimary` | ✅ |
| Button | middle ×48 | 圆角 | 6 | `$s/borderRadius` | ✅ 控件档 |
| Button | large ×48 | 圆角 | 10 | `$m/borderRadiusLG` | ✅ antd `Button` lg 读 `borderRadiusLG` |
| Button | small ×48 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ |
| Button | round ×216 | 圆角 | — | `$st/borderRadiusRound*` | ✅ |
| Button | 全体 ×120 | 高度 | 32 | `$s/controlHeight` | ✅ antd `height: controlHeight` |
| Button | large / small ×240 | 高度 | 40 / 24 | `$m/controlHeightLG` / `SM` | ✅ |
| Button | 全体 ×96 | 左右 padding | — | `$st/buttonPaddingHorizontal` | ✅ |
| Button | 全体 ×360 | 图标间距 | 8 | `$a/marginXS` | ✅ |
| Button | 全体 ×135 | 阴影 | `#8A6F52@.18` | `STY:boxShadowButtonPrimary`（内部绑 `a/controlOutline` + `a/controlOutlineWidth`） | ✅ **少数已绑变量的阴影** |
| Button | 文字 ×18 | 文字色 | `#FFFFFF` | `$st/colorTextLightSolidPrimary` | ✅ |
| Button | link 态 ×18 | 文字色 | `#74593F` | `$a/colorLink` / `LinkHover` / `LinkActive` | ✅ 三态同值，符 §7.8 |
| Default Button | filled ×80 | 背景 | 主色 α .073/.108/.274 | `$m/colorFillTertiary` / `Secondary` / `Fill` | ✅ 已随暖色 |
| Default Button | solid ×30 | 背景 | **`#000000`** | `$m/colorBgSolid` → `s/colorTextBase` | ❌ 见 §4.6 |
| Default Button | ×135 | 阴影 | `#8A6F52@.038` | `STY:boxShadowButtonDefault`（绑 `a/controlTmpOutline`） | ✅ |
| Danger Button | 全体 | 背景/边框/文字 | 错误色阶 | `$s/colorError` / `$m/colorError*` 系 | ✅ 完整吃 §2.4 错误色阶 |
| Danger Button | outlined ×30 | 边框 | → `colorTextQuaternary` | `$a/colorTextDisabled` | ⚠️ 危险按钮描边绑到禁用文字色，语义可疑（30 处） |

---

### 2.2 Input · Password · Search · Input Addon · Textarea

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Input | ×21 | 背景 | `#FFFFFF` | `$c/Input/activeBg` → `m/colorBgContainer` | ✅ antd Input 组件级 token |
| Input | hover ×9 | 背景 | `#FFFFFF` | `$c/Input/hoverBg` | ✅ |
| Input | ×6 | 边框 | `#E6E1D8` | `$m/colorBorder` | ✅ |
| Input | hover/focus ×15 | 边框 | 主色系 | `$c/Input/hoverBorderColor` / `activeBorderColor` | ✅ antd Input 组件级 token |
| Input | error/warning ×18 | 边框 | 错误/警告色 | `$s/colorError` / `$s/colorWarning` / `$m/color*Hover` | ✅ |
| Input | disabled ×3 | 边框 | `#E6E1D8` | `$m/colorBorderDisabled` | ✅ |
| Input | 三档 ×45 | 圆角 | 6 / 4 / 10 | `$s/borderRadius` / `$m/borderRadiusSM` / `LG` | ✅ |
| Input | 三档 ×51 | 高度 | 32 / 24 / 40 | `$s/controlHeight` / `$m/controlHeightSM` / `LG` | ✅ 缺口 9 已修实证 |
| **Input** | **`outlined/default/default/default/False`** | **高度** | **36 FIXED** | **`!fix36`** | **⚠️ 见 §3.2 第 1 条** |
| Input | ×102 | 内边距 | — | `$st/inputPadding{Vertical,Horizontal}{,SM,LG}` | ⚠️ 静态值，不随 `controlHeight` 派生（antd 会派生，见 §4.10） |
| Input | focus ×12 | 阴影 | `#8A6F52@.18` | `STY:controlOutlineActive`（绑 `c/Select/activeOutlineColor`） | ✅ |
| Input | focus-warning ×3 | 阴影 | **`#FAAD14@.10`** | `STY:controlOutlineWarningActive`（绑 `a/colorWarningOutline`） | ❌ 仍是 antd 琥珀，未随 §2.5 warning 色阶（§7.8 已登记） |
| Password | 全体 | 全属性 | 同 Input | 同 Input | ✅ |
| **Textarea** | **`line` ×102** | **背景** | **`#666666`** | **`!#666666`** | **⚠️ 高优先，见 §3.1 第 2 条** |
| **Textarea** | **`line` ×102** | **圆角** | **10** | **`!10`** | **⚠️ 同上** |
| **Textarea** | **×73** | **itemSpacing** | **10** | **`gap!10`** | **⚠️ 违反 §4「不得出现表外数值」** |
| Textarea | 全体 | 高度 | 52/44/64 | `~hug`（HUG 撑出） | ✅ 多行控件不应对齐 36（§7.9 缺口 9 规则） |
| Textarea | 计数文字 ×51 | 文字色 | → `colorTextTertiary` | `$a/colorTextDescription` | ✅ |
| Search | ×24 | 回车按钮底 | `#8A6F52` | `$s/colorPrimary` | ✅ |
| Search | ×108 | 圆角 | 分角绑定 | `$s/borderRadius` / `$m/borderRadius{SM,LG}` + `$st/radiusNone` | ✅ 左右分角处理正确 |
| **Search** | **内嵌 `Input` 实例 ×11** | **高度** | **35/39/42/46/51/52/59 FIXED** | **`!fix*`** | **⚠️ 实例被钉死，不随 `controlHeight`** |
| Search / Input Addon | ×36 | itemSpacing | −1 | `gap!-1` | ✅ 边框折叠技巧，非缺陷 |
| Input Addon | ×42 | addon 底 | → `colorFillQuaternary` | `$c/Input/addonBg` → `a/colorFillAlter` | ✅ 与 antd `addonBg = colorFillAlter` 一致 |
| Addon Before/After | ×24 | 高度 | 32/24/40 | `$s/controlHeight` 等 | ✅ §7.9 补绑实证 |
| .Input item / .Input Password item | ×30 | 高度 | 32/24/40 | `$s/controlHeight` / `$m/controlHeight{SM,LG}` | ✅ 缺口 9 修复的核心 |
| **.Input item / .Input Password item** | **`content` ×45** | **高度** | **24 / 26 FIXED** | **`!fix24` / `!fix26`** | **⚠️ 内层文本行盒未绑** |
| .Input item | `count` ×15 | itemSpacing | 10 | `gap!10` | ⚠️ |
| .Input Textarea item | `feedback` ×12 | paddingLeft | 8 | `pad!Le8` | ⚠️ |
| .Prefix / .Suffix | 全体 | 文字色 | — | `$m/colorText` / `$s/colorError` / `$s/colorWarning` / `$a/colorTextDisabled` | ✅ |

---

### 2.3 Input Number

| 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|
| Input Number ×42 | 背景 | `#FFFFFF` | `$c/InputNumber/activeBg` | ✅ |
| Input Number ×90 | 步进器边框 | `#E6E1D8` | `$c/InputNumber/handleBorderColor` → `m/colorBorder` | ✅ |
| Input Number ×84 | 圆角 | 6/4/10 | `$s/borderRadius` / `$m/borderRadius{SM,LG}` | ✅ |
| Input Number ×96 | 高度 | 32/24/40 | `$s/controlHeight` 系 | ✅ |
| Input Number ×192 | 内边距 | 11 | `$c/InputNumber/paddingInline` | ✅ |
| **.Number Action ×18** | **高度** | **32 FIXED** | **`!fix32`** | **⚠️ §7.9 已登记的回滚项，本次确认属实** |
| .Input Handle | 背景/边框 | — | `$m/colorBgContainer` / `$m/colorBorder` | ✅ |
| Input Number Addon ×12 | 高度 | 32/24/40 | `$s/controlHeight` 系 | ✅ |

---

### 2.4 Select

| 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|
| Select / .Selector ×42 | 背景 | `#FFFFFF` | `$c/Select/selectorBg` | ✅ |
| .Selector ×24 | 边框 | 主色/边框色 | `$c/Select/hoverBorderColor` / `activeBorderColor` / `$m/colorBorder` | ✅ |
| .Selector ×36 | 圆角 | 6/4/10 | `$s/borderRadius` / `$m/borderRadius{SM,LG}` | ✅ |
| .Selector ×42 | 高度 | 32/24/40 | `$s/controlHeight` / `$m/controlHeight{SM,LG}` | ✅ **§7.9 引为范式的正确样板** |
| .Selector ×112 | 内边距 | — | `$st/selectInputPaddingHorizontalBase` / `$a/paddingXS` | ✅ |
| **.Dropdown ×5** | **圆角** | **8** | **`$m/borderRadiusXL`** | ✅ 浮层档；antd `.ant-select-dropdown` 读 `borderRadiusLG` → **可用 `components.Select.borderRadiusLG=8` 落地** |
| .Dropdown ×5 | 背景 | `#FFFFFF` | `$m/colorBgElevated` | ✅ |
| .Dropdown ×5 | 阴影 | 纯黑三层 | `STY:boxShadowSecondary`（**零变量**） | ⚠️ 见 §3.1 第 1 条；antd Select 下拉确读 `boxShadowSecondary` |
| .Dropdown Item ×20 | 高度 | 32 | `$c/Select/optionHeight` → `s/controlHeight` | ✅ |
| .Dropdown Item ×20 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ antd option 读 `borderRadiusSM` |
| **.Select Item ×19** | **高度** | **30 FIXED** | **`!fix30`** | **⚠️ 与 `.Dropdown Item` 不一致，30 不随 `controlHeight`** |
| .Select Item ×38 | 内边距 | 1 / 2,4,2 | `pad!To1,Bo1` / `pad!To2,Ri4,Bo2` | ⚠️ |
| .Select Item ×10 | 预设 Tag 色 | — | `$co/{gold,cyan,blue,magenta,purple}/{1,3}` | ✅ kit 预设彩虹档，规范未定义 |
| .Tag Item ×6 | 高度 | 24/16/32 | `$m/controlHeight{SM,XS}` / `$s/controlHeight` | ✅ |
| .Select Footer | `Slot` ×1 | 背景 | `#FFFFFF` | `!#FFFFFF` | ⚠️ |

---

### 2.5 Segmented

| 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|
| Segmented ×12 | 轨道底 | `#FAF8F5` | `$c/Segmented/trackBg` → `m/colorBgLayout` | ✅ **与 antd 源码逐字一致**（`trackBg = colorBgLayout`） |
| Segmented ×12 | 选中块底 | `#FFFFFF` | `$c/Segmented/itemSelectedBg` → `m/colorBgElevated` | ✅ |
| .Segmented Item ×18 | hover 底 | 主色 α.108 | `$c/Segmented/itemHoverBg` → `m/colorFillSecondary` | ✅ |
| .Segmented Item ×18 | active 底 | 主色 α.274 | `$c/Segmented/itemActiveBg` → `m/colorFill` | ✅ |
| **.Segmented Item · `Adjuster` ×96** | **背景** | **`#FFFFFF`** | **`!#FFFFFF`（96 个节点全部 `visible=true`）** | **⚠️ 最高优先裸值，见 §3.1 第 3 条** |
| Segmented ×16 / ×48 / ×14 | 圆角 | 6 / 9999 / 2 | `$s/borderRadius` / `$m/borderRadiusFull` / `$m/borderRadiusXS` | ⚠️ antd item/thumb 读 `borderRadiusSM`，kit 用 `XS`（见 §4.8） |
| Segmented ×2 | large 圆角 | 10 | `$m/borderRadiusLG` | ✅ |
| Segmented / .Segmented Item | 高度 | 32/24/40 | `~hug` + `$st/segmentedLabelMinHeight*` | ⚠️ §7.9「Segmented 待你拍板」仍未决 —— item 20/28/36 = 外层 −4，照字面绑会让外层变 40/31/49 |
| Segmented ×96 | 内边距 | — | `$st/segmentedPaddingHorizontal*` / `$c/Segmented/trackPadding` | ✅ |
| Segmented ×42 | 阴影 | 纯黑三层 | `STY:boxShadowTertiary`（**零变量**） | ⚠️ |

---

### 2.6 浮层族：Modal · Drawer · Tooltip · Popover · Popconfirm · Dropdown · Message · Notification

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Modal | `.Modal Base` ×2、`.Dialog` ×4 | 圆角 | 8 | `$m/borderRadiusXL` | ✅ antd `.ant-modal-container` 读 `borderRadiusLG` → 可覆盖 |
| Modal | ×17 | 背景 | `#FFFFFF` | `$c/Modal/contentBg` → `m/colorBgElevated` | ✅ |
| Modal | `.Backdrop` ×2 | 遮罩 | `#262420@.45` | `$m/colorBgMask` | ✅ **缺口 7 修复实证** |
| Modal | `.Backdrop` ×12 | 效果 | `BACKGROUND_BLUR r4` | `!BACKGROUND_BLUR` | ⚠️ antd 遮罩无毛玻璃，设计稿多出一层（见 §4.9） |
| Modal | `.Modal Base` ×1 | 圆角 | 10 | `$m/borderRadiusLG` | ⚠️ 浮层内仍有 1 处吃面板档（header 的 `LG LG 0 0`，与 antd 一致，可保留） |
| Modal | `.Modal Close Icon` ×2 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ antd close 读 `borderRadiusSM` |
| Modal | `.Modal Base` ×2 | padding | 12,12 | `pad!To12,Ri12` | ⚠️ |
| Modal / Message / Notification | ×19 | 阴影 | 纯黑三层 | `STY:boxShadow`（**零变量**） | ⚠️ |
| **Drawer** | **`drawer-content` ×8** | **圆角** | 左两角 8 / 右两角 0（6 个变体四角 8） | `$m/borderRadiusXL` | ✅ 符 §3.2；**但 antd Drawer 面板不设任何圆角，只能自定义 CSS（§6 偏离项 2 已登记，本次逐行复核证实）** |
| Drawer | ×16 | 背景 | `#FFFFFF` | `$m/colorBgElevated` | ✅ |
| Drawer | ×32 | 头/脚分隔线 | `#E6E1D8` | `$a/colorSplit` | ✅ 与 antd `colorSplit` 一致 |
| Drawer | ×16 | 阴影 | 纯黑三层 ×4 方向 | `STY:_boxShadowDrawer{Right,Left,Up,Down}`（**零变量**） | ⚠️ |
| **Drawer** | **×9** | **宽度** | **378 / 736** | **绑到 `getLocalVariablesAsync()` 不返回的变量 id** | **❌ 见 §4.7** |
| Drawer Mask | ×4 | 遮罩 | `#262420@.45` | `$m/colorBgMask` | ✅ |
| **Tooltip** | **`body` ×26** | **圆角** | **8** | **`$m/borderRadiusXL`** | **❌ antd Tooltip 读 `borderRadius`，不读 `borderRadiusLG` —— 见 §4.1** |
| Tooltip | ×2 | 背景 | **`#000000@.85`** | `$m/colorBgSpotlight` | ❌ 未随暖墨，见 §4.5 |
| Tooltip | ×26 | 内边距 | — | `$st/tooltipVerticalPadding` / `$a/paddingXS` | ✅ |
| Tooltip | `.Tooltip Content` ×1 | 文字色 | `#FFFFFF` | `$a/colorTextLightSolid` | ✅ |
| Tooltip | ×26 | 阴影 | 纯黑三层 | `STY:boxShadowSecondary` | ⚠️ 且 antd v6 Tooltip 改用 `dropShadowPopover`（CSS filter），与 kit 的 box-shadow 语义已不同 |
| Tooltip | `.Tooltip Arrow Container` ×24 | padding/gap | 17/12/10 | `pad!Ri17,Le17` / `pad!Le12` / `gap!10` | ⚠️ 低危，箭头方位示意脚手架 |
| Popover / Popconfirm | ×4 | 圆角 | 8 | `$m/borderRadiusXL` | ✅ antd Popover 读 `borderRadiusLG` → 可覆盖；Popconfirm 复用 Popover |
| Popover / Popconfirm | ×4 | 背景 | `#FFFFFF` | `$m/colorBgElevated` | ✅ |
| Popover / Popconfirm | ×4 | 内边距 | — | `$a/paddingSM` / `$a/marginXS` | ✅ |
| Dropdown | `Dropdown Raw Menu` ×3 | 圆角 | 8 | `$m/borderRadiusXL` | ✅ antd `.ant-dropdown-menu` 读 `borderRadiusLG` → 可覆盖 |
| Dropdown | `.Dropdown Item` ×12 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ |
| Dropdown | ×61 | 内边距 | 12 | `$a/controlPaddingHorizontal` | ✅ |
| **Dropdown** | **`.Dropdown Item` `!fix22/32`、`.Dropdown Group Item` `!fix20/32` ×13** | **高度** | 固定 | `!fix*` | ⚠️ |
| Message | ×6 | 圆角/背景/内边距/文字 | 8 / `#FFFFFF` | `$m/borderRadiusXL` / `$m/colorBgElevated` / `$st/messageContentHorizontal` / `$m/colorText` | ✅ 全绑；antd `-notice` 读 `borderRadiusLG` → 可覆盖 |
| Notification | ×6 | 圆角/背景 | 8 / `#FFFFFF` | `$m/borderRadiusXL` / `$m/colorBgElevated` | ✅ |
| **Notification** | **×24** | **itemSpacing** | **12 / 10 / 8** | **`gap!12` `gap!10` `gap!8`** | ⚠️ 12 与 8 在 §4 表内，10 不在 |

---

### 2.7 Menu / Menu - Dark（FlowCanvas 侧栏）

| 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|
| Menu - Dark ×3 | 菜单底 | `#26211B` | `$c/Menu/darkItemBg` | ✅ §7.8 已改 |
| Menu - Dark ×2 | 子菜单底 | `#1C1711` | `$c/Menu/darkSubMenuItemBg` | ✅ |
| .Menu item - Dark ×2 | 项文字 | `#9B9184` | `$c/Menu/darkItemColor` | ✅ 对齐侧栏三色 |
| .Menu item - Dark ×4 | hover 文字 | `#EDE8DF` | `$c/Menu/darkItemHoverColor` | ✅ |
| .Menu item - Dark ×4 | 选中文字 | `#EDE8DF` | `$c/Menu/darkItemSelectedColor` | ✅ |
| **.Menu item - Dark · `submenu-title` ×6** | **hover 底** | 主色 α.108 | **`$c/Menu/itemHoverBg`（浅色档）** | **❌ kit 里 `Menu/darkItemHoverBg` 空置未用 —— 见 §4.2** |
| .Menu item - Dark ×2 | 选中底 | `#8A6F52` | `$c/Menu/darkItemSelectedBg` → `s/colorPrimary` | ⚠️ §7.8 记「`darkItemSelectedBg` 未动」，实测**已是 `colorPrimary` 别名**，与 §6 偏离项 1「保持未动」的表述不符，请复核 |
| **.Menu item - Light ×2** | **hover 文字** | `#262420` | **`$c/Segmented/itemHoverColor`** | **❌ 跨组件误绑 —— 见 §4.3** |
| .Menu item ×48 | 项高 | 40 | `$c/Menu/itemHeight` → `m/controlHeightLG` | ⚠️ 侧栏项高会随 `controlHeightLG`（→45）一起变，注意 08 的侧栏行高预期 |
| .Menu item ×268 | 项圆角 | 10 | `$c/Menu/itemBorderRadius` → `m/borderRadiusLG` | ⚠️ **面板档（14）会带动每个菜单项圆角** |
| .Menu Popup - Light/Dark ×4 | 弹出面板圆角 | 10 | `$c/Menu/itemBorderRadius` → `m/borderRadiusLG` | ⚠️ **浮层档遗漏**，见 §5.3 |
| .Menu item ×32 | padding | 8 | `pad!To8,Bo8` | ⚠️ |
| Menu ×10 | itemSpacing | 10 | `gap!10` | ⚠️ |
| Menu - Light/Dark ×2 | Horizontal 高 | 46 | `!fix46` | ⚠️ |
| .Horizonral Menu item - Light ×2 | 激活条填充 | `#8A6F52` | `$c/Menu/itemSelectedColor` | ⚠️ 文字色 token 当填充用（FlowCanvas 不用横向菜单，低危） |

---

### 2.8 Table / Table Column

| 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|
| Table Column / .Header Cell ×66 | 表头底 | **`#FAFAFA`** | `$c/Table/headerBg`（**扁平冷灰硬值**） | ❌ 见 §4.4 |
| Table / .Footer / .Expanded ×37 | 表尾底 | **`#FAFAFA`** | `$c/Table/footerBg`（扁平） | ❌ |
| .Body Cell ×12 | 行 hover 底 | **`#FAFAFA`** | `$c/Table/rowHoverBg`（扁平） | ❌ |
| .Header Cell ×24 | 排序 hover/active 底 | **`#F0F0F0`** | `$c/Table/headerSortHoverBg` / `headerSortActiveBg`（扁平） | ❌ |
| 全体 ×740 | 单元格边框 | `#F0EDE7` | `$c/Table/borderColor` → `m/colorBorderSecondary` | ✅ 与 antd 一致 |
| .Header Cell ×18 | 表头分隔 | `#F0EDE7` | `$c/Table/headerSplitColor` → `m/colorBorderSecondary` | ✅ |
| Table / .Title / .Footer ×72 | 外框圆角 | 10 | `$c/Table/headerBorderRadius` → `m/borderRadiusLG` | ✅ antd `tableRadius = headerBorderRadius`（默认 `borderRadiusLG`） |
| 全体 ×2,948 | 单元格内边距 | — | `$c/Table/cellPadding{Block,Inline}{,MD,SM}` → `a/padding` 系 | ✅ 全绑 |
| .Body Cell ×12 | 选中行底 | — | `$c/Table/rowSelectedBg` → `a/controlItemBgActive` | ✅ |
| **.Filter ×3** | **筛选浮层圆角** | **10** | **`$m/borderRadiusLG`** | ⚠️ **浮层档遗漏**，见 §5.3 |
| .Filter ×3 | 筛选浮层底 | `#FFFFFF` | `$m/colorBgElevated` | ✅ |
| .Table Header Cell Content ×1 | 浮层圆角 | 8 | `$m/borderRadiusXL`（继承自 `Dropdown Raw Menu` 实例） | ✅ |
| Table ×105 / Table Column ×54 | itemSpacing | −1 | `gap!-1` | ✅ 边框折叠，非缺陷 |
| .Header Cell ×36 | itemSpacing | 10 | `gap!10` | ⚠️ |
| Table `Embedded Spin` ×9 | 高度 | 27–397 FIXED | `!fix*` | ⚠️ 低危，演示占位 |
| .Body Cell ×96 | 演示 Tag 色 | — | `$co/geekblue/{1,3}` | ✅ 演示内容 |

---

### 2.9 Pagination · Tag

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Pagination | ×236 | 页码尺寸 | 32 / 24 | `$c/Pagination/itemSize` → `s/controlHeight`；`itemSizeSM` → `m/controlHeightSM` | ✅ |
| Pagination | ×58 | 页码底 | `#FFFFFF` | `$c/Pagination/itemBg` / `itemActiveBg` | ✅ |
| Pagination | ×176 | 圆角 | 6 | `$s/borderRadius` | ✅ antd Pagination 读 `borderRadius` |
| **Pagination** | **`.Pagination Item` hover ×2** | **圆角** | **6** | **`!6`** | ⚠️ 单个变体裸值，改控件档时此处不动 |
| Pagination | ×168 | 内边距 | — | `$st/paginationItemPaddingInline` | ✅ |
| Pagination | ×32 | itemSpacing | 10 | `gap!10` | ⚠️ |
| **Tag** | **default 档 ×2** | **背景/文字** | **`#F0EDE7` / `#8F8A80`** | **`$c/Tag/defaultBg` / `defaultColor`** | ✅ **缺口 8 修复实证** |
| Tag | ×52 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ 与 antd `borderRadiusSM` 逐字一致，符 §3.2 徽章档 |
| Tag | ×1 | 边框 | `#E6E1D8` | `$m/colorBorder` | ✅ |
| Tag | 预设彩虹 ×78 | 背景/边框/文字 | — | `$co/*/{1,3,6,7}` | ✅ §7.8「未动」豁免范围 |
| Tag | 语义档 ×24 | 背景/边框/文字 | 本项目色阶 | `$m/color{Success,Info,Error,Warning}{Bg,Border}` / `$s/color*` | ✅ |
| Tag | solid ×3 | 背景 | **`#000000`** | `$m/colorBgSolid` → `s/colorTextBase` | ❌ 见 §4.6 |
| Tag | ×142 | 内边距 | — | `$st/tagPaddingHorizontal` / `$st/iconMarginInline` | ✅ |

---

### 2.10 表单控件：Checkbox · Radio · Switch · DatePicker

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Checkbox | ×24 | 背景/边框 | 主色系 | `$m/colorBgContainer` / `$s/colorPrimary` / `$m/colorBorder` | ✅ |
| Checkbox | ×18 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ |
| Checkbox | ×24 | 尺寸 | 16 / 8 | `$st/checkboxSize` / `checkboxIndeterminateSize` | ✅ |
| Checkbox | `box` ×9 | paddingTop | 3 | `pad!To3` | ⚠️ 低危 |
| Radio | 全体 | 背景/边框/圆角/尺寸 | — | `$c/Radio/*` / `$st/radioRadius` / `$s/colorPrimary` | ✅ |
| **Radio Button** | **×6** | **高度** | **32 / 24 / 40 FIXED** | **`!fix*`** | ⚠️ |
| **.Radio Button** | **×36** | **高度** | **30 / 22 / 38** | **`$st/radioButtonHeight` 等（`static` 集合扁平值）** | ⚠️ **不随 `controlHeight`**；antd Radio.Button 高度 = `controlHeight`。改 36 后 Figma 仍 30 |
| .Radio Button | ×41 | itemSpacing | 10 | `gap!10` | ⚠️ |
| Switch | 全体 | 轨道/滑块/圆角/尺寸 | — | `$c/Switch/*` / `$st/borderRadiusSwitch*` | ✅ 全绑 |
| Switch | ×40 | 滑块阴影 | **`#00230B@.20`（绿黑）** | `STY:_switchHandleShadow`（**零变量**） | ⚠️ kit 上游残留的绿色阴影；且该 style **重名出现两次** |
| Switch Text & Icon | ×20 | 图标 padding | 3/4 | `pad!Ri3,Le4` 等 | ⚠️ 低危 |
| DatePicker | 输入框 ×42 | 圆角 | 6/4/10 | `$s/borderRadius` / `$m/borderRadius{SM,LG}` | ✅ |
| DatePicker | 输入框 ×96 | 内边距 | — | `$st/inputPadding*` | ✅ |
| **DatePicker** | **`Date Picker Panel` ×2** | **面板圆角** | **8** | **`$m/borderRadiusXL`** | ✅ antd `.ant-picker-panel-container` 读 `borderRadiusLG` → 可覆盖 |
| **Date Picker Panel** | **`preset` / `Picker Cell Header` ×7** | **边框** | **`#050505@.06`** | **`!#050505@0.06`** | **⚠️ 高优先，见 §3.1 第 4 条** |
| **.Picker Footer / .Picker Cell Extra Footer** | **×4** | **边框** | **`#050505@.06`** | **`!#050505@0.06`** | ⚠️ 同上 |
| **Date Picker Panel / .Picker Cell** | **×155** | **单元格高** | **36 FIXED** | **`!fix36`** | **⚠️ 最大单点裸值高度** |
| .Picker Cell | 内层 ×8 | 高度 | 24 | `$c/DatePicker/cellHeight` → `m/controlHeightSM` | ✅ 内层已绑、外层未绑 |
| .Picker Cell | ×7 | 圆角 | 4 | `$m/borderRadiusSM` | ✅ antd `-cell-inner` 读 `borderRadiusSM` |
| .Date Picker Preset Button | ×2 | 文字色 | **`#000000`** | `!#000000` | ⚠️ |
| .DatePicker item / .Range Picker | ×75 | 高度 | 24 / 26 FIXED | `!fix*` | ⚠️ |
| Date Picker Panel | ×7 | 内边距 | 18 / 10 | `pad!Ri18,Le18` / `pad!To10,Ri10,Bo10,Le10` / `gap!10` | ⚠️ 违反 §4 |
| .Picker Footer | ×2 | padding | 174 | `pad!To174,Bo174` | ⚠️ 异常大值，疑为画布布局残留 |

---

### 2.11 Layout · Spin · Empty · Divider · Breadcrumb · Alert · Form

| 组件 | 节点/变体 | 属性 | 当前值 | 绑定状态 | 判定 |
|---|---|---|---|---|---|
| Layout | ×6 | 主区底 | `#FAF8F5` | `$c/Layout/bodyBg` → `m/colorBgLayout` | ✅ |
| Layout | ×7 | 头部底 | `#FFFFFF` | `$c/Layout/headerBg`（扁平硬值） | ⚠️ 硬值，不随 `colorBgContainer` |
| Layout Sider | ×2 | 侧栏底 | `#26211B` | `$c/Layout/siderBg` | ✅ §7.8 已改 |
| Layout | ×9 | 头部高 | 64 | `$c/Layout/headerHeight` | ✅ |
| **Layout Header** | **×3** | **高度** | **48 FIXED** | **`!fix48`** | ⚠️ 一个 header 变体不跟 `headerHeight` |
| **Layout / Header / Footer / Content** | **×24** | **左右 padding** | **50 / 48 / 90** | **`pad!Ri50,Le50` 等** | **⚠️ 高优先，见 §3.1 第 5 条** |
| Layout | ×8 | 面板圆角 | 10 | `$m/borderRadiusLG` | ✅ 面板档 |
| Layout Sider / Header | ×3 | 分隔线 | `#E6E1D8` | `$a/colorSplit` | ✅ |
| Spin | ×15 | 点色 | `#8A6F52` | `$s/colorPrimary` / `$m/colorPrimaryBase` | ✅ |
| Spin | ×24 | 点尺寸 | 32/20/14 | `$c/Spin/dotSize{LG,,SM}` | ⚠️ `dotSizeLG` → `s/controlHeight`（antd 默认 `controlHeightLG`），见 §4.9 |
| Spin | `indicator-dot` ×12 | 圆角 | 100 | `!100` | ✅ 圆点，无实害 |
| Spin | ×6 | itemSpacing | 11/5/2 | `gap!*` | ⚠️ 低危 |
| Empty | ×20 | 内边距/间距 | — | `$a/margin*` | ✅ |
| Empty Image | ×9 | 插画填充 | — | `$st/emptyImageColor1..6` | ✅ |
| Empty Image | `Vector` ×6 | 渐变填充 | — | `!GRADIENT_LINEAR` | ⚠️ **已知限制**：带 alpha 落差的渐变色标不能绑变量（§7.5 实测教训） |
| Divider | ×36 | 分隔线 | `#E6E1D8` | `$a/colorSplit` | ✅ **antd Divider 唯一使用 `colorSplit`，逐字一致** |
| Divider with Content | ×15 | padding | 14 / 2 | `pad!Ri14,Bo2,Le14` 等 | ⚠️ |
| Breadcrumb | 全体 | 文字/间距/圆角/hover 底 | — | `$c/Breadcrumb/*` / `$a/paddingXXS` / `$m/borderRadiusSM` | ✅ **全清** |
| Alert | ×24 | 四型底 | 本项目 tint | `$m/color{Success,Info,Warning,Error}Bg` | ✅ |
| Alert | ×8 | 四型边框 | 本项目 border 阶 | `$m/color*Border` | ✅ |
| Alert | ×16 | 圆角 | 6 | `$s/borderRadius` | ✅ **antd Alert 确读 `borderRadius`（非 LG），接线正确** |
| Alert | ×72 | 内边距 | — | `$a/padding*` / `$st/alertPaddingHorizontal` | ✅ |
| .Alert Title / .Alert Content | ×2 | 高度 | 30 FIXED | `!fix30` | ⚠️ |
| Form Item Label | ×3 | 标签色 | `#262420` | `$c/Form/labelColor` → `a/colorTextHeading` | ✅ |
| Form Item Label | ×22 | 标签高 | 32 | `$c/Form/labelHeight` → `s/controlHeight` | ✅ |
| .Required Mark | ×1 | 星号色 | `#C24E3F` | `$c/Form/labelRequiredMarkColor` → `s/colorError` | ✅ |
| .Form Item Help | ×4 | 四态文字 | 本项目色阶 | `$m/color{Error,Success,Warning}Text` / `$m/colorTextTertiary` | ✅ |
| **Form Item Label** | **×5** | **padding** | **6** | **绑到 `getLocalVariablesAsync()` 不返回的变量 id** | **❌ 见 §4.7** |
| Form Item Label | `:` ×3 | 文字色 | `#000000`（节点隐藏） | `!#000000` | ⚠️ 低危 |
| Form Item / Form Item Horizontal | ×21 | itemSpacing | 10 | `gap!10` | ⚠️ |
| Form Item / Form Item Horizontal | ×22 | 高度 | 22–140 FIXED | `!fix*` | ⚠️ 低危，演示装配的控件实例 |

---

## 3. ⚠️ 裸值未绑：分档清单

**总计约 1,260 处**（按「属性 × 签名」聚合，含低危项）。按「改主题时会导致什么改不动」排序：

### 3.1 第一档 · 会直接导致换肤失效（务必处理）

| # | 位置 | 数量 | 裸值 | 改主题时改不动的东西 |
|---|---|---|---|---|
| 1 | **全部浮层阴影** — `boxShadow` / `boxShadowSecondary` / `boxShadowTertiary` / `boxShadowCard` / `boxShadowPopoverArrow` / `boxShadowDrawer{Right}` / `_boxShadowDrawer{Right,Left,Up,Down}` / `_switchHandleShadow`×2 | **12 个 effect style，被约 330 个节点引用** | 三层纯黑 `#000000@{.05,.12,.08}`；Switch 为 `#00230B@.20` | **07 §4 定义的暖墨三级阴影（`rgba(38,36,32,·)`）在 kit 里完全没落地。** 改任何变量都动不了阴影 —— 只能逐个改 effect style 本身。影响 Modal / Drawer / Dropdown / Select / DatePicker / Message / Notification / Popover / Tooltip / Menu Popup / Segmented / Table 筛选浮层 |
| 2 | `Textarea` · `line` 节点 | 背景 **102**、圆角 **102** | `#666666`、`10` | 文本行示意条永远是冷灰 `#666666`，与暖色系统冲突；圆角 10 不随控件档 |
| 3 | `.Segmented Item` · `Adjuster` 节点 | **96（全部 `visible=true`）** | `#FFFFFF` | 分段选择器内一层可见的硬编码纯白。改 `colorBgElevated` / `colorBgContainer` 均不生效 |
| 4 | `Date Picker Panel` / `.Picker Footer` / `.Picker Cell Extra Footer` 边框 | **11**（含 2 个隐藏） | `#050505@.06` | 日期面板的所有分隔线是冷黑 6%，改 `colorSplit`（`#E6E1D8`）/ `colorBorder` 都不动 |
| 5 | `Layout` / `Layout Header` / `Layout Footer` / `Layout Content` / `.Demo Logo` 左右 padding | **24** | `50` / `48` / `90` | FlowCanvas 头部与主区要 `space/inner`=16（§4），设计稿里改不动。代码侧须覆盖 `Layout.headerPadding` |
| 6 | `Date Picker Panel` / `.Picker Cell` 单元格外框高 | **155** | `36` | 日历格高度不随 `controlHeight`；内层已绑 `cellHeight`，外层没绑，改档后内外层错位 |

### 3.2 第二档 · 会造成组件内部不齐（建议处理）

| # | 位置 | 数量 | 裸值 | 后果 |
|---|---|---|---|---|
| 1 | **`Input` 的 `outlined/default/default/default/False` 变体** | **1** | `layoutSizingVertical=FIXED, h=36` | **最常用的那个 Input 变体被钉死 36**，其余 16 个变体是 HUG。`controlHeight` 改动后这一个不跟随 → 同一组件内出现两种高度 |
| 2 | `Search` / `Input Addon` 内嵌 `Input` 实例 | 11 | `!fix35/39/42/46/51/52/59` | 实例级钉死，Search 与 Addon 的输入框不随控件高 |
| 3 | `.Number Action` | **18** | `!fix32` | §7.9 已登记的回滚项；InputNumber 步进器永远 32 |
| 4 | `.Select Item` | **19** | `!fix30` | 与已绑 `optionHeight` 的 `.Dropdown Item` 不一致 |
| 5 | `.Radio Button` 高度绑 `static/radioButtonHeight`(30/22/38) + `Radio Button` 外层 `!fix32/24/40` | 36 + 6 | 静态值 | antd Radio.Button 高 = `controlHeight`；kit 走 static，**改 36 不跟随** |
| 6 | `.Input item` / `.Input Password item` / `.DatePicker item` / `.Range Picker` 的 `content` 行盒 | 110 | `!fix24` / `!fix26` | 内层文本盒不随字号/控件高 |
| 7 | `Layout Header` `Dark,False,2` 变体 | 3 | `!fix48` | 不跟 `headerHeight`(64) |
| 8 | `Menu - Light/Dark` Horizontal | 2 | `!fix46` | 不跟 `horizontalLineHeight`（该变量本身已绑到别处） |
| 9 | `.Pagination Item` hover 变体圆角 | 2 | `!6` | 单变体圆角不随控件档 |

### 3.3 第三档 · 违反 §4 间距纪律（批量清理项）

**`gap!10`（itemSpacing = 10）共约 200 处**，分布：`Textarea` 73、`.Input item`/`.DatePicker item`/`.Range Picker` 45、`.Radio Button` 41、`.Header Cell` 36、`Pagination` 32、`Menu` 10、`Form Item*` 21、`Table` 5、`Notification` 12、`Date Picker Panel` 3、`.Filter` 3、其余零散。

07 §4 明令「一切间距取自本表，不得出现表外数值（7 / 10 / 18 / 20 / 22 之类）」——**10 正在表外**。其余表外裸值间距还有：`pad!Ri17,Le17`(36)、`pad!Ri14`(15)、`pad!Ri18,Le18`(3)、`pad!To7,Bo7`(2)、`pad!Ri3,Le4`(20)、`pad!To174,Bo174`(2)。

### 3.4 第四档 · 低危 / 不建议改

| 位置 | 数量 | 说明 |
|---|---|---|
| `gap!-1` | ~200 | 边框折叠技巧（Table / Search / Addon），**故意为之，勿动** |
| `.Slot [Swap Me]` 的 `INNER_SHADOW #FFFFFF@.50` | ~80 | kit 占位标记；§7.9 缺口 10 已拍板「不改」 |
| `.Slot [Swap Me]` 的品红三色 | — | 同上，保留提示价值 |
| `Empty Image` 的 `GRADIENT_LINEAR` | 6 | §7.5 实测教训：带 alpha 落差的渐变色标绑变量会被抹平，**只能保留字面值** |
| `Spin` `indicator-dot` 圆角 `100` | 12 | 圆点 |
| `Checkbox Group` / `Form Item Horizontal` 的 `#EEE1FF@.01` | 3 | Figma 组件集画布底，非组件表面 |
| `.Tooltip Arrow Container` / `.Placement` / `.Pacement` 的方位 padding | 36 | 箭头方位示意脚手架，不进最终稿 |
| `Table` `Embedded Spin` / `Form Item` 演示实例的 `!fix*` | ~31 | 演示装配产物 |

---

## 4. ❌ 疑似接错清单（含 antd 依据）

> 依据来源标注：**【我直接查证】**= 本次由我用 WebFetch 取官方文档原文；**【源码包查证】**= 由子 agent 读取已下载的 `antd@6.6.0` npm 发布包（`es/**/style/*.js`，由 `components/**/style/*.ts` 编译、token 名逐字保留）并给出行号。GitHub 对应路径为 `https://github.com/ant-design/ant-design/blob/master/components/<组件>/style/index.ts`。

### 4.1 ❌ Tooltip 圆角：kit 绑 `borderRadiusXL`，antd 读 `borderRadius`（26 节点，最高影响面）

- **kit 现状**：`Tooltip` 组件集 26 个 `body` 节点四角全部绑 `map/borderRadiusXL`（=8）。
- **antd 事实**【源码包查证】：`tooltip/style/index.js` L157 `tooltipBorderRadius: borderRadius`；L41 `.ant-tooltip-container { borderRadius: tooltipBorderRadius }`。**Tooltip 全程不读 `borderRadiusLG`。**
- **后果**：07 §1.2 / §3.2 写的「浮层圆角 8 = 逐组件覆盖 `borderRadiusLG`」对 Tooltip **不成立**。若代码里写 `components.Tooltip.borderRadiusLG = 8`，**Tooltip 仍会渲染成控件档圆角**，设计稿 8 / 代码 10，分家。
- **正确落地**：`components.Tooltip.borderRadius = 8`，或直接覆盖组件 token `components.Tooltip.tooltipBorderRadius = 8`。
- **附带**：antd v6 的 Tooltip 阴影已改 `dropShadowPopover`（CSS `filter`），而 kit 用 `boxShadowSecondary`（`box-shadow`）—— 阴影语义也不同。

### 4.2 ❌ 深色菜单 hover 底绑到浅色档 token（6 变体，直接影响 FlowCanvas 侧栏）

- **kit 现状**：`.Menu item - Dark` 的 6 个 `State=hover` 变体，其 `submenu-title` 节点填充绑 `components/Menu/itemHoverBg`（→ `alias/colorBgTextHover` → `map/colorFillSecondary`，主色 α.108）。
- **反证**：kit 的 `components` 集合里**明确存在 `Menu/darkItemHoverBg`**（本次枚举 `Menu/dark*` 共 15 个变量，含它），但**零节点引用**。
- **后果**：FlowCanvas 侧栏用 `Menu theme="dark"`（§6 偏离项 1）。改 `Menu/darkItemHoverBg` 在设计稿上不生效；改 `Menu/itemHoverBg` 则会同时改掉浅色菜单。设计稿与代码必然分家。
- **建议**：6 处改绑 `Menu/darkItemHoverBg`（本次只读，未改）。

### 4.3 ❌ Menu 项文字绑到 Segmented 的 token（跨组件误绑）

- **kit 现状**：`.Menu item - Light` 有 2 处文字填充绑 `components/Segmented/itemHoverColor`（→ `map/colorText`）。
- **后果**：值目前恰好相同所以外观无异常，但**改 Segmented 的 hover 文字色会误伤 Menu**，反之改 Menu 的 hover 文字色改不动这两处。属典型的「静默接错」。

### 4.4 ❌ Table 的 7 个组件变量是 antd 原生冷灰扁平值（与 Tag 缺口 8 同类，此前未登记）

| 变量 | 当前 Light 值 | 引用节点 | antd 语义【源码包查证】 |
|---|---|---|---|
| `components/Table/headerBg` | **`#FAFAFA`** | 66 | `table/style/index.js` L192/215：由 `colorFillAlter` 经 `FastColor(...).onBackground(colorBgContainer)` 实色化 |
| `components/Table/footerBg` | **`#FAFAFA`** | 37 | 同源 |
| `components/Table/rowHoverBg` | **`#FAFAFA`** | 12 | 同源 |
| `components/Table/bodySortBg` | **`#FAFAFA`** | 0（本次未见引用） | 同源 |
| `components/Table/headerSortHoverBg` | **`#F0F0F0`** | 12 | `colorFillSecondary` 实色化（L190/200） |
| `components/Table/headerSortActiveBg` | **`#F0F0F0`** | 12 | 同源 |
| `components/Table/fixedHeaderSortActiveBg` | **`#F0F0F0`** | 0 | 同源 |

- **后果**：`colorFill*` 族已按 §7.8 改为主色 `#8A6F52` 的低透明度档（合成到白底为 `#FBF9F8`/`#F7F5F2`/`#F2F0EC`），但 **Table 这 7 个变量是烤死的冷灰硬值，完全不跟随**。表格在暖米白页面上会显出冷灰表头与冷灰行 hover。
- **修法**（与缺口 8 同型，零节点改动）：只改这 7 个变量的 Light 值为暖色实色，或断开为对应 `colorFill*` 的别名。
- **对照**：Table 其余变量（`borderColor`、`cellPadding*`、`headerSplitColor`、`rowSelectedBg`、`headerBorderRadius` 等）**全部是别名，接线正确**。

### 4.5 ❌ `map/colorBgSpotlight` 仍是 antd 原生纯黑（Tooltip 底）

- 当前值 `#000000@0.85`，引用节点 3（`Tooltip` + `.Tooltip Arrow`）。
- 遮罩 `colorBgMask` 已按 §7.8 改为暖墨 `#262420@.45`，但同为「深色覆盖面」的 Tooltip 底**没改**。FlowCanvas 会用 Tooltip（§6 偏离项 7），暖色系里出现纯黑气泡。
- **修法**：改 1 个变量值即可（`#262420` 系），零节点改动。

### 4.6 ❌ `seed/colorTextBase` 仍是 `#000000`（solid 型组件会是纯黑）

- 链路：`map/colorBgSolid` → `seed/colorTextBase` = `#000000`；`map/colorBgSolidHover` = `#000000@0.75`（扁平）。
- 引用：`Default Button` solid 变体 30 处、`Tag` solid 2 处。
- **矛盾**：`map/colorText` 已改 `#262420`（§2.1 `--text`），但 `seed/colorTextBase` 未改 —— 两者本应同源。
- FlowCanvas 目前不用 solid 型按钮/Tag，**风险为潜在**；但一旦用到就是纯黑。

### 4.7 ❌ 14 处绑定指向 `getLocalVariablesAsync()` 不返回的变量

| 变量 id | `getVariableByIdAsync` 解出 | 值 | 绑定处 |
|---|---|---|---|
| `VariableID:174:4165` | `static/drawerWidth`（`remote:false`） | 378 | `Drawer` ×4 |
| `VariableID:174:4166` | `static/drawerWidthLG`（`remote:false`） | 736 | `Drawer` ×5 |
| `VariableID:178:72037` | `alias/paddingXS1`（`remote:false`） | 6 | `Form Item Label` ×5 |

- 这三个变量**能按 id 取到、`remote:false`，但不出现在 `getLocalVariablesAsync()` 的返回里** —— 典型特征是**已删除但仍被节点引用**。
- 佐证：`Drawer` 同时还绑了 `alias/drawerWidth`(378) ×8 与 `alias/drawerWidthLG`(736) ×7 —— 同值同名、分属两个集合，像是迁移后旧引用未清。
- **需人工在 Figma UI 里确认**（Plugin API 无法区分「已删除」与「隐藏于发布」）。若确为已删除，这 14 处绑定等同裸值，改值无从改起。

### 4.8 ❌（低危）Segmented item 圆角绑 `borderRadiusXS`

- kit：`Segmented` / `.Segmented Item` 有 30 处绑 `map/borderRadiusXS`（=2）。
- antd【源码包查证】：`segmented/style/index.js` L81/162 —— item / thumb 读 **`borderRadiusSM`**；lg→`borderRadiusLG`、sm→`borderRadiusSM`、round→`9999`。kit 的 `borderRadiusFull`(9999) 与 root 的 `borderRadius` ✅ 正确，只有 XS 这档对不上。

### 4.9 ❌（低危）两处尺寸/效果与 antd 不对位

- `components/Spin/dotSizeLG` → `seed/controlHeight`。antd Spin 的大号点尺寸默认取 `controlHeightLG`。改 `controlHeight`=36 会让 Spin 大号点变 36。
- `Modal` / `.Backdrop` / `Drawer Mask` 上有 **17 处 `BACKGROUND_BLUR r4`**，antd 遮罩无毛玻璃（`modal/style/index.js` L37 仅 `backgroundColor: colorBgMask`）。设计稿比代码多一层模糊。

### 4.10 ⚠️（机制性差异，非接错，但会让稿子与代码对不上）Input 内边距

- kit：`Input` 系内边距绑 `static/inputPadding{Vertical,Horizontal}{,SM,LG}` —— **静态值，不随 `controlHeight` 变**。
- antd【源码包查证】：`input/style/token.js` L36-43，`paddingBlock = Math.round((controlHeight − fontSize×lineHeight)/2 ×10)/10 − lineWidth` —— **是从 `controlHeight` 派生的**。
- 后果：把 `controlHeight` 从 32 改到 36 时，Figma 里输入框靠「高度变高、padding 不变」达成，代码里靠「padding 变大、无显式高度」达成。**视觉结果一致，但内部文字基线会有 1–2px 偏差**，且再改字号时两侧行为会分叉。记录备查，不建议改动 kit。

---

## 5. 返工项 11 核实：65 处 `borderRadiusXL` 改绑的实际分布

### 5.1 实测结论：**实际是 66 处源节点，不是 65**

只统计**源节点**（组件集内的 COMPONENT / FRAME），排除 INSTANCE 继承：

| 组件集 | 页面 | 源节点数 | 节点名 / 变体 | 07 §7.8 记载 | 差异 |
|---|---|---|---|---|---|
| `Tooltip` | Tooltip | **26** | `body`（26 个变体） | 26 | ✅ |
| `Drawer` | Drawer | **8** | `drawer-content`（8 个变体，其中 2 个只绑左两角、右两角为 0） | 7 | **+1** |
| `.Modal Base` + `.Dialog` | Modal | **6** | `.Modal Base` 2（`False,False` / `False,True`）+ `.Dialog` 4（confirm/info/error/warning） | 6 | ✅ |
| `Notification` | Notification | **6** | default/success/info/warning/error（`False`）+ `default,True` | 6 | ✅ |
| `Message` | Message | **6** | default/loading/info/success/error/warning | 6 | ✅ |
| `.Dropdown` | Select | **5** | 5 个变体 | 5 | ✅ |
| `Dropdown Raw Menu` | Dropdown | **3** | `False,False,False` / `False,True,True` / `True,False,False` | 3 | ✅ |
| `Popover` | Popover | **2** | `body` ×2 | 2 | ✅ |
| `Popconfirm` | Popconfirm | **2** | `body` ×2 | 2 | ✅ |
| `Date Picker Panel` | DatePicker | **2** | `Default`（`753:74023`）、`container`（`4707:152207`） | 2 | ✅ |
| **合计** | | **66** | | 65 | **+1** |

**差异来源已知**：07 §7.8 末尾的「规范外发现」已记录 —— `Drawer / Placement=right, Size=large` 变体原为裸值 8、未绑，被一并处理，**§7.8 的「Drawer 7 个」漏计了它**。本次实测证实为 8 个，故总数应为 **66**。

### 5.2 每处在代码侧能否用 `borderRadiusLG` 落地

| 组件 | 源节点 | antd 根容器读的 token【源码包查证】 | 代码侧落地方式 |
|---|---|---|---|
| Modal | 6 | `borderRadiusLG`（`modal/style/index.js` L127，`.ant-modal-container`） | ✅ `components.Modal.borderRadiusLG = 8` |
| Select 下拉 | 5 | `borderRadiusLG`（`select/style/dropdown.js` L49） | ✅ `components.Select.borderRadiusLG = 8` |
| Dropdown | 3 | `borderRadiusLG`（`dropdown/style/index.js` L164） | ✅ |
| Popover | 2 | `borderRadiusLG`（`popover/style/index.js` L63） | ✅ |
| Popconfirm | 2 | 复用 Popover（`popconfirm/style/index.js` 全文无 borderRadius，L20 `&${antCls}-popover`） | ✅ 覆盖 `Popover` 即可 |
| Message | 6 | `borderRadiusLG`（`notification/style/notification.js` L54，Message 复用 `genListItemSharedStyle`） | ✅ |
| Notification | 6 | `borderRadiusLG`（同上） | ✅ |
| DatePicker 面板 | 2 | `borderRadiusLG`（`date-picker/style/index.js` L357，`.ant-picker-panel-container`） | ✅ |
| **小计可用 LG 覆盖** | **32** | | |
| **Tooltip** | **26** | **`borderRadius`**（经 `tooltipBorderRadius`，`tooltip/style/index.js` L157 / L41） | ❌ **必须写 `components.Tooltip.borderRadius = 8`** |
| **Drawer** | **8** | **不设任何圆角**（288 行全文 `borderRadius` 仅出现 1 次，L149 给关闭按钮的 `borderRadiusSM`） | ❌ **必须自定义 CSS**（§6 偏离项 2 已登记） |
| **合计** | **66** | | |

> 一句话：**66 处里 32 处走 `borderRadiusLG` 覆盖即可；26 处 Tooltip 要走 `borderRadius`；8 处 Drawer 只能自定义 CSS。** 07 §3.2 的「悬浮浮层 → 逐组件覆盖 `borderRadiusLG = 8`」需要加两条例外。

### 5.3 浮层档返工的**遗漏**（本次新发现）

以下节点在语义上属浮层，但**仍绑面板档 `borderRadiusLG`**，未随返工改到 XL：

| # | 位置 | 数量 | 现状 | 备注 |
|---|---|---|---|---|
| 1 | `Table` · `.Filter`（表格筛选下拉面板） | 3 | `$m/borderRadiusLG` | 底色已是 `colorBgElevated`，形态是浮层。**注**：antd 侧该面板走 Dropdown → 也读 `borderRadiusLG`，故 kit 现状与 antd 一致；这是**与本项目「浮层 8」设计意图**的不一致，非 antd 接错 |
| 2 | `.Menu Popup - Light` / `.Menu Popup - Dark` | 4 | `$c/Menu/itemBorderRadius` → `m/borderRadiusLG` | 菜单弹出面板，同上 |
| 3 | `components/Table/filterDropdownBg` / `filterDropdownMenuBg` | 变量级 | → `map/colorBgContainer` | 浮层底应为 `colorBgElevated`（两者当前同值 `#FFFFFF`，暂无外观差） |

---

## 6. B · 变量影响图（反向索引）

**读法**：改这个变量 → 这些组件集会变。
**统计口径**：只统计 28 个目标页面内、组件集**内部**节点的绑定（**已排除组件集外框自身的绑定**，否则 `borderRadiusLG` 会被虚高约 1,100 处）；不下钻 INSTANCE 子树。`绑定处数`按「字段级」计（一个节点的四个圆角算 4 处）。集合缩写同 §2。

### 6.1 几何档（换肤四大杠杆）

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `seed/borderRadius` | 6 | **2,752** | Button, Default Button, Danger Button, Input, Password, Textarea, Input Addon, Search, Addon Before, Addon After, Input Number, Input Number Addon, Select, .Selector, .Select Footer, .Tag Item, Segmented, .Segmented Item, Radio Button, DatePicker, Range Picker, .Header Cell, .Filter Button, .Table Cell Content, .Row Expand Button, .Filter, Pagination, .Pagination Item, .Pagination Arrow, .Pagination More, .Footer(Modal), .drawer footer, Extra, .Collapse button, Empty, Form Item, Form Item Horizontal, Alert |
| `map/borderRadiusLG` | 10 | **1,200** | Button, Default Button, Danger Button, Input, Password, Textarea, Input Addon, Search, Input Number, Input Number Addon, .Selector, Segmented, Radio Button, DatePicker, Range Picker, .Filter, .Modal Base, Layout, Layout Content — **另经 `Table/headerBorderRadius`（72 处）波及 Table/.Title/.Footer；经 `Menu/itemBorderRadius`（268 处）波及全部 Menu 项与 Menu 弹层** |
| `map/borderRadiusSM` | 4 | **2,464** | Button, Default Button, Danger Button, Input, Password, Textarea, Input Addon, Search, Input Number, Input Number Addon, .Selector, .Select Item, .Dropdown, .Dropdown Item, .Tag Item, .Select Group, Segmented, .Segmented Item, Checkbox, Radio Button, DatePicker, Range Picker, Date Picker Panel, .Picker Cell, .Picker Footer Range, .Date Picker Preset Button, .Body Cell, .Table Cell Content, .Filter, Pagination, Tag, .Tag button, .Modal Base, .Modal Close Icon, drawer-close, .Actions, Dropdown Raw Menu, .Dropdown Group Item, .Menu extra - Light, .Menu extra - Dark, .Breadcrumb Item, .Alert Extra, Notification, .Close Icon |
| **`map/borderRadiusXL`**（浮层档） | **8** | **536** | **Modal, .Modal Base, .Dialog, Drawer, Tooltip, Popover, Popconfirm, Dropdown Raw Menu, Dropdown Placement, Message, Notification, .Dropdown(Select), .Dropdown Placement, DatePicker, Date Picker Panel, .Table Header Cell Content** |
| `map/borderRadiusXS` | 2 | 128 | .Tag Item, Segmented, .Segmented Item |
| `map/borderRadiusFull` | 9999 | 384 | Segmented, .Segmented Item |
| `seed/controlHeight` | 32 | **767** | Button, Default Button, Danger Button, Input, Password, Input Addon, Search, .Input item, .Input Password item, Addon Before, Addon After, Input Number, Input Number Addon, Select, .Selector, .Select Footer, .Tag Item, Pagination, .Pagination Arrow, .Pagination More, .Footer(Modal), .drawer footer, Extra, .Collapse button, Empty, Form Item, Form Item Horizontal — **另经 `Select/optionHeight`(50)、`Pagination/itemSize`(118)、`Form/labelHeight`(22)、`Spin/dotSizeLG`(8)、`Table/selectionColumnWidth` 间接波及** |
| `map/controlHeightSM` | 24 | **802** | Button, Default Button, Danger Button, Input, Password, Input Addon, Search, .Input item, .Input Password item, Addon Before, Addon After, Input Number, Input Number Addon, .Selector, .Tag Item, .Picker Footer Range, .Table Cell Content, .Filter, Pagination, .Pagination Arrow, drawer-close, .Actions, .Alert Extra, Notification, .Close Icon — 另经 `Pagination/itemSizeSM`(118)、`DatePicker/cellHeight`(16) 间接波及 |
| `map/controlHeightLG` | 40 | **650** | Button, Default Button, Danger Button, Input, Password, Input Addon, Search, .Input item, .Input Password item, Addon Before, Addon After, Input Number, Input Number Addon, .Selector — **另经 `Menu/itemHeight`(48) 波及侧栏菜单项高** |
| `map/controlHeightXS` | 16 | 2 | .Tag Item |
| `seed/fontFamily` | Inter | **1,101** | 几乎全部组件集（Button 系、Input 系、Select 系、Segmented, Checkbox, Radio, Switch, DatePicker 系, Table 系, Pagination, Tag, Modal 系, Drawer 系, Tooltip, Popover, Dropdown 系, Menu 全族, Layout, Spin, Empty, Form 系, Breadcrumb, Divider, Alert, Message, Notification） |
| `seed/fontSize` | 14 | 736 | 同上（略） |
| `seed/lineWidth` | 1 | **7,758** | 几乎全部有描边的组件集 |

### 6.2 颜色 — 主色 / 错误色 / 语义色

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `seed/colorPrimary` → `map/colorPrimaryBase` | `#8A6F52` | **209** | Button, Search, Checkbox, Radio, Radio Button, .Radio Button, Switch, Switch Text & Icon, .Picker Cell, .Picker Footer Range, .Filter, Pagination, .Pagination Item, .Tag button, .Footer(Modal), Drawer, .drawer footer, Extra, .Actions, Spin, Empty, .Alert Extra — 另经 `Input/activeBorderColor`、`Select/activeBorderColor`、`DatePicker/activeBorderColor`、`InputNumber/activeBorderColor`、`Radio/buttonSolidCheckedBg`、`Menu/itemSelectedColor`、`Menu/darkItemSelectedBg`、`Pagination/itemActiveColor`、`Form/labelRequiredMarkColor`、`Spin/*` 间接波及 |
| `map/colorPrimaryHover` | `#74593F` | **137** | Button, Default Button, Checkbox, .Radio Button, Switch, Switch Text & Icon, .Pagination Item, .Tag button — 另经 `Input/hoverBorderColor`、`Select/hoverBorderColor`、`DatePicker/hoverBorderColor`、`InputNumber/hoverBorderColor`、`Radio/buttonSolidCheckedHoverBg` 波及 |
| `map/colorPrimaryActive` | `#5B412A` | 97 | Button, Default Button, .Radio Button, .Range Picker, .Tag button — 经 `Radio/buttonSolidCheckedActiveBg` 波及 |
| `map/colorPrimaryBg` | `#F1EAE0` | 30 | Button（filled 型） |
| `map/colorPrimaryBgHover` | `#D5C6B2` | 18 | Button, .Picker Cell |
| `map/colorPrimaryBorder` | `#BCA58A` | 30 | Button |
| `map/colorPrimaryText{,Hover,Active}` | `#8A6F52`/`#74593F`/`#5B412A` | 40 | Button, Default Button |
| `seed/colorError` → `map/colorErrorBase` | `#C24E3F` | **129** | Danger Button, Input, Password, Textarea, .Prefix, .Suffix, Input Number, DatePicker, Range Picker, Tag, .Dropdown Item, .Dropdown Option Node — 经 `Menu/dangerItem*`、`Menu/darkDangerItem*`、`Form/labelRequiredMarkColor` 波及 |
| `map/colorErrorHover` | `#A5392C` | 72 | Danger Button, Input, Password, Textarea, Input Number, .Selector, DatePicker, Range Picker — 经 `Menu/darkDangerItemHoverColor` 波及 |
| `map/colorErrorBg` | `#FAE9E6` | 40 | Danger Button, Tag, .Footer(Modal), .drawer footer, Alert — 经 `Menu/dangerItemSelectedBg` 波及 |
| `map/colorErrorBorder` | `#E29C90` | 3 | Tag, Alert |
| `map/colorError{Text,TextHover,TextActive,Active,BgActive,BgFilledHover}` | 见 §2.4 | 137 | Danger Button, .Form Item Help |
| `map/colorSuccess{Bg,Border,Text}` / `seed/colorSuccess` | `#E6F4EC`/`#95CBAE`/`#2F9E6C` | 15 | Tag, Alert, .Form Item Help |
| `map/colorWarning{Bg,Border,Text,Hover}` / `seed/colorWarning` | `#F8EFDD`/`#D0B07D`/`#B07818`/`#956300` | 89 | Tag, Alert, .Form Item Help, Input, Password, Textarea, Input Number, .Selector, DatePicker, Range Picker, .Prefix, .Suffix |
| `map/colorInfo{Bg,Border}` / `seed/colorInfo` | `#F0EDE7`/`#A49F97`/`#6F6A61` | 15 | Tag, Alert |

### 6.3 颜色 — 中性 / 填充 / 背景

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `map/colorText` | `#262420` | **287** | Default Button, .Input item, .Input Password item, .Input Textarea item, Addon Before/After, .Prefix, .Suffix, .Select Item, .Dropdown Item, .Tag Item, .Segmented Item, Checkbox, Radio, Date Picker Panel, .DatePicker item, .Range Picker, .Picker Cell, .Body Cell, .Header Cell, .Title, Pagination, .Pagination Item, .Tag button, .Dialog Content, drawer title, .Content, .Dropdown Option Node, .Submenu arrow - Light, Layout Content, Layout Footer, Empty, .Divider content, .Alert Title, Message, Notification — 另经 `Menu/itemColor`、`Segmented/itemSelectedColor`、`Select/optionSelectedColor`、`Radio/buttonColor`、`Breadcrumb/lastItemColor` / `linkHoverColor`、`alias/colorTextHeading` 波及 |
| `map/colorTextSecondary` | `#6F6A61` | 10 | Pagination, .Alert Close — 经 `alias/colorTextLabel` → `Segmented/itemColor` 波及 |
| `map/colorTextTertiary` | `#9C968B` | 14 | Switch, Switch Text & Icon, Empty, .Form Item Extra, .Form Item Help — 经 `alias/colorTextDescription`（106 处）波及 Textarea, .Input item, .Select Group, .DatePicker item, .Range Picker, .Pagination Item, .Dropdown Group Option Node, Form Item Label, Breadcrumb 系, Menu 组标题 |
| `map/colorTextQuaternary` | `#B6B0A4` | 13 | Switch, Switch Text & Icon, .Picker Cell, Form Item — **经 `alias/colorTextDisabled`(220) 与 `alias/colorTextPlaceholder`(42) 大面积波及全部输入类与按钮禁用态** |
| `map/colorBorder` | `#E6E1D8` | **489** | Button 系, Input 系, Addon 系, Input Number 系, .Input Handle, Select, .Selector, .Select Footer, Checkbox, Radio, Radio Button, .Radio Button, DatePicker, Range Picker, .Filter, Pagination, .Pagination Item, Tag, .Footer(Modal), Extra, .Actions, Empty Image, Form Item, Form Item Horizontal — 经 `InputNumber/handleBorderColor`(108) 波及 |
| `map/colorBorderSecondary` | `#F0EDE7` | 758 | **经 `Table/borderColor`(740) 与 `Table/headerSplitColor`(18) 覆盖整个 Table 家族** |
| `map/colorBorderDisabled` | `#E6E1D8` | 28 | Input, Password, Textarea, Input Number, .Selector, DatePicker, Range Picker, Pagination |
| `map/colorBgContainer` | `#FFFFFF` | **357** | Button 系, Search, Input Number, .Input Handle, Checkbox, Radio, DatePicker, Range Picker, .Filter, .Footer(Modal), Extra, .Actions, Layout Content, Layout Header, Embedded Spin, Form Item 系 — **另经 `Input/activeBg`(111)、`Input/hoverBg`(45)、`InputNumber/activeBg`(53)、`Select/selectorBg`(42)、`DatePicker/{active,hover}Bg`(36)、`Pagination/item{,Active}Bg`(58)、`Radio/button{,Checked}Bg`(56)、`Menu/itemBg`(6)、`Table/expandIconBg`(7)、`Layout/lightSiderBg`(2) 大面积波及** |
| `map/colorBgElevated` | `#FFFFFF` | 108 | .Dropdown(Select), .Dropdown Placement, DatePicker, Date Picker Panel, .Table Header Cell Content, .Filter, Drawer, Popover, .Arrow, Popconfirm, .Arrow Popconfirm, Dropdown Raw Menu, Dropdown Placement, Form Item 系, Message, Notification — 经 `Modal/contentBg`(17)、`Modal/headerBg`(2)、`Menu/popupBg`(7)、`Segmented/itemSelectedBg`(42) 波及 |
| **`map/colorBgMask`** | **`#262420@.45`** | **20** | **Modal, .Backdrop, Drawer Mask** |
| `map/colorBgSpotlight` | `#000000@.85` | 3 | Tooltip, .Tooltip Arrow ← **§4.5 未改项** |
| `map/colorBgLayout` | `#FAF8F5` | 8 | 经 `Layout/bodyBg`(6) 与 `Segmented/trackBg`(14) |
| `map/colorFill` | `#8A6F52@.274` | 38 | Default Button — 经 `alias/colorBgTextActive`(8)、`Segmented/itemActiveBg`(18)、`alias/colorFillContentHover` 波及 |
| `map/colorFillSecondary` | `#8A6F52@.108` | 47 | Default Button, Input 系, .Selector, .Tag Item, DatePicker, Range Picker, .Tag button — 经 `alias/colorBgTextHover`(11)、`alias/colorFillContent`(2)、`Segmented/itemHoverBg`(18)、`Menu/itemHoverBg`(12) 波及 |
| `map/colorFillTertiary` | `#8A6F52@.073` | 137 | Default Button, Input 系, Search, Addon 系, Input Number, .Selector, DatePicker, Range Picker, .Picker Cell, .Date Picker Preset Button, drawer-close — **经 `alias/colorBgContainerDisabled`(214) 波及全部禁用态**；经 `alias/controlItemBgHover`(3) 波及 Dropdown/Select 选项 hover |
| `map/colorFillQuaternary` | `#8A6F52@.038` | — | 经 `alias/colorFillAlter`(24) → `Input/addonBg`(42)、`Menu/subMenuItemBg`(3)、`Table/rowExpandedBg`；经 `alias/controlTmpOutline`(145) → Default Button 阴影 |
| `map/colorWhite` | `#FFFFFF` | 7 | Checkbox, .Picker Cell — 经 `alias/colorTextLightSolid`(13) 与 `Switch/handleBg`(40) 波及 |
| `map/colorBgSolid` → `seed/colorTextBase` | `#000000` | 32 | Default Button, Tag ← **§4.6 未改项** |
| `map/transparent` | `#FFFFFF@0` | 553 | Button 系, Search, .Select Footer, .Table Cell Content, .Filter, .Footer, drawer-close, .drawer footer, .Menu item - Dark, .Collapse button, .Alert Extra, .Actions — 经 `Modal/footerBg`、`Menu/horizontalItemSelectedBg` 波及 |

### 6.4 alias 层（§7.8 改动的 9 项 + 高影响面项）

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `alias/colorSplit` | `#E6E1D8` | **77** | Drawer, .drawer header, Menu - Light, Layout Sider, Layout Header, Divider, Divider with Content |
| `alias/colorLink` / `LinkHover` / `LinkActive` | `#74593F`（三态同值） | 34 | Button, Default Button, .Row Expand Button |
| `alias/controlOutline` | `#8A6F52@.18` | **174** | Button, Search, .Picker Footer Range, .Filter, .Footer(Modal), .drawer footer, Extra, .Actions, Empty, .Alert Extra — **经 effect style `focusPrimary` / `boxShadowButtonPrimary` / `controlOutlineActive`（后者经 `Select/activeOutlineColor`，54 处）波及全部 focus 光晕** |
| `alias/colorErrorOutline` | `#C24E3F@.18` | 159 | Danger Button, Input, Password, Textarea, Input Number, .Selector, DatePicker, Range Picker — 经 effect style `focusError` / `boxShadowButtonError` / `controlOutlineErrorActive` |
| **`alias/colorWarningOutline`** | **`#FAAD14@.10`** | 24 | Input, Password, Textarea, Input Number, .Selector, DatePicker, Range Picker ← **§7.8 已登记的未跟随项，本次确认** |
| `alias/controlOutlineWidth` | 2 | **556** | 全部有 focus 光晕的控件 |
| `alias/controlTmpOutline` | → `colorFillQuaternary` | 145 | Default Button, Search, .Filter, .Footer, Extra, .Actions |
| `alias/colorTextDisabled` | → `colorTextQuaternary` | **220** | Button 系, Input 系, .Select Item, .Dropdown Item, .Tag Item, .Segmented Item, Checkbox, Radio, .Radio Button, .DatePicker item, .Range Picker, Pagination 系, .Dropdown Option Node |
| `alias/colorBgContainerDisabled` | → `colorFillTertiary` | **214** | Button 系, Input 系, Input Number, .Selector, Checkbox, Radio, .Radio Button, DatePicker, Range Picker, Pagination |
| `alias/colorTextPlaceholder` | → `colorTextQuaternary` | 42 | .Input item, .Input Password item, .Input Textarea item, .Select Item, .DatePicker item, .Range Picker |
| `alias/colorTextHeading` | → `colorText` | 13 | .Dialog, .Title(Popover), .Divider content, .Alert Content, Notification — 经 `Form/labelColor`(3)、`Table/footerColor`(12) 波及 |
| `alias/paddingXS` / `paddingXXS` / `padding` / `paddingSM` / `paddingLG` / `paddingMD` | → `map/size*` | 1,663 | 几乎全部组件的内边距 |
| `alias/marginXS` | → `map/sizeXS` | **1,277** | 几乎全部组件的元素间距 |
| `alias/fontWeightNormal` | 400 | 1,042 | 全部文本节点（§5 按钮字重对齐 antd 的依据） |

### 6.5 components 层（本项目 §7.8 改动的 12 项）

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `components/Layout/siderBg` | `#26211B` | 2 | Layout Sider, Layout Content |
| `components/Layout/headerBg` | `#FFFFFF` | 7 | Layout, Layout Header |
| `components/Layout/headerHeight` | 64 | 9 | Layout, Layout Content, Layout Header |
| `components/Menu/darkItemBg` | `#26211B` | 6 | Menu - Dark, Layout Sider, Layout Header |
| `components/Menu/darkItemColor` | `#9B9184` | 6 | .Menu item - Dark, .Submenu arrow - Dark, .Horizonral Menu item - Dark |
| `components/Menu/darkGroupTitleColor` | `#9B9184` | 2 | .Menu extra - Dark, .Menu item group - Dark |
| `components/Menu/darkItemHoverColor` | `#EDE8DF` | 4 | .Menu item - Dark |
| `components/Menu/darkItemSelectedColor` | `#EDE8DF` | 8 | .Menu item - Dark, .Submenu arrow - Dark, .Horizonral Menu item - Dark |
| `components/Menu/darkItemSelectedBg` | → `seed/colorPrimary` | 3 | .Menu item - Dark, .Horizonral Menu item - Dark（**§7.8 记「未动」，实测已是主色别名，请复核**） |
| `components/Menu/darkSubMenuItemBg` | `#1C1711` | 3 | Menu - Dark, .Menu sub - Dark |
| `components/Menu/darkPopupBg` | `#26211B` | 7 | .Menu item inline - Dark, .Menu Popup - Dark, .Horizonral Menu item - Dark |
| `components/Menu/darkItemDisabledColor` | `#EDE8DF@.25` | 10 | .Menu item - Dark, .Submenu arrow - Dark, .Horizonral Menu item - Dark |
| **`components/Menu/darkItemHoverBg`** | — | **0** | **无节点引用 ← §4.2 的空置 token** |
| `components/Tag/defaultBg` | `#F0EDE7` | 2 | Tag |
| `components/Tag/defaultColor` | `#8F8A80` | 2 | Tag |
| `components/Tag/solidTextColor` | `#FFFFFF` | 13 | Tag |
| `components/Button/solidTextColor` | `#FFFFFF` | 18 | Default Button |

### 6.6 components 层（未改但影响面大 / 需注意的）

| 变量 | 当前 Light 值 | 绑定处数 | 受影响的组件集 |
|---|---|---|---|
| `components/Menu/itemBorderRadius` | → `map/borderRadiusLG` | **268** | .Menu item - Light/Dark, .Menu Popup - Light/Dark, .Horizonral Menu item - Light/Dark, .Menu item inline - Light/Dark |
| `components/Menu/itemHeight` | → `map/controlHeightLG` | 48 | .Menu item - Light, .Menu item - Dark |
| `components/Menu/itemMarginInline` | → `alias/marginXXS` | **336** | Menu 全族 |
| `components/Menu/itemPaddingInline` | → `alias/padding` | 92 | Menu 全族 |
| `components/Menu/itemHoverBg` | → `alias/colorBgTextHover` | 12 | **.Menu item - Light 与 .Menu item - Dark（后者是 §4.2 的接错）** |
| `components/Table/borderColor` | → `map/colorBorderSecondary` | **740** | Table 全族 |
| `components/Table/cellPadding{Block,Inline}{,MD,SM}` | → `alias/padding` 系 | **2,948** | Table 全族 |
| `components/Table/headerBorderRadius` | → `map/borderRadiusLG` | 72 | Table, .Title, .Footer |
| **`components/Table/{headerBg,footerBg,rowHoverBg,bodySortBg}`** | **`#FAFAFA`（扁平）** | 115 | **Table Column, Table, .Header Cell, .Footer, .Expanded, .Body Cell ← §4.4** |
| **`components/Table/{headerSortHoverBg,headerSortActiveBg,fixedHeaderSortActiveBg}`** | **`#F0F0F0`（扁平）** | 24 | **.Header Cell ← §4.4** |
| `components/Input/activeBg` / `hoverBg` | → `map/colorBgContainer` | 156 | Input, Password, Textarea, Input Addon, Search, .Select Footer, .Filter, Input Number, Pagination, Form Item 系 |
| `components/Input/{active,hover}BorderColor` | → `seed/colorPrimary` / `map/colorPrimaryHover` | 51 | Input, Password, Textarea |
| `components/Input/addonBg` | → `alias/colorFillAlter` | 42 | Input Addon, Addon Before, Addon After, Input Number Addon |
| `components/Select/optionHeight` | → `seed/controlHeight` | 50 | .Dropdown, .Dropdown Item |
| `components/Select/activeOutlineColor` | → `alias/controlOutline` | 54 | Input, Password, Textarea, Input Number, Select, .Selector, DatePicker, Range Picker（**跨组件复用，改它会一起变**） |
| `components/Pagination/itemSize` / `itemSizeSM` | → `seed/controlHeight` / `map/controlHeightSM` | 236 | Pagination, .Pagination Item |
| `components/Segmented/trackBg` | → `map/colorBgLayout` | 14 | Segmented, Form Item, Form Item Horizontal |
| `components/Segmented/itemHoverColor` | → `map/colorText` | 2 | **.Menu item - Light ← §4.3 的接错** |
| `components/Switch/*`（handleSize / trackHeight / trackPadding 等） | 扁平数值 | 264 | Switch, Switch Text & Icon, Form Item 系 |
| `components/Form/labelHeight` | → `seed/controlHeight` | 22 | Form Item Horizontal, Form Item Label |
| `components/Form/labelRequiredMarkColor` | → `seed/colorError` | 1 | .Required Mark |
| `components/Spin/dotSizeLG` | → `seed/controlHeight` | 8 | Spin ← §4.9 |
| `components/DatePicker/cellHeight` | → `map/controlHeightSM` | 16 | .Picker Cell |
| `components/Drawer/footerPadding{Block,Inline}` | → `alias/paddingXS` / `padding` | 64 | Drawer |
| `components/Radio/buttonPaddingInline` | 15（扁平） | 48 | .Radio Button |
| `components/InputNumber/paddingInline{,SM,LG}` | 11 / 7 / 11（扁平） | 216 | Input Number, .Number Action |

### 6.7 Effect style（**非变量，改主题时改不动**）

| Effect style | 内部是否绑变量 | 引用节点 | 受影响的组件集 |
|---|---|---|---|
| `boxShadow` | ❌ 无 | 19 | Modal, .Modal Base, .Dialog, Message, Notification |
| `boxShadowSecondary` | ❌ 无 | ~85 | .Dropdown(Select), Dropdown Raw Menu, Dropdown Placement, Tooltip, Popover, Popconfirm, Date Picker Panel, .Menu Popup - Light/Dark, .Horizonral Menu item 系, .Menu item inline 系, .Header Cell(Tooltip), .Filter, .drawer footer, Form Item Label |
| `boxShadowTertiary` | ❌ 无 | 42 | Segmented, .Segmented Item |
| `boxShadowCard` | ❌ 无 | — | Card（本次未扫） |
| `boxShadowPopoverArrow` | ❌ 无 | 3 | .Tooltip Arrow, .Arrow, .Arrow Popconfirm |
| `boxShadowDrawerRight` / `_boxShadowDrawer{Right,Left,Up,Down}` | ❌ 无 | 16 | Drawer |
| `_switchHandleShadow`（**重名 ×2**） | ❌ 无 | 40 | Switch, Switch Text & Icon |
| `boxShadowButton` | ❌ 无 | — | — |
| `boxShadowButtonCheckin` / `Checkout` | 部分（仅 offsetY） | — | kit 上游自定义，本项目未用 |
| `focusPrimary` | ✅ `a/controlOutline` + `a/controlOutlineWidth` | — | — |
| `focusError` | ✅ `a/colorErrorOutline` + `a/controlOutlineWidth` | — | — |
| `focusWarning` | ✅ `a/colorWarningOutline`（**值仍琥珀**） | — | — |
| `boxShadowButtonPrimary` | ✅ `a/controlOutline` | 135+ | Button, Search, .Footer, Extra, .Actions, Empty, .Alert Extra, .Filter, .Picker Footer Range, .drawer footer |
| `boxShadowButtonError` | ✅ `a/colorErrorOutline` | 135 | Danger Button |
| `boxShadowButtonDefault` | ✅ `a/controlTmpOutline` | 135+ | Default Button, Search, .Footer, Extra, .Filter |
| `controlOutlineActive` | ✅ `c/Select/activeOutlineColor` | 42 | Input, Password, Textarea, Input Number, Select, .Selector, DatePicker, Range Picker |
| `controlOutlineErrorActive` | ✅ `a/colorErrorOutline` | 21 | 同上 |
| `controlOutlineWarningActive` | ✅ `a/colorWarningOutline`（**值仍琥珀**） | 21 | 同上 |
| `_badgeShadow` | ✅ `st/badgeShadowColor` | — | Badge（本次未扫） |
| `_colorPickerBlockShadow` / `colorPickerHandlerShadow` / `colorPickerInsetShadow` | ✅ `m/colorTextQuaternary` / `m/colorFillSecondary` | — | ColorPicker（本次未扫） |

> **一句话**：focus 光晕类阴影**已接线**（改 `controlOutline` 生效）；**浮层与卡片投影类全部未接线**（改任何变量都不生效）。

---

## 7. antd 查证：能否逐组件覆盖 `borderRadiusLG`

### 7.1 结论：**能。合法、生效、TS 不报错、无需 `as any`。**

### 7.2 依据

**① 官方文档 API 表**【我直接查证，WebFetch `https://ant.design/docs/react/customize-theme`】——`ComponentsConfig` 的类型为：

```
ComponentToken & AliasToken & { algorithm: boolean | (token: SeedToken) => MapToken | ((token: SeedToken) => MapToken)[] }
```

`AliasToken` 包含 `borderRadiusLG` / `controlHeight` 等全局别名 token，故 `theme.components.Modal.borderRadiusLG` **在类型层面就是合法的**。

**② 官方文档正文**【我直接查证，同一 URL】：

> "each component will also have its own Component Token to achieve style customization capabilities for components, and different components will not affect each other. **Similarly, other Design Token of components can also be overridden in this way.**"

> "**By default, all component tokens can only override global token and will not be derived based on Seed Token.** In version `>= 5.8.0`, component tokens support the `algorithm` property..."

> "`algorithm` of component is `false` by default, which means tokens of component will only override global token."

**③ 运行时机制**【源码包查证，`@ant-design/cssinjs-utils@2.1.2` `es/util/genStyleUtils.js`】：`genCSSVarRegister` 里只有**组件自己声明过的** token（`prepareComponentToken` 的返回键）会被改名成 `--ant-<comp>-*` 前缀；`borderRadiusLG` 这类**未声明的别名 token 名保持原样**，于是在组件根类作用域下重新定义 `--ant-border-radius-lg`。而 styleFn 里的 `token.borderRadiusLG` 在 v6 的 CSS 变量模式下本就是 `var(--ant-border-radius-lg)` —— 因此作用域内覆盖生效。

**④ 类型定义**【源码包查证，`@ant-design/cssinjs-utils` `es/interface/components.d.ts`】：

```ts
export type OverrideTokenMap<CompTokenMap, AliasToken> = {
  [key in keyof CompTokenMap]: Partial<CompTokenMap[key]> & Partial<AliasToken>;
};
```

### 7.3 三个 caveat（会影响「浮层 8」的实际落地）

1. **作用域是 CSS 变量作用域，不是组件私有作用域。** 变量挂在该组件根类上，按 CSS 级联规则**嵌套在它内部的其他组件也会继承** —— 例如 `Modal` 内放一张 `Card`，那张 Card 也会拿到被改成 8 的 `--ant-border-radius-lg`，而不是面板档 14。**这与 07 §3.2「面板与对象卡 14」在「模态内放对象卡」的场景直接冲突。**
   *（此条为从 `scope: rootCls` + CSS 级联语义推出的机制性推论，子 agent 未做运行时实测，标记为**待实证**。）*
2. **同值会被裁剪**：`getComponentToken` 里 `if (mergedToken[key] === token[key]) delete` —— 设成与全局相同的值等于没写。
3. **不触发派生**：覆盖 `components.X.colorPrimary` 不会带出 `colorPrimaryHover` 等衍生态，除非显式传 `algorithm`。反向的正效果是：覆盖别名 token **会改变由它派生的组件 token**（改 Modal 的 `borderRadiusLG` 会连带改 `Modal.footerBorderRadius`）。

### 7.4 对 07 §3.2 的修订建议

「悬浮浮层 8 = 逐组件覆盖 `borderRadiusLG`」需要补三条：

- **Tooltip 例外** —— 读 `borderRadius`，须写 `components.Tooltip.borderRadius = 8`（§4.1）。
- **Drawer 例外** —— antd 不设圆角，只能自定义 CSS（§6 偏离项 2 已登记）。
- **嵌套注意** —— 覆盖是 CSS 变量作用域覆盖，模态/抽屉内部的 Card 会继承到 8；若要保住面板档 14，需在内层组件上再覆盖回去。**此条待实证。**

---

## 8. 盲区与限制

| # | 盲区 | 原因 |
|---|---|---|
| 1 | **未扫的组件**：Card, Badge, Avatar, Steps, Tabs, Collapse, Descriptions, Progress, Result, Skeleton, Tree, TreeSelect, Cascader, Transfer, Upload, Slider, Rate, TimePicker, ColorPicker, AutoComplete, Mentions, Anchor, Affix, Carousel, Statistic, Timeline, Tour, QRCode, Watermark, Float Button, Grid, Space, Splitter, Masonry, Typography, Icon, Image, Calendar, List(废弃) | 任务要求「优先覆盖 FlowCanvas 实际会用到的组件」，89 页中扫了 28 页。**`boxShadowCard` 的引用面因此不完整** |
| 2 | **不下钻 INSTANCE 子树** | 避免把主组件的绑定重复计入引用它的组件。代价：**若某处绑定是在实例上做的覆盖，本次会漏**（只记录实例节点自身的属性，不记录其内部覆盖） |
| 3 | **Dark mode 完全未审计** | 只读了每个集合的 Light mode。§7.8 记「Dark 全程未动」，本次未验证 |
| 4 | **文字样式（Text Style）未审计** | 只查了 effect style 与 paint 绑定；17 个文字样式的内部绑定未展开 |
| 5 | **`colors` / `static` / `responsive` 三个集合未进反向索引** | 表 B 按任务要求限定在「本项目动过或可能动的变量」= `seed`/`map`/`alias`/`components`。`static` 里其实藏着影响面不小的量（`radioButtonHeight`、`inputPadding*`、`buttonPaddingHorizontal`、`segmented*`、`emptyImageColor*`），本报告在 §2/§3 中逐条点名，但未做完整反向索引 |
| 6 | **`getLocalVariablesAsync()` 的枚举不完全** | §4.7 的 3 个变量能按 id 取到却不在返回列表里。这意味着**可能还有别的变量同样缺失**，表 B 的变量总数（197）可能偏低 |
| 7 | **几何值处于变动中** | §0 —— 值列不可作为真相源 |
| 8 | **antd 源码依据来自 npm 发布包，非 GitHub master** | 子 agent 读的是 `antd@6.6.0` 的 `es/**/style/*.js`（由 `.ts` 编译，token 名逐字保留）。**行号对应发布包，GitHub master 可能已漂移。** 我直接用 WebFetch 核实的只有 customize-theme 官方文档 |
| 9 | **antd 侧四项未确认**（子 agent 明示）：① `theme.components.X` 覆盖别名 token 后向子组件级联的行为**未做运行时实测**；② Pagination `-item`（页码格本身）的圆角规则未直接读到；③ Textarea 未打开专属样式文件；④ `dropShadowPopover` / `colorBorderDisabled` 在 `AliasToken` 接口中的正式声明未逐条核对 | 见各条标注 |
| 10 | **`Menu/darkItemHoverBg` 是否为 antd 官方 token 未逐字核实** | 我确认了**kit 里存在这个变量**（枚举 `Menu/dark*` 15 个），但未从 antd 源码逐字确认它是官方 Menu ComponentToken。§4.2 的接错判定基于「kit 内部自相矛盾」（深色变体绑浅色档 token、同名深色 token 空置），该判定独立成立 |
| 11 | **`.Segmented Item` 的 `Adjuster` 节点作用未判定** | 已确认 96 个节点 `visible=true` 且填充为硬编码白，但未判断它在视觉上是否被上层遮挡。**建议人工在画布上确认后再决定是否补绑** |
| 12 | **裸值总数 ≈1,260 为聚合估算** | 按「属性 × 签名」的 `n` 值求和。同一节点若在多个属性上裸值会被计多次；§3.1–§3.3 中的**分项数字是精确的** |

---

## 9. 建议的处理优先级

| 优先级 | 事项 | 位置 | 工作量 |
|---|---|---|---|
| **P0** | 修 Tooltip 圆角的代码侧落地方式（改 07 §3.2 的规则表述） | §4.1 / §7.4 | 改文档，零 Figma 改动 |
| **P0** | Table 7 个冷灰变量改值 | §4.4 | **改 7 个变量值，零节点改动** |
| **P0** | `map/colorBgSpotlight` 改暖墨 | §4.5 | 改 1 个变量值 |
| **P0** | 深色菜单 hover 底改绑 `Menu/darkItemHoverBg` | §4.2 | 6 个节点改绑 |
| **P1** | 浮层阴影：把 12 个 effect style 改成 §4 的暖墨三级，或给它们绑变量 | §3.1-1 / §6.7 | 12 个 style |
| **P1** | `.Segmented Item` 的 96 处硬编码白 | §3.1-3 | 先人工确认作用 |
| **P1** | `Input` 默认变体从 FIXED 36 改回 HUG | §3.2-1 | 1 个节点 |
| **P1** | Layout 左右 padding 24 处 | §3.1-5 | 24 个节点 + 代码侧覆盖 `Layout.headerPadding` |
| **P2** | DatePicker 面板裸值边框 11 处 + 单元格高 155 处 | §3.1-4/6 | 较大 |
| **P2** | `.Select Item` / `.Radio Button` / `.Number Action` 高度补绑 | §3.2 | 中等 |
| **P2** | 浮层档遗漏 3 项（`.Filter`、`.Menu Popup`、`Table/filterDropdownBg`） | §5.3 | 小 |
| **P2** | 核实 §4.7 的 3 个变量是否已删除 | §4.7 | 人工，Figma UI |
| **P3** | `gap!10` 约 200 处清理 | §3.3 | 大，收益低 |
| **P3** | `seed/colorTextBase` 改暖墨（FlowCanvas 暂不用 solid 型） | §4.6 | 1 个变量 |
| **—** | 更新 07 §7.8：XL 改绑总数 65 → **66** | §5.1 | 改文档 |
| **—** | 复核 07 §6 偏离项 1 / §7.8 关于 `Menu/darkItemSelectedBg`「未动」的表述 | §6.5 | 改文档 |
