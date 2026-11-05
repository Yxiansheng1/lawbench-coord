// Native T31 selector: retain the proven material-admission project and add
// only the existing contracts plugin required by the extension-side sources.
import baseConfig from './vitest.config.mjs'
import materialAdmissionConfig from './vitest.t31-material-admission.config.mjs'

const nativeFixture =
  'packages/api/session-controller/tests/fixtures/t31-claimed-native-context.finite.ts'
const threadSafe = materialAdmissionConfig.test.projects?.find(
  project => project.test?.name === 'thread-safe',
)
const contractsPlugin = baseConfig.plugins?.find(
  plugin => plugin?.name === 'lawbench-contracts',
)

if (threadSafe === undefined) {
  throw new Error('native thread-safe Vitest project is unavailable')
}
if (contractsPlugin === undefined) {
  throw new Error('existing lawbench contracts plugin is unavailable')
}

const withContractsPlugin = plugins => [...(plugins ?? []), contractsPlugin]

export default {
  ...materialAdmissionConfig,
  plugins: withContractsPlugin(materialAdmissionConfig.plugins),
  test: {
    ...materialAdmissionConfig.test,
    include: [nativeFixture],
    projects: [
      {
        ...threadSafe,
        plugins: withContractsPlugin(threadSafe.plugins),
        test: {
          ...threadSafe.test,
          include: [nativeFixture],
        },
      },
    ],
  },
}
