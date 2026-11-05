// @vitest-environment jsdom
import { CLOSED_EXTERNAL_LLM, EXTERNAL_PROVIDER_NS, syncExternalProvider } from '../ui/settings.tsx'
import { setSettingsRemote } from '../ui/state.ts'

const EXPECTED_BASE = 'DSH 没有接受外部模型路由，请重试'
const SECRET_SENTINEL = 'T34_SECRET_SENTINEL_9f21c0'

const failedRemoteResult = (error: Record<string, unknown>) => ({ ok: false, error }) as never

afterEach(() => {
  setSettingsRemote(undefined)
})

describe('T34 外部模型投影错误可见性', () => {
  it('成功投影返回空错误且不改成功条件', async () => {
    const mutate = vi.fn(async () => ({ ok: true as const, value: { revision: 1 } }))
    setSettingsRemote({ mutate })

    await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBeNull()
    expect(mutate).toHaveBeenCalledWith(
      EXTERNAL_PROVIDER_NS,
      [{ op: 'unset', path: ['providers', 'external'] }],
      undefined,
    )
  })

  it('已知失败显示白名单 code 和源码固定原因', async () => {
    setSettingsRemote({
      mutate: async () => failedRemoteResult({
        code: 'settings/rejected',
        message: `Plugin entry "llm-pi-ai" has no volatile fields; ${SECRET_SENTINEL}`,
        details: { secret: SECRET_SENTINEL },
        stack: `Error: ${SECRET_SENTINEL}`,
      }),
    })

    const error = await syncExternalProvider(CLOSED_EXTERNAL_LLM)
    expect(error).toBe(`${EXPECTED_BASE}（错误码：settings/rejected；插件没有可配置字段）`)
    expect(error).not.toContain(SECRET_SENTINEL)
    expect(error).not.toContain('Plugin entry')
  })

  it('未知 code 与原始消息含 sentinel 时只显示固定 unknown', async () => {
    setSettingsRemote({
      mutate: async () => failedRemoteResult({
        code: `vendor/${SECRET_SENTINEL}`,
        message: `C:\\private\\provider.json ${SECRET_SENTINEL}`,
        details: { token: SECRET_SENTINEL },
      }),
    })

    const error = await syncExternalProvider(CLOSED_EXTERNAL_LLM)
    expect(error).toBe(`${EXPECTED_BASE}（错误码：unknown）`)
    expect(error).not.toContain(SECRET_SENTINEL)
    expect(error).not.toContain('private')
    expect(error).not.toContain('provider.json')
  })

  it('抛出的已知固定原因仍只投影安全 code 与固定说明', async () => {
    setSettingsRemote({
      mutate: async () => {
        throw Object.assign(new Error(`Configuration for "llm-pi-ai" is overridden by a home patch or command-line overlay; ${SECRET_SENTINEL}`), {
          code: 'settings/rejected',
          details: { secret: SECRET_SENTINEL },
        })
      },
    })

    const error = await syncExternalProvider(CLOSED_EXTERNAL_LLM)
    expect(error).toBe(`${EXPECTED_BASE}（错误码：settings/rejected；配置被 home patch 或命令行覆盖）`)
    expect(error).not.toContain(SECRET_SENTINEL)
  })
})
