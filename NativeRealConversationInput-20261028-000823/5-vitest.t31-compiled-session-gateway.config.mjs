// Reuse the proven native jsdom project, React/source aliases, fs.strict
// policy, and owning-package zod binding. Only the finite T31 include changes.
import { fileURLToPath } from 'node:url'
import base from './vitest.t31-control-echo-native.config.mjs'

const compiledSessionGatewayTest =
  'packages/api/session-controller/tests/t31-compiled-session-gateway.finite.ts'
const threadSafe = base.test.projects?.find(
  project => project.test?.name === 'thread-safe',
)

if (threadSafe === undefined) {
  throw new Error('native thread-safe Vitest project is unavailable')
}

const peerBindings = new Map([
  [/^@deepseek-ai\/schemastery$/, new URL('../dsh/vendor/schemastery/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-llm$/, new URL('../dsh/packages/llm/llm/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-native-command$/, new URL('../dsh/packages/util/native-command/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-session-query$/, new URL('../dsh/packages/session-query/session-query/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-typert-protocol$/, new URL('../dsh/packages/typert/protocol/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-agent$/, new URL('../dsh/packages/core/agent/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-credentials$/, new URL('../dsh/packages/credentials/credentials/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-brand$/, new URL('../dsh/packages/util/brand/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-attachment$/, new URL('../dsh/packages/attachment/attachment/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-session\/fork$/, new URL('../dsh/packages/core/session/src/fork.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-session$/, new URL('../dsh/packages/core/session/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-session-title$/, new URL('../dsh/packages/session/session-title/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-util-time$/, new URL('../dsh/packages/util/time/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-util-values$/, new URL('../dsh/packages/util/values/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-deque$/, new URL('../dsh/packages/util/deque/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-skill$/, new URL('../dsh/packages/skill/skill/src/index.ts', import.meta.url)],
  [/^@deepseek-ai\/dsh-fs$/, new URL('../dsh/packages/fs/fs/src/index.ts', import.meta.url)],
  [
    /^mime-types$/,
    new URL(
      '../dsh/node_modules/.pnpm/mime-types@3.0.2/node_modules/mime-types/index.js',
      import.meta.url,
    ),
  ],
])

const withPeerBindings = aliases => [
  ...(Array.isArray(aliases)
    ? aliases
    : Object.entries(aliases ?? {}).map(([find, replacement]) => ({
        find,
        replacement,
      }))),
  ...[...peerBindings].map(([find, replacement]) => ({
    find,
    replacement: fileURLToPath(replacement),
  })),
]

export default {
  ...base,
  resolve: {
    ...(base.resolve ?? {}),
    alias: withPeerBindings(base.resolve?.alias),
  },
  test: {
    ...base.test,
    include: [compiledSessionGatewayTest],
    projects: [
      {
        ...threadSafe,
        resolve: {
          ...(threadSafe.resolve ?? {}),
          alias: withPeerBindings(threadSafe.resolve?.alias),
        },
        test: {
          ...threadSafe.test,
          include: [compiledSessionGatewayTest],
        },
      },
    ],
  },
}
