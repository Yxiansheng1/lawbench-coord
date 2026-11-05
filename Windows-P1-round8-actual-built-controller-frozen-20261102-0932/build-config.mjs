import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), 'builder.config.json')
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))

export const BUILDER_CONFIG = config
export const EVIDENCE_ROOT = config.roots.evidenceRoot
export const RUNS_ROOT = config.roots.runsRoot
export const REPO_ROOT = config.roots.aRoot
export const B_ROOT = config.roots.bRoot
export const COORD_ROOT = config.roots.coordRoot
export const DSH_ROOT = join(REPO_ROOT, 'dsh')
export const LAW_BENCH_ROOT = join(REPO_ROOT, 'dsh-ext')
export const UI_CONVERSATION_ROOT = join(DSH_ROOT, 'packages', 'client', 'ui-conversation')
export const SESSION_CONTROLLER_ROOT = join(DSH_ROOT, 'packages', 'api', 'session-controller')
export const TYPERT_GENERATOR_ROOT = join(DSH_ROOT, 'packages', 'typert', 'generator')
export const TSDOWN_ROOT = join(DSH_ROOT, 'node_modules', '.pnpm', 'tsdown@0.22.2_oxc-resolver@_f113eb69000457c8d5954142d0822f52', 'node_modules', 'tsdown')
export const TSX_LOADER = join(DSH_ROOT, 'node_modules', '.pnpm', 'tsx@4.22.4', 'node_modules', 'tsx', 'dist', 'loader.mjs')
export const ESBUILD_ROOT = join(DSH_ROOT, 'node_modules', '.pnpm', 'esbuild@0.28.1', 'node_modules', 'esbuild')
export const CONTRACTS_SOURCE_DIR = join(B_ROOT, 'contracts')
export const CONTRACTS_VERSION = config.literalPins.contractsVersion

export const CLOSURE_STATE_PATH = config.closureState.path
export const CLOSURE_STATE_SHA256 = config.closureState.sha256
export const EXPECTED_A_HEAD = config.closureState.baseCommit
export const CLOSURE_PINS = config.closureState.pins

export const OUTPUT_NAME_PATTERN = /^private-output-[0-9]{8}-[0-9]{6}$/u
export const OUTPUT_PREFIX = 'private-output-'

const configuredNode = config.literalPins.nodeExecutable
export const NODE_PIN = Object.freeze({
  executable: configuredNode.executable,
  version: configuredNode.version,
  bytes: configuredNode.bytes,
  sha256: configuredNode.sha256,
})

export const LAW_BENCH_PACKAGE_ID = 'lawbench-dsh'
export const UI_CONVERSATION_PACKAGE_ID = '@deepseek-ai/dsh-client-ui-conversation'
export const SESSION_CONTROLLER_PACKAGE_ID = '@deepseek-ai/dsh-api-session-controller'

export const LAW_BENCH_NODE_ENTRIES = Object.freeze({
  agent: 'agent/index.ts',
  host: 'host/index.ts',
  credentials: 'credentials/index.ts',
  'session-store': 'session-store/index.ts',
  index: 'ui/host.ts',
})

export const LAW_BENCH_BUILD_FILES = Object.freeze([
  'agent.js',
  'client.js',
  'credentials.js',
  'host.js',
  'index.js',
  'session-store.js',
])

export const TREE_DIGEST_ALGORITHM = config.algorithm
export const TREE_PINS = Object.freeze(config.privateBuildTrees)
export const PAYLOAD_PINS = Object.freeze(config.payloadTrees)
export const FILE_PINS = Object.freeze(config.files)
export const BASELINE_FILE_PINS = Object.freeze(config.baselineFiles)
export const ASSET_PINS = Object.freeze(config.assets)
export const REFERENCE_PINS = Object.freeze([])

export const OUTPUT_ROOT = 'profile-node_modules'

export const OUTPUT_PACKAGES = Object.freeze([
  Object.freeze({
    id: LAW_BENCH_PACKAGE_ID,
    root: `${OUTPUT_ROOT}/lawbench-dsh`,
    manifestSource: join(LAW_BENCH_ROOT, 'package.json'),
  }),
  Object.freeze({
    id: UI_CONVERSATION_PACKAGE_ID,
    root: `${OUTPUT_ROOT}/@deepseek-ai/dsh-client-ui-conversation`,
    manifestSource: join(UI_CONVERSATION_ROOT, 'package.json'),
  }),
  Object.freeze({
    id: SESSION_CONTROLLER_PACKAGE_ID,
    root: `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller`,
    manifestSource: join(SESSION_CONTROLLER_ROOT, 'package.json'),
  }),
])

export const INTENDED_OUTPUTS = Object.freeze([
  'manifest.json',
  `${OUTPUT_ROOT}/lawbench-dsh/package.json`,
  `${OUTPUT_ROOT}/lawbench-dsh/cordis.patch.yml`,
  `${OUTPUT_ROOT}/lawbench-dsh/persona.md`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/agent.js`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/client.js`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/credentials.js`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/host.js`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/index.js`,
  `${OUTPUT_ROOT}/lawbench-dsh/lib/session-store.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-client-ui-conversation/package.json`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-client-ui-conversation/lib/index.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-client-ui-conversation/lib/client.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-client-ui-conversation/lib/client.js.map`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/package.json`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/index.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/client.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/client.js.map`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/typert.host.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/typert.host.d.ts`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.d.ts`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.d.ts.map`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/types/types.js`,
  `${OUTPUT_ROOT}/@deepseek-ai/dsh-api-session-controller/lib/types/remote-events.js`,
])
