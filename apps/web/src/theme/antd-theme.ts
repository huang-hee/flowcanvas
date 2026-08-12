import type { ThemeConfig } from 'antd'

const FONT_FAMILY = "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif"
const FONT_FAMILY_CODE = "'IBM Plex Mono', monospace"

/**
 * antd 主题（07 §1.2 映射表）。
 *
 * 三条纪律：
 * 1. **凡 antd 已有的量一律走 token，不写自定义样式**（07 §1.1）。
 * 2. **07 §1.3 的 4 个 map token 必须显式覆盖**——antd 的色板算法在两处不命中本规范：
 *    hover 方向相反（antd 悬停变浅 +8.5pp，本规范变深 −8.0pp）；低饱和种子的浅阶会被
 *    算法去饱和成中性灰（#8A6F52 饱和度仅 25.5%，第 1 阶会落到近中性灰）。
 * 3. 色阶其余各阶按 07 §2.4 显式给全——10 个 map token 实际只落在 7 个色值上
 *    （antd 的 generateColorPalettes 把 key 8/9/10 回折复用 idx 4/5/6）。
 */
export const antdTheme: ThemeConfig = {
  token: {
    // —— seed ——
    colorPrimary: '#8A6F52',
    colorError: '#C24E3F',
    borderRadius: 6,
    controlHeight: 32,
    fontFamily: FONT_FAMILY,
    fontFamilyCode: FONT_FAMILY_CODE,
    fontSize: 14,

    // —— 主色色阶（07 §2.4）。⚓ 为规范锚定值 ——
    colorPrimaryBg: '#F1EAE0', // ⚓ 必须显式覆盖（算法输出 #C9C6BD，ΔE 8.69）
    colorPrimaryBgHover: '#D5C6B2',
    colorPrimaryBorder: '#BCA58A',
    colorPrimaryBorderHover: '#A28869',
    colorPrimaryHover: '#74593F', // ⚓ 必须显式覆盖（算法输出 #968671，ΔE 17.62）
    colorPrimaryActive: '#5B412A',

    // —— 错误色阶（07 §2.4）——
    colorErrorBg: '#FAE9E6', // ⚓ 必须显式覆盖（算法输出 #FFF4F0，ΔE 3.33）
    colorErrorBgHover: '#F0C5BD',
    colorErrorBorder: '#E29C90',
    colorErrorBorderHover: '#D27465',
    colorErrorHover: '#A5392C',
    colorErrorActive: '#82241A',

    // —— 中性 ——
    colorBgLayout: '#FAF8F5',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#E6E1D8',
    colorBorderSecondary: '#E6E1D8',
    colorBgMask: 'rgba(38,36,32,.45)',
    colorText: '#262420',
    colorTextSecondary: '#6F6A61',
    colorTextTertiary: '#9C968B',
    colorTextQuaternary: '#9C968B',
    colorTextPlaceholder: '#B6B0A4',

    /**
     * 无障碍（07 §2.4）：colorPrimary 对应用底 #FAF8F5 只有 4.43:1，未达 AA 正文。
     * **链接色不用基色，用 --primary-hover #74593F**（6.11:1）。
     */
    colorLink: '#74593F',
    colorLinkHover: '#74593F',
    colorLinkActive: '#5B412A',
    /** 08 §5.2 可点链接态：hover 出下划线。alias 层默认三者皆无下划线。 */
    linkHoverDecoration: 'underline',

    // —— 阴影（07 §4）——
    boxShadow: '0 2px 8px rgba(38,36,32,0.13)',
    boxShadowSecondary: '0 8px 24px rgba(38,36,32,0.16)',

    // —— focus 光晕（07 §4）——
    controlOutline: 'rgba(138,111,82,0.18)',
    controlOutlineWidth: 2,
  },

  components: {
    /**
     * chrome 配色全部由 antd token 承载（07 §1.4），本地不持有 --sidebar-* 一族。
     * ⚠️ 必须 <Layout.Sider theme="light"> 才读得到 lightSiderBg（08 §2.1）。
     */
    Layout: {
      lightSiderBg: '#F0EDE7',
      headerBg: '#FFFFFF',
      bodyBg: '#FAF8F5',
      lightTriggerBg: '#F0EDE7',
      lightTriggerColor: '#6F6A61',
    },

    /** 菜单四态（08 §2.2）。选中态靠「变亮」浮起（白底药丸），不靠变深。 */
    Menu: {
      itemColor: '#262420',
      itemHoverBg: 'rgba(255,255,255,.6)',
      itemSelectedBg: '#FFFFFF',
      itemSelectedColor: '#74593F',
      itemHoverColor: '#262420',
    },

    /**
     * 表单两处间距全部由组件 token 承载，不要自己加 gap（07 §4）——
     * 每个 Form.Item 自带 margin-bottom，再给容器加 gap 会叠加。
     */
    Form: {
      itemMarginBottom: 16,
    },

    /**
     * 头部竖分隔线（08 §2.4）：antd 默认两侧各 8，与容器 gap 叠加会变成两侧各 20。
     * 间距单一来源，一律由容器 gap 承担。
     */
    Divider: {
      verticalMarginInline: 0,
    },

    /** 类型徽章走纯 token（08 §5.2 / 07 §6 偏离项 10），零自定义 CSS。 */
    Tag: {
      fontFamily: FONT_FAMILY_CODE,
      fontSizeSM: 11,
      borderRadiusSM: 4,
    },

    /**
     * 浮层圆角 8——antd 的圆角只有 borderRadius(seed) 与 map 层 XS/SM/LG/Outer，
     * **没有 XL 档**（07 §3.2），只能逐组件覆盖 borderRadiusLG。
     */
    Modal: { borderRadiusLG: 8 },
    Drawer: { borderRadiusLG: 8 },
    Dropdown: { borderRadiusLG: 8 },
    Popover: { borderRadiusLG: 8 },
    Select: { borderRadiusLG: 8 },
    Tooltip: { borderRadius: 8 },

    Table: {
      headerBg: '#F5F1EA',
      rowHoverBg: '#FAF8F5',
      borderColor: '#F0EDE7',
    },

    Segmented: {
      trackBg: '#FAF8F5',
      itemSelectedBg: '#FFFFFF',
      itemColor: '#6F6A61',
      itemSelectedColor: '#262420',
    },
  },
}
