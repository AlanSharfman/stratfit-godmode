import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

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
    rules: {
      // Enforce selector usage with Zustand stores
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="useScenarioStore"][arguments.length=0]',
          message: 'useScenarioStore() must be called with a selector function. Use: useScenarioStore((s) => s.field) or useScenarioStore.getState() for imperative access.',
        },
      ],
    },
  },
])
