// Dedicated T31 source-mode configuration. Keep the extension's existing
// contracts plugin and aliases authoritative, while resolving native DSH
// imports through the same TypeScript source graph used by its own tests.
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import baseConfig from './vitest.config.mjs'
import { standardDecoratorPlugin } from '../dsh/vitest.shared.ts'

const dshRequire = createRequire(new URL('../dsh/package.json', import.meta.url))
const tsconfigPaths = (await import(
  pathToFileURL(dshRequire.resolve('vite-tsconfig-paths')).href
)).default

const nativeTsconfig = fileURLToPath(
  new URL('../dsh/tsconfig.base.json', import.meta.url),
)

// Vite string aliases also match subpaths. Keep the inherited root replacement
// while leaving native package subpaths to the tsconfig path map below.
const inheritedAliases = Object.entries(baseConfig.resolve.alias).map(
  ([find, replacement]) => ({
    find: find === '@deepseek-ai/dsh-llm'
      ? /^@deepseek-ai\/dsh-llm$/
      : find,
    replacement,
  }),
)

export default {
  ...baseConfig,
  plugins: [
    ...(baseConfig.plugins ?? []),
    standardDecoratorPlugin(),
    tsconfigPaths({ projects: [nativeTsconfig] }),
  ],
  resolve: {
    ...baseConfig.resolve,
    alias: inheritedAliases,
  },
  test: {
    ...baseConfig.test,
    include: ['tests/t31-native-scope-http.spec.ts'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    environment: 'node',
    globals: true,
  },
}
