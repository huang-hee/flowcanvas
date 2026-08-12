import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router'

import { useAppSettings } from '../stores/app-settings'
import { antdTheme } from '../theme/antd-theme'
import { router } from './router'

export function App() {
  const hydrate = useAppSettings((state) => state.hydrate)

  // 侧栏收起态跨会话记忆（08 §2.3），从 IndexedDB 读回。
  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}
