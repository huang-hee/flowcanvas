import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'docs/**', 'ai-workflow/**'],
  },

  js.configs.recommended,

  // 类型感知规则只挂在 TS 文件上——.js 配置文件不进 projectService，避免 parser 报错。
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },

  // core 必须零浏览器依赖（06 §1）。tsconfig 已去掉 DOM lib 作第一道闸，
  // 这里再挡一次显式的全局访问，报错信息比类型错误更直白。
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'core 必须零浏览器依赖（06 §1）——浏览器 API 走 ports/ 适配器接口' },
        { name: 'document', message: 'core 必须零浏览器依赖（06 §1）' },
        { name: 'indexedDB', message: 'core 必须零浏览器依赖（06 §1）——存储走 StorageAdapter' },
        { name: 'localStorage', message: 'core 必须零浏览器依赖（06 §1）' },
      ],
    },
  },

  prettier,
)
