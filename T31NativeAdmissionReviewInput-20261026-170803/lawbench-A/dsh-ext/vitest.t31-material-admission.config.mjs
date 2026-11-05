// Keep the native monorepo project's setup and path graph authoritative. The
// only extension-side changes are the exact React aliases already pinned by
// the UI test config and a one-file native admission selector.
import { fileURLToPath } from 'node:url'
import uiConfig from './vitest.config.mjs'
import nativeConfig from '../dsh/vitest.config.ts'

const nativeRoot = fileURLToPath(new URL('../dsh', import.meta.url))
const admissionTest = 'packages/api/session-controller/tests/t31-material-admission.client.spec.ts'
const threadSafe = nativeConfig.test.projects?.find(project => project.test?.name === 'thread-safe')
const uiAliases = uiConfig.resolve?.alias

if (threadSafe === undefined) {
  throw new Error('native thread-safe Vitest project is unavailable')
}
if (typeof uiAliases?.react !== 'string' || typeof uiAliases['react-dom'] !== 'string') {
  throw new Error('pinned UI React aliases are unavailable')
}

const reactAliases = {
  react: uiAliases.react,
  'react-dom': uiAliases['react-dom'],
}

export default {
  ...nativeConfig,
  root: nativeRoot,
  resolve: {
    ...(nativeConfig.resolve ?? {}),
    alias: reactAliases,
  },
  test: {
    ...nativeConfig.test,
    include: [admissionTest],
    projects: [
      {
        ...threadSafe,
        root: nativeRoot,
        resolve: {
          ...(threadSafe.resolve ?? {}),
          alias: reactAliases,
        },
        test: {
          ...threadSafe.test,
          include: [admissionTest],
        },
      },
    ],
  },
}
