# A 线交回：T34 凭据 describe 异常形状测试（source-only）

- 执行令：`D:\Lawbeach\lawbench-coord\A-T34-credential-describe-tests-order-20261031-071304.md`
- 输入：`D:\Lawbeach\lawbench-coord\T34CredentialDescribeShapeInput-20261031-071304\primary-dossier.txt`（全文读完）、`approved.json`（全文读完）
- 执行者：独立 A 线，DeepSeek，模型 deepseek-v4.1-flash-1017 / reasoning max
- 日期：2026-10-31
- 性质：**源码编写，未运行**（Root 独占执行）

## 1. 交付物（只新增一个测试文件）

| 项 | 值 |
| --- | --- |
| 路径 | `D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-credential-describe-shape-20261031-071304.spec.ts` |
| 字节 | 12089 |
| 行数 | 254 |
| sha256 | `81a4efe0ad842362742f36269a4cf7a7a4be76858869beeabc2d0cfb718790a2` |

## 2. 产品与既有文件未改动（只读核验，approved.json 九个 pin 全部 UNCHANGED）

| 文件 | 字节 | sha256 | 状态 |
| --- | --- | --- | --- |
| `dsh-ext\ui\settings.tsx` | 39858 | `e6f5e5fb98b6f249e397d85f98fe7eac3a7dae9869e1daa57abbc34f0fee7967` | UNCHANGED |
| `dsh-ext\ui\state.ts` | 18994 | `d93174f1f1ac88eb6c5552c740774178a636ef8d2eeff592297750492a0257cb` | UNCHANGED |
| `dsh-ext\tests\settings-t34.spec.ts` | 36195 | `14b9e21982a6ec0d4cf51ebde716f82c1e91cddeac660eb7f3a6a312f94751c3` | UNCHANGED |
| `dsh-ext\agent\index.ts` | 50958 | `f2f8444f9cc4f83a98153f40dc81fb32dcf5e0c21c846101c60433c274896ead` | UNCHANGED |
| `dsh-ext\agent\task-state.ts` | 22291 | `82121824045eee3e4e816caa5c066152b7e00681c39c207d49f562b399801815` | UNCHANGED |
| `dsh-ext\host\index.ts` | 63665 | `cb3679ae85ea6b4f56406b5cbb1e01c1fe0e4739bb22d0ccf05cd4c7ac8fbf83` | UNCHANGED |
| `dsh-ext\vitest.config.mjs` | 2641 | `62e4d81d88c1500f03805c4e76d030a9837065e960d1efe7935a039da91b3fbf` | UNCHANGED |
| `dsh-ext\tsconfig.json` | 977 | `db6444cb6b3fef772b06b324cebb36610a4e418445bf40981001bb0c1ada560b` | UNCHANGED |
| `dsh-ext\package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` | UNCHANGED |

未改产品、未改既有测试、未改契约、未改配置。

## 3. 测试设计

### 3.1 脚手架

复用既有 jsdom React 脚手架：`// @vitest-environment jsdom` + `createRoot` / `act` / `setCredentialsApi` / 真实 `ExternalKeyControl` 组件。
断言一律读真实渲染出的 DOM（按钮文本、`aria-label="外部模型 Key"` 的输入框、`role="status"` 提示、三态状态 span），**没有复制组件实现、没有 DOM 假产品**。

### 3.2 合成凭据与清理

- 凭据接口为进程内合成内存实现，只暴露 `describe` / `set` / `unset` 三个方法；不接真实 SystemStore、Keyring、DPAPI、网络，不调用任何真实 secret getter。
- 合成秘密只有一个固定假串 `synthetic-t34-external-secret`。
- `beforeEach` 建 `box`；`afterEach` 在 `act` 内 `unmount`、`box.remove()`、`setCredentialsApi(undefined)`。
- 每次渲染与每个断言间隙用 `flushTasks()`（多轮 `await act(async () => { await Promise.resolve() })`）把挂起任务排空，避免泄漏与未决 promise。
- `describe` 的请求 ref 由测试从**真实调用参数**取用（`refs[0]`），测试里不硬编码 `EXTERNAL_LLM_KEY`；产品侧传入什么 ref，回复就挂在什么 ref 上。
- 非法回复只在本地以 `as unknown as DescribeReply` 强转到已知返回类型，不新增任何启发式/解析/源码解析。

### 3.3 套件名与用例

套件名：`T34 invalid credential describe state`

（一）初次 describe 异常回复 → 必须显示「状态未知」、写入按钮禁用、无清除按钮、不发生任何 set/unset（9 组参数化）

1. `describe` 返回空记录（没有该 ref）
2. 该 ref 的记录为 `undefined`
3. 该 ref 的记录为 `null`
4. 该 ref 缺少两个布尔字段（`{}`）
5. `configured` 不是布尔（`'yes'`）
6. `configured` 为 `null`
7. `writable` 缺字段
8. `writable` 不是布尔（`'yes'`）
9. `writable` 为 `null`

每组除状态/按钮断言外，还实际点了「保存外部 Key」、若输入框出现则填入合成串并再次点保存，最后断言 `calls` 为空、DOM 不含合成串、状态仍为「状态未知」。

（二）有效回复正向对照（3 组）

- `{ configured: false, writable: false }` → 「未设置」、写入按钮禁用、无清除按钮、点击不产生任何调用
- `{ configured: true, writable: false }` → 「已设置」、写入按钮禁用、清除按钮存在但禁用、点击不产生任何调用
- `{ configured: false, writable: true }` → 「未设置」、写入按钮可用、可打开输入框

（三）写入成功后 describe 异常回复（2 组参数化）

先给有效 `{ configured: false, writable: true }`，再实际点击打开 → 在 jsdom 里输入合成密码 → 点保存。断言：内存 `set` 恰好一次且值为合成串、无 `unset`、DOM 不含合成串、输入框已卸载；随后 describe 异常时状态为「状态未知」、写入按钮禁用、无清除按钮、提示文案为既有的「外部 Key 已保存，但没能读取当前状态」、无第二次写入。

（四）清除成功后 describe 异常回复（2 组参数化）

先给有效 `{ configured: true, writable: true }`，再实际点击清除。断言：内存 `unset` 恰好一次、无 `set`；随后 describe 异常时状态为「状态未知」、写入按钮禁用、无清除按钮、提示文案为既有的「未确认清除：没能读取当前状态」、界面不含「外部 Key 已清除」。

（五）不涉及的部分

未改任何 generation / busy / race 策略断言（既有回归用例已覆盖）；未引入新功能语义；未放宽任何断言来凑绿。

## 4. 状态：**NOT RUN**

- 本次**没有**运行 vitest / node / python / 任何脚本 / 任何测试 / 任何构建 / 任何探针 / 任何模型调用；**没有**触碰凭据、Keyring、DPAPI、环境变量；**没有**开 GUI；**没有**起子代理；**没有**联网。
- 因此本文件**不声称**任何实际通过/失败结果。上表中的「期望 Root RED」只是对当前源码逻辑的静态推演，不是实测。
- **期望 Root 在当前产品源码上跑出 RED**（根因：`settings.tsx` 的 `info?.configured === true` / `info?.writable !== false` 可选式强转，把缺字段/非布尔当成「未设置 + 可写」；清除后的第二次 describe 只挡「整条记录缺失」，不挡「记录在但字段不合法」）：
  - （一）9 组中凡 `writable` 缺失/非布尔/记录缺失者，当前源码会显示「未设置」而非「状态未知」，写入按钮可用；其中「`writable` 缺字段 + `configured: true`」一组当前源码还会渲染出**可点的**清除按钮，并会真的发起 `unset`。
  - （三）2 组当前源码在写入后会把状态写成「未设置 + 可写」，提示停在「外部 Key 已保存」，且写入按钮仍可用。
  - （四）「记录在但字段不合法」一组当前源码会谎报「外部 Key 已清除」；「整条记录缺失」一组当前源码已正确报「未确认清除：没能读取当前状态」。
  - （二）3 组正向对照在当前源码下应保持 GREEN（用于确认测试不是整体假失败）。
- 建议 Root 执行方式（Root 自行决定，本次未执行）：在 `dsh-ext` 目录按既有 vitest 配置只跑这一个新文件，例如 `vitest run tests/t34-credential-describe-shape-20261031-071304.spec.ts`（若项目已有既定调用方式以项目方式为准）。

## 5. 边界遵守情况

- Git：**全程只读**。未执行 add / commit / rebase / stash / reset / clean / checkout / push；未暂存；未提交；未改锁、未改审批、未扩权。交回是写协调目录文件，不是 Git 提交。
- 已知既有 dirty 状态未被清理或覆盖。
- 未重演旧开工、安装、调研、全量测试；未联系其他聊天；未更换 API。
- 未开第二 writer、未拆任何 writer 锁。
- 实际 Shell 为原生 PowerShell（`pwsh.exe`，`login=false`），未用 bash 包装。
- 执行调用共 3 次（读执行令；读 dossier/approved/既有脚手架摘录；最终 pin 与新文件元数据核对），未超执行令的 3 次上限；文件写入全部用 apply_patch。
- 产品源码与既有测试一字未改；唯一新增文件即第 1 节所列。

## 6. 遗留与待办

- Root 复核：脚手架/清理是否干净、是否覆盖全部要求形状、pin 是否一致，然后**只在旧产品源码上**跑这一个新测试确认 RED。
- 只有在拿到**实测 RED** 之后，才可另下指令改产品；改产品的指令未包含在本次执行令内。
- owner 手工隐私/Key 步骤的可得性单独待办，不作为本次独立单元工作的阻塞项。
- 整条 T34 / 整个项目**未 PASS**；打包 HOLD、整套回归等待显式同步发布。

## 7. 偏离之处

- 无功能性偏离。仅有的过程性说明：该新文件经由 apply_patch 分三步落盘（先建初稿，再整文件替换为「ref 由真实 describe 调用参数取得」的版本，再补齐套件体），最终落盘内容即第 1 节所列字节数与 sha256；期间未触碰任何其它文件。
- 未生成 `docs\plan\evidence\` 下的运行证据（本次不运行，无实测输出可放），证据以 Root 实跑为准。
