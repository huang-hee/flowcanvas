import emptyStateImage from '../assets/empty-state.svg'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  /** 单行文案的前半段，如「暂无元字段数据，」 */
  text: string
  /** 文案内的**内联链接**（08 §5.4：动作是文案里的内联链接，不做独立按钮） */
  actionText?: string
  onAction?: () => void
}

/**
 * 空态 / 错误态的统一呈现（08 §5.4）。
 *
 * - 插画高 160，与文案间距 space/inner
 * - 文案**一律单行不换行**
 * - 「筛选后无结果」不单独区分，与空数据同一呈现与文案
 */
export function EmptyState({ text, actionText, onAction }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <img src={emptyStateImage} alt="" className={styles.image} />
      <p className={styles.text}>
        {text}
        {actionText && (
          <a
            className={styles.action}
            onClick={(event) => {
              event.preventDefault()
              onAction?.()
            }}
            href="#"
          >
            {actionText}
          </a>
        )}
      </p>
    </div>
  )
}
