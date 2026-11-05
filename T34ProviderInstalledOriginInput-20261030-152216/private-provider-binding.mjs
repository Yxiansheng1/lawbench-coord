import { registerHooks } from 'node:module'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const FIXED_ORIGINAL = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\llm\\llm-pi-ai\\lib\\index.js',
  bytes: 114078,
  sha256: 'a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f',
})
const FIXED_CANDIDATE = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\ProviderPrivateBuild-20261030-120048\\private-output\\llm-pi-ai.mjs',
  bytes: 81412,
  sha256: '664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17',
})
const FIXED_MANIFEST = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\ProviderPrivateBuild-20261030-120048\\private-output\\manifest.json',
  bytes: 24383,
  sha256: 'f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54',
})
const FIXED_FILES = Object.freeze([FIXED_ORIGINAL, FIXED_CANDIDATE, FIXED_MANIFEST])
const ORIGINAL_FILE_URL = pathToFileURL(FIXED_ORIGINAL.path).href
const PRIVATE_FILE_URL = pathToFileURL(FIXED_CANDIDATE.path).href
const MAX_LOG_LINES = 8
let logSequence = 0

function assertPinnedFile(file) {
  const stats = lstatSync(file.path)
  if (!stats.isFile() || stats.isSymbolicLink() || realpathSync.native(file.path) !== file.path) {
    throw new Error('T34 private provider path is not the fixed regular file')
  }
  if (stats.size !== file.bytes) {
    throw new Error('T34 private provider byte count changed')
  }
  const digest = createHash('sha256').update(readFileSync(file.path)).digest('hex')
  if (digest !== file.sha256) {
    throw new Error('T34 private provider hash changed')
  }
}

function assertPinnedFiles() {
  for (const file of FIXED_FILES) {
    assertPinnedFile(file)
  }
}

function logBinding() {
  if (logSequence >= MAX_LOG_LINES) return
  logSequence += 1
  try {
    console.log(JSON.stringify({
      kind: 'T34_PRIVATE_PROVIDER_COMPONENT_BOUND',
      pid: process.pid,
      sequence: logSequence,
      originalSha256: FIXED_ORIGINAL.sha256,
      candidateSha256: FIXED_CANDIDATE.sha256,
    }))
  } catch {}
}

assertPinnedFiles()

registerHooks({
  resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context)
    if (result.url !== ORIGINAL_FILE_URL) return result
    assertPinnedFiles()
    logBinding()
    return { ...result, url: PRIVATE_FILE_URL, shortCircuit: true }
  },
})
