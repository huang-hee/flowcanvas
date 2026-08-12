import { defineConfig } from 'vitest/config'

// 两个 project 的环境不同：core 是零浏览器依赖的纯逻辑（node），web 需要 DOM（jsdom）。
// 各 project 的细节写在自己的 vite/vitest 配置里，此处只做汇总。
export default defineConfig({
  test: {
    projects: ['packages/core', 'apps/web'],
  },
})
