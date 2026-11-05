// T14/T17 错误恢复盲测（RED 阶段）：JSON null 是合法 JSON，解析不报错，
// 但 host/task-answer.ts 在 parse 的 catch 之外解引用 result.drafts / task.session_id，
// 结果抛出 TypeError 而不是返回已有的 TASK_NOT_FOUND。
// 执行令 T14TaskAnswerNullRED-20261101-003736，任务 T-20261101004000-a001。
// 本文件是本轮唯一新增文件：不动任何既有产品代码/测试/配置，不用 mock，测试跑真实文件系统。
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve, sep } from 'node:path'
import { NO_TASK, readTaskAnswer } from '../host/task-answer'

const TASK_ID = 'T-20261101004000-a001'
const OTHER_TASK_ID = 'T-20261101004000-b002'
const DRAFT_NAME = '答复.md'
const DRAFT_TEXT = '# 答复正文\n第二行。\n'
const PREFIX = 'lawbench-t14-null-'

const ownedRoots: string[] = []

/** 新建一个本轮独占的临时案件根（真实文件系统，不 mock 任何东西）。 */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), PREFIX))
  ownedRoots.push(root)
  return root
}

/** 写案件根下某任务的 result.json / task.json。 */
function writeTaskFile(root: string, taskId: string, name: string, content: string): void {
  const dir = join(root, '工作区', '任务', taskId)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), content, 'utf8')
}

/** 写一份草稿文件，返回它在 result.json 里该用的相对路径。 */
function writeDraft(root: string, taskId: string, name: string, text: string): string {
  const dir = join(root, '工作区', '任务', taskId, '草稿')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), text, 'utf8')
  return `工作区/任务/${taskId}/草稿/${name}`
}

/** 只清理由本文件 mkdtemp 建出来的自有目录（路径归属检查通过才删）。 */
function cleanupOwnedRoots(): void {
  for (const root of ownedRoots.splice(0)) {
    const resolved = resolve(root)
    if (!resolved.startsWith(resolve(tmpdir()) + sep)) throw new Error(`拒绝清理临时目录之外的路径：${resolved}`)
    if (!basename(resolved).startsWith(PREFIX)) throw new Error(`拒绝清理非本次创建的路径：${resolved}`)
    rmSync(resolved, { recursive: true, force: true })
  }
}

afterEach(cleanupOwnedRoots)

/**
 * 调原始公开接口 readTaskAnswer，把任何抛出的异常显式暴露成失败。
 * 不包一层假返回值，不改判定语义。
 */
function readAnswer(root: string, taskId: string): unknown {
  let answer: unknown
  let thrown: unknown
  try {
    answer = readTaskAnswer(root, taskId)
  } catch (e) {
    thrown = e
  }
  expect(thrown).toBeUndefined()
  return answer
}

describe('T14/T17 task-answer 错误恢复：JSON null 与非法 JSON', () => {
  it('结果文件是 JSON null 时返回 TASK_NOT_FOUND 且不抛异常', () => {
    const root = makeRoot()
    writeTaskFile(root, TASK_ID, 'result.json', 'null')
    writeTaskFile(root, TASK_ID, 'task.json', JSON.stringify({ session_id: 'sess-2026-0001', budget: { model_calls: 8 } }))

    const answer = readAnswer(root, TASK_ID)

    expect(answer).toEqual({ ok: false, error: { code: 'TASK_NOT_FOUND', message: NO_TASK } })
  })

  it('任务文件是 JSON null 时返回 TASK_NOT_FOUND 且不抛异常', () => {
    const root = makeRoot()
    const draftPath = writeDraft(root, TASK_ID, DRAFT_NAME, DRAFT_TEXT)
    writeTaskFile(
      root,
      TASK_ID,
      'result.json',
      JSON.stringify({ status: 'completed', usage: { model_calls: 5 }, drafts: [{ title: '答复草稿', path: draftPath, version: 2 }] }),
    )
    writeTaskFile(root, TASK_ID, 'task.json', 'null')

    const answer = readAnswer(root, TASK_ID)

    expect(answer).toEqual({ ok: false, error: { code: 'TASK_NOT_FOUND', message: NO_TASK } })
  })

  it('结果与任务都是合法记录时，状态/会话/用量/上限/草稿原样保留', () => {
    const root = makeRoot()
    const draftPath = writeDraft(root, TASK_ID, DRAFT_NAME, DRAFT_TEXT)
    writeTaskFile(
      root,
      TASK_ID,
      'result.json',
      JSON.stringify({ status: 'completed', usage: { model_calls: 5 }, drafts: [{ title: '答复草稿', path: draftPath, version: 2 }] }),
    )
    writeTaskFile(root, TASK_ID, 'task.json', JSON.stringify({ session_id: 'sess-2026-0001', budget: { model_calls: 8 } }))

    expect(readTaskAnswer(root, TASK_ID)).toEqual({
      ok: true,
      value: {
        status: 'completed',
        session_id: 'sess-2026-0001',
        used: 5,
        limit: 8,
        draft: { title: '答复草稿', version: 2, path: draftPath, text: DRAFT_TEXT, truncated: false },
      },
    })
  })

  it('缺少可选的 task.json 时仍返回草稿，会话与上限为 null', () => {
    const root = makeRoot()
    const draftPath = writeDraft(root, TASK_ID, DRAFT_NAME, DRAFT_TEXT)
    writeTaskFile(
      root,
      TASK_ID,
      'result.json',
      JSON.stringify({ status: 'completed', usage: { model_calls: 3 }, drafts: [{ title: '答复草稿', path: draftPath, version: 1 }] }),
    )

    expect(readTaskAnswer(root, TASK_ID)).toEqual({
      ok: true,
      value: {
        status: 'completed',
        session_id: null,
        used: 3,
        limit: null,
        draft: { title: '答复草稿', version: 1, path: draftPath, text: DRAFT_TEXT, truncated: false },
      },
    })
  })

  it('result.json 语法非法时返回 TASK_NOT_FOUND', () => {
    const root = makeRoot()
    writeTaskFile(root, TASK_ID, 'result.json', '{ "status": ')
    writeTaskFile(root, TASK_ID, 'task.json', JSON.stringify({ session_id: 'sess-2026-0001', budget: { model_calls: 8 } }))

    expect(readTaskAnswer(root, TASK_ID)).toEqual({ ok: false, error: { code: 'TASK_NOT_FOUND', message: NO_TASK } })
  })

  it('task.json 语法非法时返回 TASK_NOT_FOUND', () => {
    const root = makeRoot()
    const draftPath = writeDraft(root, TASK_ID, DRAFT_NAME, DRAFT_TEXT)
    writeTaskFile(
      root,
      TASK_ID,
      'result.json',
      JSON.stringify({ status: 'completed', usage: { model_calls: 5 }, drafts: [{ title: '答复草稿', path: draftPath, version: 2 }] }),
    )
    writeTaskFile(root, TASK_ID, 'task.json', '{ "session_id": ')

    expect(readTaskAnswer(root, TASK_ID)).toEqual({ ok: false, error: { code: 'TASK_NOT_FOUND', message: NO_TASK } })
  })

  it('草稿路径不在本任务的草稿目录下时返回 draft 为 null', () => {
    const root = makeRoot()
    const otherTaskDraft = writeDraft(root, OTHER_TASK_ID, DRAFT_NAME, '别的任务的草稿')
    const looseDir = join(root, '工作区', '任务', TASK_ID)
    mkdirSync(looseDir, { recursive: true })
    writeFileSync(join(looseDir, DRAFT_NAME), '本任务目录下但不在草稿子目录的散稿', 'utf8')
    const looseDraft = `工作区/任务/${TASK_ID}/${DRAFT_NAME}`
    writeTaskFile(
      root,
      TASK_ID,
      'result.json',
      JSON.stringify({
        status: 'completed',
        usage: { model_calls: 1 },
        drafts: [
          { title: '别的任务的草稿', path: otherTaskDraft, version: 1 },
          { title: '散落草稿', path: looseDraft, version: 1 },
        ],
      }),
    )
    writeTaskFile(root, TASK_ID, 'task.json', JSON.stringify({ session_id: 'sess-2026-0001', budget: { model_calls: 8 } }))

    expect(readTaskAnswer(root, TASK_ID)).toEqual({
      ok: true,
      value: {
        status: 'completed',
        session_id: 'sess-2026-0001',
        used: 1,
        limit: 8,
        draft: null,
      },
    })
  })
})
