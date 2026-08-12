import { EmptyState } from '../components/EmptyState'
import { Panel } from '../components/Panel'

/**
 * 其余五页的统一占位（spec-ui.md §2.2，停顿 2 拍板）。
 *
 * 它存在的目的不是给用户看，而是让验收 E2「标题由 menus 按 path 匹配得出」
 * 在**多页切换**下真正可验——只有一页时那条断言形同虚设。
 */
export function PlaceholderPage() {
  return (
    <Panel>
      <EmptyState text="该页面尚未开发" />
    </Panel>
  )
}
