import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const consumerPath = join(evidenceDir, 'native-contract-workflow.mts')
const actualDir = 'D:/Lawbeach/lawbench-coord/T18ManualReasonObserverInput-20261028-194335'

const consumerSource = await readFile(consumerPath, 'utf8')
const consumerFile = ts.createSourceFile(
  consumerPath,
  consumerSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
)

const functions: any[] = []
const visit = (node: any): void => {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'assertOutOfScopeReported') {
    functions.push(node)
  }
  ts.forEachChild(node, visit)
}
visit(consumerFile)
assert.equal(functions.length, 1, 'expected exactly one current observer function')

const functionNode = functions[0]
assert.equal(functionNode.parent, consumerFile, 'observer must be a top-level function')
const functionSource = functionNode.getText(consumerFile)
assert.doesNotMatch(
  functionSource,
  /\b(?:import|require|process|fetch|WebSocket|XMLHttpRequest|sendBeacon|child_process|http|https|net|tls|fs|os|eval|Function)\b/,
  'extracted observer must not have process, credential, filesystem, or network capabilities',
)

const safeCalls = new Set([
  'Number',
  'String',
  'compact',
  'exec',
  'get',
  'has',
  'isInteger',
  'matchAll',
  'max',
  'min',
  'normalize',
  'replace',
  'set',
  'slice',
  'some',
  'trim',
])
const safeConstructors = new Set(['Error', 'Map', 'Set'])
const inspectCapabilities = (node: any): void => {
  if (ts.isCallExpression(node)) {
    const target = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText(consumerFile)
    assert.ok(safeCalls.has(target), `observer call is outside safe allowlist: ${target}`)
  }
  if (ts.isNewExpression(node)) {
    const target = node.expression.getText(consumerFile)
    assert.ok(safeConstructors.has(target), `observer constructor is outside safe allowlist: ${target}`)
  }
  ts.forEachChild(node, inspectCapabilities)
}
inspectCapabilities(functionNode)

const exportable = functionSource.replace(
  /^function[ \t]+assertOutOfScopeReported/,
  'export function assertOutOfScopeReported',
)
assert.notEqual(exportable, functionSource, 'observer export transform must be exact')
const transpiled = ts.transpileModule(exportable, {
  fileName: 'assertOutOfScopeReported.ts',
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText

const moduleShim: { exports: Record<string, unknown> } = { exports: {} }
const context = vm.createContext(
  { module: moduleShim, exports: moduleShim.exports },
  { codeGeneration: { strings: false, wasm: false } },
)
new vm.Script(transpiled, { filename: 'assertOutOfScopeReported.cjs' })
  .runInContext(context, { timeout: 500 })
const observer = moduleShim.exports.assertOutOfScopeReported
assert.equal(typeof observer, 'function', 'observer did not load from current function body')

const actualDraft = await readFile(join(actualDir, 'actual-final-draft.md'), 'utf8')
const actualEditList = JSON.parse(
  await readFile(join(actualDir, 'actual-editlist-and-result.json'), 'utf8'),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  value: { out_of_scope: Array<Record<string, unknown>> }
}
const actualEdits = actualEditList.arguments.edits
const actualOutOfScope = actualEditList.value.out_of_scope

const replaceOnce = (value: string, before: string, after: string): string => {
  assert.equal(value.split(before).length - 1, 1, `fixture edit must match once: ${before}`)
  return value.replace(before, after)
}
const expectReject = (
  label: string,
  draft: string,
  items: Array<Record<string, unknown>>,
  edits: Array<Record<string, unknown>>,
): void => {
  assert.throws(
    () => observer(draft, items, edits),
    undefined,
    `${label} must fail closed`,
  )
}

observer(actualDraft, actualOutOfScope, actualEdits)

observer(
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越域代码或超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

observer(
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

observer(
  replaceOnce(actualDraft, '（find跨越超链接）', '（域代码）'),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing manual reason',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing manual marker',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：该条需修改（find跨越超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'wrong risk manual only',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing edit',
  actualDraft,
  actualOutOfScope,
  actualEdits.filter(edit => edit.id !== 3),
)

expectReject(
  'missing specific reason',
  actualDraft,
  [{ id: 3, reason: '' }],
  actualEdits,
)

expectReject(
  'duplicated edit id',
  actualDraft,
  actualOutOfScope,
  [...actualEdits, { ...actualEdits[2] }],
)

const misleadingOtherBlock = replaceOnce(
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  '- 处理方式：批注提示（涉及商务谈判，由律师决定是否提出）',
  '- 处理方式：该条需人工修改（find跨越超链接）',
)
expectReject('misleading other block', misleadingOtherBlock, actualOutOfScope, actualEdits)

expectReject(
  'nonmatching reason',
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越超链接或其他原因）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing risk block',
  replaceOnce(
    actualDraft,
    '### 风险3【P0】通知地址附件缺失',
    '### 风险33【P0】通知地址附件缺失',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'duplicated risk block',
  `${actualDraft}\n### 风险3【P0】重复\n- 处理方式：该条需人工修改（find跨越超链接）\n`,
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'ambiguous handling method',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：该条需人工修改（find跨越超链接）\n- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'wrong paragraph',
  actualDraft,
  actualOutOfScope,
  actualEdits.map(edit => edit.id === 3 ? { ...edit, para: 40 } : edit),
)

console.log('PASS manual-reason-observer: actual inputs and 16 focused cases')
