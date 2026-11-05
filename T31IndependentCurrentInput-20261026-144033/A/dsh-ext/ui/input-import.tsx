// T31：DSH 已去掉原生“+”按钮；在公开左槽恢复文件和原生文件夹两个案件导入入口。
import { useEffect, useRef, useState } from 'react'
import { Button, getNav } from './kit.tsx'
import type { IntakeHook } from './intake.ts'
import { app, samePath } from './state.ts'

type InputState = {
  readonly phase: 'plain' | 'adjudicating' | 'claimed' | 'submitting'
}
type SessionSnapshot = {
  readonly byId: Record<string, { cwd?: string } | undefined>
}

export type InputImportProps = {
  sessionId: string
  useInput: <T>(select: (state: InputState) => T) => T
  useSessions: <T>(select: (state: SessionSnapshot) => T) => T
  intake: IntakeHook
}

type Slots = {
  inject(name: string, fn: () => unknown): unknown
  register(options: Record<string, unknown>, component: unknown): unknown
}

export function InputImportButton({ sessionId, useInput, useSessions, intake }: InputImportProps) {
  const phase = useInput((state) => state.phase)
  const root = useSessions((state) => state.byId[sessionId]?.cwd)
  const picker = useRef<HTMLInputElement | null>(null)
  const folderPickerPending = useRef(false)
  const sessionIdRef = useRef(sessionId)
  const phaseRef = useRef(phase)
  const rootRef = useRef(root)
  const active = useRef(true)
  const [message, setMessage] = useState<string | null>(null)
  const [folderPending, setFolderPending] = useState(false)
  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])
  sessionIdRef.current = sessionId
  phaseRef.current = phase
  rootRef.current = root
  const disabled = phase !== 'plain' || !root || folderPending

  const chooseFolder = async () => {
    if (folderPickerPending.current) return
    const pickedSessionId = sessionIdRef.current
    const pickedPhase = phaseRef.current
    const pickedRoot = rootRef.current
    if (pickedPhase !== 'plain' || !pickedRoot) return
    const pickedCase = app.get().cases.find((candidate) => samePath(candidate.root, pickedRoot))
    if (!pickedCase) {
      setMessage('材料只能导入到案件里。请先从首页打开案件，再导入文件夹。')
      return
    }

    // ref 是同步闸门：同一 tick 的第二次点击在 React 重绘前也会被挡住。
    setMessage(null)
    folderPickerPending.current = true
    setFolderPending(true)
    try {
      const path = await getNav().pickDirectory()
      if (!active.current || !path) return
      const currentRoot = rootRef.current
      const currentCase = currentRoot === undefined
        ? undefined
        : app.get().cases.find((candidate) => samePath(candidate.root, currentRoot))
      if (sessionIdRef.current !== pickedSessionId || phaseRef.current !== 'plain' ||
        !currentRoot || !samePath(currentRoot, pickedRoot) || currentCase?.case_id !== pickedCase.case_id) {
        if (active.current) setMessage('会话、案件或输入状态已经变化，刚才选择的文件夹没有导入。')
        return
      }
      setMessage(intake(
        pickedSessionId,
        [],
        new Set(),
        [{ path, kind: 'dir' }],
        { caseId: pickedCase.case_id, root: pickedRoot },
      ) ?? null)
    } catch {
      if (active.current) setMessage('文件夹选择器没有打开，本次没有导入。')
    } finally {
      folderPickerPending.current = false
      if (active.current) setFolderPending(false)
    }
  }

  return (
    <span data-t31-input-import="" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <input
        ref={picker}
        type="file"
        multiple
        hidden
        disabled={disabled}
        onChange={(event) => {
          const files = event.currentTarget.files === null ? [] : [...event.currentTarget.files]
          event.currentTarget.value = ''
          if (files.length === 0 || folderPickerPending.current) return
          setMessage(intake(sessionId, files, new Set()) ?? null)
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        title={folderPending ? '正在选择文件夹…' : disabled ? '当前会话暂时不能导入文件' : '把文件导入当前案件'}
        aria-label="导入文件"
        onClick={() => {
          if (!folderPickerPending.current) picker.current?.click()
        }}
      >
        ＋
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        title={folderPending ? '正在选择文件夹…' : disabled ? '当前会话暂时不能导入文件夹' : '把整个文件夹导入当前案件'}
        aria-label="导入文件夹"
        aria-busy={folderPending || undefined}
        onClick={() => { void chooseFolder() }}
      >
        文件夹
      </Button>
      {message ? <span role="status" aria-live="polite" title={message}>{message}</span> : null}
    </span>
  )
}

/** 与拖入、粘贴共用同一个既有导入钩子。 */
export function registerInputImportButton(slots: Slots, intake: IntakeHook): void {
  slots.inject('conversation.input.left', () => slots.register({
    name: 'conversation.input.left',
    id: 'lawbench.input-import',
    order: 10,
    label: '导入文件',
  }, (props: Omit<InputImportProps, 'intake'>) => <InputImportButton {...props} intake={intake} />))
}
