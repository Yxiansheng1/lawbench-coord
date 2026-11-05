// 输入区上方的任务结果（T14 派修 2，执行令 2026-10-03 15:41；用户原话件 OWNER-T14预算到顶对话区显示草稿-20261003-1549）：
// 到达用量上限那一轮，模型最后一次调用是"存草稿"、没写出文字回答，对话区只剩"已完成工作"，律师无处点出处。
// 这时在对话区（输入区上方）显示一句提示和刚存的草稿正文，正文用 DSH 的 MarkdownText 画，出处是可点按钮（同对话区的出处）。
// 草稿正文每次经 Host 的 taskAnswer 从案件里读（只读该任务目录），界面不留副本。成果页本轮不加草稿预览（候 owner N65）。
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { useMemo, useState } from 'react'
import { citationInlineMarks } from './citation.ts'
import { citationDepsFor } from './citation-deps.ts'
import { Button, C, getNav, Loading, useLoad } from './kit.tsx'
import { ResultCard } from './result-cards.tsx'
import { answerKind, app, call, hideTaskAnswer, notice, type AnswerKind, type CaseRef } from './state.ts'
import { useStore } from './store.ts'

export interface TaskAnswerView {
  status: string
  session_id: string | null
  used: number | null
  limit: number | null
  draft: { title: string; version: number; path: string; text: string; truncated: boolean } | null
}

/**
 * 提示那一句（纯函数，测试守着）。这块只在到达用量上限时出现（turnNotice 的 BUDGET_STOPPED、成果页里状态为到达上限的任务），
 * 所以第一句一律按到顶说，不看 result.json 的状态——它由 Agent 在一轮结束后异步写，界面可能读得比它早（T13 派修复核 F2）。
 * result.json 只用来取次数：用满写"已用完……（8/8）"；没用满（时间到，或用量还没写完）写"已到……用量上限（模型调用 5/8）"；取不到不写括号。
 */
export function answerNotice(v: Pick<TaskAnswerView, 'used' | 'limit' | 'draft'>, kind: AnswerKind = 'budget'): string {
  // 熔断第①道（注记 2026-10-14 19:01）：不说用量，说为什么停、请律师怎么做；有草稿同样说存了
  if (kind === 'repetition') return v.draft ? `${REPETITION_TEXT}；已把做到的部分存为草稿` : REPETITION_TEXT
  const known = v.used !== null && v.limit !== null
  const head = known && v.used! >= v.limit! ? `已用完本次运行的模型调用次数（${v.used}/${v.limit}）`
    : known ? `已到本次运行的用量上限（模型调用 ${v.used}/${v.limit}）` : '已到本次运行的用量上限'
  // 令 0321：有草稿（模型自己存的，或到顶时代存的"未完成"草稿）说"已把做到的部分存为草稿"；没有任何文字可存时照旧
  return v.draft ? `${head}，已把做到的部分存为草稿` : `${head}，没有存下草稿；做到哪里请看成果里的"未完成"`
}

/** 到顶后点"继续"在同一对话里替律师发的那句（注记 1616 第 5 条，B 定的口径：服务会把上个任务的读取记录带进来）。 */
export const CONTINUE_TEXT = '接着上次没做完的继续，先看已存的草稿'

/** 思考 / 回复原样重复、模型调用被中止（Agent 插件 REPETITION_STOPPED）。与 agent\index.ts 的 REPETITION_MESSAGE 同一句。 */
export const REPETITION_TEXT = '这个请求我做不了或没理解，请换个说法或拆成小步'

/** 到顶时由 Agent 插件代存的草稿（标题以"（未完成）"结尾，同 agent\task-state.ts 的 UNFINISHED_SUFFIX）。 */
export const isUnfinished = (title: string): boolean => title.endsWith('（未完成）')

const LABELS = { code: { copyLabel: '复制', copiedLabel: '已复制' }, footnotes: '注释' }

/** 某会话输入区上方的任务结果；没有要显示的为空。 */
export function TaskAnswerSlot({ caseRef, sessionId }: { caseRef: CaseRef; sessionId: string }) {
  const taskId = useStore(app, (s) => s.answers[sessionId])
  if (!taskId) return null
  return <TaskAnswerPanel key={taskId} caseRef={caseRef} sessionId={sessionId} taskId={taskId} />
}

function TaskAnswerPanel({ caseRef, sessionId, taskId }: { caseRef: CaseRef; sessionId: string; taskId: string }) {
  const [data] = useLoad(() => call<TaskAnswerView>('taskAnswer', { root: caseRef.root, task_id: taskId }), [caseRef.root, taskId])
  const marks = useMemo(() => citationInlineMarks(citationDepsFor(taskId)), [taskId])
  const kind = answerKind(sessionId)
  const running = useStore(app, (s) => s.runningSessions.includes(sessionId))
  const [sending, setSending] = useState(false)
  // 到顶才有"继续"（熔断是没理解，接着做没有用）；一轮还在跑、正在发时不能点；发出去了就收起这块
  const goOn = async () => {
    setSending(true)
    const sent = await getNav().sendMessage?.(sessionId, CONTINUE_TEXT).catch(() => false)
    setSending(false)
    if (sent) hideTaskAnswer(sessionId); else notice('没有发出去', '请在输入框里自己发一句"继续"。')
  }
  return (
    <section aria-label="本次运行的结果" style={{ border: `1px solid ${C.warn}`, borderRadius: C.rMd, padding: '6px 10px', margin: '0 0 6px', fontSize: 13, color: C.text, maxHeight: '45vh', overflow: 'auto' }}>
      <Loading data={data}>{(v) => (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: C.warn }}>{answerNotice(v, kind)}</strong>
            <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {kind === 'budget' ? <Button size="sm" variant="primary" style={{ whiteSpace: 'nowrap' }} disabled={running || sending} title={CONTINUE_TEXT} onClick={() => void goOn()}>继续</Button> : null}
              <Button size="sm" variant="ghost" style={{ whiteSpace: 'nowrap' }} onClick={() => hideTaskAnswer(sessionId)}>收起</Button>
            </span>
          </div>
          {v.draft ? (
            <>
              <div style={{ color: C.sub, fontSize: 12, margin: '4px 0' }}>草稿"{v.draft.title}"（第 {v.draft.version} 版）。点出处打开原文；到"成果"里确认保存、导出。</div>
              <MarkdownText text={v.draft.text} labels={LABELS} inlineMarks={marks} />
              {v.draft.truncated ? <div style={{ color: C.sub, fontSize: 12 }}>草稿较长，这里只显示前一部分。</div> : null}
              {/* 到顶时代存的草稿不是模型调工具存的，聊天流里没有它的卡片：在这里放一张，可以确认保存、选作下一步输入 */}
              {isUnfinished(v.draft.title) ? <ResultCard caseRef={caseRef} sessionId={sessionId} draft={{ seq: 0, title: v.draft.title, path: v.draft.path, version: v.draft.version, coverage: null, citation_check: null }} /> : null}
            </>
          ) : null}
        </>
      )}</Loading>
    </section>
  )
}
