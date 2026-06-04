import js from '@eslint/js'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    plugins: {
      'check-file': checkFile,
    },
  },
  {
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*/.yaml', '*/.webp'],
    processor: checkFile.processors['eslint-processor-check-file'],
  },
  {
    files: ['src/**/*.*'],
    processor: checkFile.processors['eslint-processor-check-file'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/**': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**': 'NEXT_JS_APP_ROUTER_CASE',
        },
      ],
    },
  },
])
