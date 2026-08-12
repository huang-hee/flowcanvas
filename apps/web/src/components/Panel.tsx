import type { ReactNode, Ref } from 'react'

import styles from './Panel.module.css'

interface PanelProps {
  children: ReactNode
  /** 固定不滚，可省略 */
  header?: ReactNode
  /** 固定不滚，可省略 */
  footer?: ReactNode
  /** 皮肤两档（08 §3.2） */
  skin?: 'card' | 'plain'
  /** 高度：撑满父容器（默认）或按内容 hug */
  height?: 'fill' | 'hug'
  /**
   * 主体元素的 ref。表头 sticky 要用它作 `sticky.getContainer`——
   * 滚动发生在面板主体内，不是视口（08 §5.3）。
   */
  bodyRef?: Ref<HTMLDivElement>
  /** 主体是否自带 padding。表格面板的 body 由内部自行控制内距，故可关掉。 */
  bodyPadding?: boolean
  className?: string
}

/**
 * 面板原语（08 §3.1）。
 *
 * 全站一切容器——侧边栏、主区、列表面板、编辑面板、抽屉、模态——
 * 都是**同一原语的配置差异**，不存在「页面类型学」。
 *
 * padding **逐段给**（头 / 主体 / 底各自持有），不给面板容器，
 * 否则头 / 底与主体之间的分隔线横贯不满全宽。
 */
export function Panel({
  children,
  header,
  footer,
  skin = 'card',
  height = 'fill',
  bodyRef,
  bodyPadding = true,
  className,
}: PanelProps) {
  const classes = [
    styles.panel,
    skin === 'card' ? styles.card : styles.plain,
    height === 'fill' ? styles.fill : styles.hug,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      {header !== undefined && <div className={styles.header}>{header}</div>}
      <div
        ref={bodyRef}
        className={`${styles.body} ${bodyPadding ? styles.bodyPadded : ''}`}
      >
        {children}
      </div>
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </section>
  )
}
