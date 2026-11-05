// @vitest-environment jsdom
// T34：凭据 describe 回复缺记录 / 缺布尔字段时，外部 Key 控件必须显示「状态未知」并关闭全部写入入口。
//
// 契约事实：CredentialsApi.describe 承诺返回 Record<string, { configured: boolean; source?: string; writable: boolean }>，
// 但真实 credentials Remote 的返回体可能缺记录、缺字段，或给出非布尔值。
// 当前 settings.tsx 用 `info?.configured === true` 与 `info?.writable !== false` 做可选式强转：
// 缺字段会被当成「未设置 + 可写」，界面于是呈现一个并不存在的已知状态，并把写入入口打开。
// 清除后的那次 describe 目前只挡「整条记录缺失」，不挡「记录在但字段不合法」。
//
// 本文件只断言既有契约（已知/未知两态 + 只读门 + 不得谎报清除结果），
// 不引入新功能、不放宽断言、不复制组件实现、不接真实 SystemStore/Keyring/网络。
// 全部凭据数据为进程内合成内存字符串。当前产品源码下这些用例应当失败，由 Root 执行确认 RED。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ExternalKeyControl } from '../ui/settings.tsx'
import { setCredentialsApi, type CredentialsApi } from '../ui/state.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SYNTHETIC_SECRET = 'synthetic-t34-external-secret'

type CredentialInfo = { configured: boolean; source?: string; writable: boolean }
type DescribeReply = Record<string, CredentialInfo>
// 每条 describe 回复按「本次请求的 ref」构造，避免把 ref 常量写死在测试里。
type ReplyBuilder = (refs: string[]) => DescribeReply

let root: Root | undefined
let box: HTMLDivElement

beforeEach(() => {
  box = document.createElement('div')
  document.body.appendChild(box)
})

afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
  box.remove()
  setCredentialsApi(undefined)
})

// ---- 断言用的小工具（全部读真实渲染出来的 DOM，不复制组件实现）----

const buttonsWithText = (text: string) =>
  [...box.querySelectorAll('button')].filter((b) => b.textContent === text)

const button = (text: string) => buttonsWithText(text)[0]

const secretInput = () => box.querySelector('[aria-label="外部模型 Key"]') as HTMLInputElement | null

const isDisabled = (el: HTMLButtonElement | undefined) =>
  !!el && (el.disabled === true || el.hasAttribute('disabled'))

// 状态文案是控件里唯一一个整段文本恰好是三态之一的 span；消息 span 文本更长，不会误命中。
const statusText = () => {
  const known = ['状态未知', '已设置', '未设置']
  const span = [...box.querySelectorAll('span')].find((s) => known.includes((s.textContent ?? '').trim()))
  return span ? (span.textContent ?? '').trim() : ''
}

const messageText = () => box.querySelector('[role="status"]')?.textContent ?? ''

const typeSecret = async (el: HTMLInputElement, value: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => { setValue.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })) })
}

const flushTasks = async (turns = 8) => {
  for (let i = 0; i < turns; i += 1) await act(async () => { await Promise.resolve() })
}

// 进程内合成的凭据接口：只有 describe/set/unset 三件套，没有读取秘密的路径，也不碰真实存储。
const memoryApi = (
  replies: ReplyBuilder[],
  calls: { op: 'set' | 'unset'; ref: string; value?: string }[],
) => {
  let index = 0
  const api: CredentialsApi = {
    describe: async (refs) => {
      const builder = replies[Math.min(index, replies.length - 1)]
      index += 1
      return builder(refs)
    },
    set: async (ref, value) => { calls.push({ op: 'set', ref, value }) },
    unset: async (ref) => { calls.push({ op: 'unset', ref }) },
  }
  return api
}

// 非法回复只在本地按已知返回类型强转，不改契约、不加启发式解析。
const invalidReply = (raw: Record<string, unknown>) => raw as unknown as DescribeReply

const renderControl = async (api: CredentialsApi) => {
  setCredentialsApi(api)
  root = createRoot(box)
  await act(async () => { root!.render(createElement(ExternalKeyControl)) })
  await flushTasks()
}

// ---- describe 回复样本 ----

const missingRecord: ReplyBuilder = () => invalidReply({})
const undefinedRecord: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: undefined })
const nullRecord: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: null })
const emptyFields: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: {} })
const configuredNotBool: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: { configured: 'yes', writable: true } })
const configuredNull: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: { configured: null, writable: true } })
const writableMissing: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: { configured: true } })
const writableNotBool: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: { configured: false, writable: 'yes' } })
const writableNull: ReplyBuilder = (refs) => invalidReply({ [refs[0]!]: { configured: false, writable: null } })

const validFalseFalse: ReplyBuilder = (refs) => ({ [refs[0]!]: { configured: false, writable: false } })
const validTrueFalse: ReplyBuilder = (refs) => ({ [refs[0]!]: { configured: true, writable: false } })
const validFalseTrue: ReplyBuilder = (refs) => ({ [refs[0]!]: { configured: false, writable: true } })
const validTrueTrue: ReplyBuilder = (refs) => ({ [refs[0]!]: { configured: true, writable: true } })

// 初次 describe 的非法回复：无记录 / 无字段 / 非布尔。
const invalidInitialReplies: Array<{ name: string; reply: ReplyBuilder }> = [
  { name: 'describe 返回空记录（没有该 ref）', reply: missingRecord },
  { name: '该 ref 的记录为 undefined', reply: undefinedRecord },
  { name: '该 ref 的记录为 null', reply: nullRecord },
  { name: '该 ref 缺少两个布尔字段', reply: emptyFields },
  { name: 'configured 不是布尔', reply: configuredNotBool },
  { name: 'configured 为 null', reply: configuredNull },
  { name: 'writable 缺字段', reply: writableMissing },
  { name: 'writable 不是布尔', reply: writableNotBool },
  { name: 'writable 为 null', reply: writableNull },
]

// 写入/清除成功后的第二次 describe 的非法回复：整条记录缺失 vs 记录在但字段不合法。
const malformedAfterWrite: Array<{ name: string; reply: ReplyBuilder }> = [
  { name: '缺少该 ref 的记录', reply: missingRecord },
  { name: '该 ref 缺少两个布尔字段', reply: emptyFields },
]

describe('T34 invalid credential describe state', () => {
  for (const item of invalidInitialReplies) {
    it(`初次 describe 异常回复（${item.name}）时状态未知、写入入口关闭且不发生任何写入`, async () => {
      const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
      await renderControl(memoryApi([item.reply], calls))

      expect(statusText()).toBe('状态未知')
      expect(isDisabled(button('保存外部 Key'))).toBe(true)
      expect(buttonsWithText('清除外部 Key')).toHaveLength(0)

      // 写入入口必须真的关死：点开、填值、提交都不应产生 set/unset。
      await act(async () => { button('保存外部 Key')?.click() })
      await flushTasks(2)
      const el = secretInput()
      if (el) {
        await typeSecret(el, SYNTHETIC_SECRET)
        await act(async () => { button('保存外部 Key')?.click() })
        await flushTasks()
      }
      expect(calls).toEqual([])
      expect(box.innerHTML).not.toContain(SYNTHETIC_SECRET)
      expect(statusText()).toBe('状态未知')
    })
  }

  it('有效回复 { configured: false, writable: false } 时显示未设置且只读', async () => {
    const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
    await renderControl(memoryApi([validFalseFalse], calls))

    expect(statusText()).toBe('未设置')
    expect(isDisabled(button('保存外部 Key'))).toBe(true)
    expect(buttonsWithText('清除外部 Key')).toHaveLength(0)

    await act(async () => { button('保存外部 Key')?.click() })
    await flushTasks(2)
    expect(secretInput()).toBeNull()
    expect(calls).toEqual([])
  })

  it('有效回复 { configured: true, writable: false } 时显示已设置且只读（清除按钮禁用）', async () => {
    const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
    await renderControl(memoryApi([validTrueFalse], calls))

    expect(statusText()).toBe('已设置')
    expect(isDisabled(button('保存外部 Key'))).toBe(true)
    const clear = button('清除外部 Key')
    expect(clear).toBeTruthy()
    expect(isDisabled(clear)).toBe(true)

    await act(async () => { clear?.click() })
    await flushTasks()
    expect(calls).toEqual([])
  })

  it('有效回复 { configured: false, writable: true } 时显示未设置且可以打开写入入口', async () => {
    const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
    await renderControl(memoryApi([validFalseTrue], calls))

    expect(statusText()).toBe('未设置')
    expect(isDisabled(button('保存外部 Key'))).toBe(false)

    await act(async () => { button('保存外部 Key')?.click() })
    await flushTasks(2)
    expect(secretInput()).not.toBeNull()
  })

  for (const item of malformedAfterWrite) {
    it(`写入成功后 describe 异常回复（${item.name}）时状态未知、不谎报成功且不产生第二次写入`, async () => {
      const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
      await renderControl(memoryApi([validFalseTrue, item.reply], calls))

      expect(statusText()).toBe('未设置')
      await act(async () => { button('保存外部 Key')?.click() })
      await flushTasks(2)
      const el = secretInput()
      expect(el).not.toBeNull()
      await typeSecret(el!, SYNTHETIC_SECRET)
      await act(async () => { button('保存外部 Key')?.click() })
      await flushTasks()

      // 记忆凭据只被写入一次；合成秘密不留在 DOM 里。
      const writes = calls.filter((c) => c.op === 'set')
      expect(writes).toHaveLength(1)
      expect(writes[0]!.value).toBe(SYNTHETIC_SECRET)
      expect(calls.filter((c) => c.op === 'unset')).toHaveLength(0)
      expect(box.innerHTML).not.toContain(SYNTHETIC_SECRET)
      expect(secretInput()).toBeNull()

      // 读不到状态就只能是未知：写入入口关闭、没有清除按钮、只给既有的提示文案。
      expect(statusText()).toBe('状态未知')
      expect(isDisabled(button('保存外部 Key'))).toBe(true)
      expect(buttonsWithText('清除外部 Key')).toHaveLength(0)
      expect(messageText()).toBe('外部 Key 已保存，但没能读取当前状态')
    })
  }

  for (const item of malformedAfterWrite) {
    it(`清除成功后 describe 异常回复（${item.name}）时状态未知、不谎报已清除且不产生第二次清除`, async () => {
      const calls: { op: 'set' | 'unset'; ref: string; value?: string }[] = []
      await renderControl(memoryApi([validTrueTrue, item.reply], calls))

      expect(statusText()).toBe('已设置')
      const clear = button('清除外部 Key')
      expect(clear).toBeTruthy()
      expect(isDisabled(clear)).toBe(false)
      await act(async () => { clear?.click() })
      await flushTasks()

      expect(calls.filter((c) => c.op === 'unset')).toHaveLength(1)
      expect(calls.filter((c) => c.op === 'set')).toHaveLength(0)

      expect(statusText()).toBe('状态未知')
      expect(isDisabled(button('保存外部 Key'))).toBe(true)
      expect(buttonsWithText('清除外部 Key')).toHaveLength(0)
      expect(messageText()).toBe('未确认清除：没能读取当前状态')
      expect(box.textContent).not.toContain('外部 Key 已清除')
    })
  }
})
