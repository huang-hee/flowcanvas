/**
 * 时间渲染格式 `YYYY-MM-DD HH:mm`（08 §5.2 / 09 §2.2）。
 *
 * 01 §2.4：datetime 一律 **UTC ISO 8601 存储、本地时区渲染**——
 * 故这里按本地时区取分量，不做时区转换。
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
