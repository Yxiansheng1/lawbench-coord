# A 线正式交回：T34 禁用外部模型幂等修复

## 状态

有界源码修改、单一新测试和证据说明已完成，等待根执行器做 full cumulative
source/all-commands/inverse/type review，再按令运行必要测试。

作者运行严格为 0：没有运行 Node、Python、AST/parser、import、Vitest、测试、类型检查、
构建、GUI、HTTP、模型、SSH、DPAPI 或环境 Key 读取。本交回不宣称新测试、类型检查、
真实 native settings 写入或业务通过。

执行令禁止 Git 写入，故没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout`、`push`，也没有提交 SHA。交回以本文件与仓库证据 README 为准。

## 改动清单

- `D:\Lawbeach\lawbench-A\dsh-ext\ui\settings.tsx`
  - 禁用分支在现有串行队列和 current-target 门内最多调用一次真实 `describe()`。
  - 仅在单一 live `llm-pi-ai`、既有 `value`、普通对象 `providers`、其无自有
    `external` 键时零写入返回 `null`。
  - 返回后重查 Remote、API、代次；已换代时返回 `null`，不写旧目标、不发布旧结果。
  - 缺失、不可调用、拒绝、抛错、畸形、重复、非 live、无效 providers 全部回落原 unset。
  - 启用分支的原 set 参数、转发地址、凭据引用未改；底层设置写拒绝未修、未掩盖。
- `D:\Lawbeach\lawbench-A\dsh-ext\ui\state.ts`
  - `SettingsRemote` 唯一新增可选 `describe?(): Promise<RemoteResult<unknown>>`。
  - 原 `mutate` 签名及其他接口字节未改。
- `D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-disabled-provider-idempotence.spec.ts`
  - 新增唯一授权的行为测试，9 个顶层 `it`，覆盖实时 absence、自有 `undefined/null`、
    原 unset、lawfirm 操作边界、describe 缺失/错误/畸形、原错误可见、启用分支、
    Remote/API/代次竞态和排队新选择。
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DisabledIdempotence-20261030-080958\README.md`
  - 记录前后触发、严格证明条件、限制、源码 SHA、完整命令/非零/偏离台账和下一步。
- 本正式交回件：`D:\Lawbeach\lawbench-coord\A-handback-T34-disabled-idempotence-20261030-080958.md`

未改 `ui/index.tsx`、三份原始 T34 测试、工单集、契约、文档源、构建配置或其他产品文件。

## 源码证据

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `dsh-ext/ui/settings.tsx` | 39756 | `48295283802E0B5FAB824DC004B004C513D28320ED235608450D4D29E37F4FC9` |
| `dsh-ext/ui/state.ts` | 18994 | `D93174F1F1AC88EB6C5552C740774178A636EF8D2EEFF592297750492A0257CB` |
| `dsh-ext/tests/t34-disabled-provider-idempotence.spec.ts` | 10958 | `C81C10D73E138C84220675B6B0AC32015AAEF8EA7DF69037D6B18A87538305B1` |

相对批准快照：

- `settings.tsx`：`+31/-0`
- `state.ts`：`+1/-0`
- 新测试：新文件

未改文件哈希与批准输入仍一致：

- `ui/index.tsx`：`165BDBB32254A7BE826D929CBD4861761CD82A82F2868C3EB5ACD5994606EDF0`
- `tests/t34-provider.spec.ts`：`85AB25A0E3B3B360D35630FD6996187AC8F30E33E2B35379FF93F8082780B716`
- `tests/settings-t34.spec.ts`：`14B9E21982A6EC0D4CF51EBDE716F82C1E91CDDEAC660EB7F3A6A312F94751C3`
- `tests/t34-projection-error.spec.ts`：`6E9733C4E843D8B910C8FAC785CC93836426F72FB629A95D588522AEC5989ED0`

## 静态验证

- 指定 PowerShell 下 `git diff --check -- settings.tsx state.ts`：exit 0。
- 四个最终文件尾随空白扫描：每份 0 行。
- 两份源码相对批准快照的 no-index diff 只显示上述 `+31/-0`、`+1/-0`；
  enabled 分支没有删除或修改。
- 目标 status：两个既有产品文件 `M`，新测试和证据 README 为 `??`。
- 批准输入的既有 dirty 均保留；未清理、暂存或改写。

## 阻碍、非零与偏离

- 首次全树 `git status --short --branch` exit 1：`dsh` 子模块工作树
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied。
  按令未修锁、未扩权、未改 ACL；后续以 `--ignore-submodules=all` 加白名单路径只读核对。
- 多次 `git diff --no-index` 因确实存在预期文件差异返回 1，不是失败。
- 有六次核验命令误把 shell 参数写成被禁止的 `bash`。每次都在执行前被
  `Bash/E_ACCESSDENIED` 拒绝，未执行 bash/cmd，未改文件或状态。其余实际命令均使用
  指定绝对原生 PowerShell、`login=false`。README 保留完整台账。

## 验证证据与下一步

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DisabledIdempotence-20261030-080958\`

1. 根执行器先做 full cumulative source/all-commands/inverse/type review。
2. 静态审查通过后，只跑新测试和必要受影响旧测试；不重演全量、安装、调研或同源绿跑。
3. 再决定必要的新鲜私有构建与受影响 GUI。不能把本卡结果冒充 native/business PASS，
   也不能把 `ConfigEditor.edit` 的底层原因标记为已证明或已修复。
