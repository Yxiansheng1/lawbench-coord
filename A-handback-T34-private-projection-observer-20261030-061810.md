# A 线交回：T34 私有投影失败观察器

状态：`SOURCE_ONLY_HANDOFF_READY_FOR_ROOT_STATIC_AUDIT`

结论：有界观察源码已完成，可用于根侧审阅后的一次受控真实诊断。作者运行面仍为
0；没有证明 T34 底层根因，也没有宣称外部模型禁用投影、整条 T34 或产品 PASS。

## 唯一交付面

源码与说明目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810`

目录内恰好七个允许文件：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13561 | `d280ca31609865f91b60c02b1cb531c506673b26e9743b3fdda5ffe8c6dfa9bc` |
| `start.ps1` | 76348 | `670d044e6667e7a8bb4f2e71833a5d47f25ea0f41a7cc3591270652501dd26ce` |
| `stop.ps1` | 7178 | `d52ed07f1ec6bf0ef116c1dab069647c042e5f80751e579bc0872e7ccfed932d` |
| `entry.py` | 88670 | `369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980` |
| `projection-observer.mjs` | 17491 | `8b53efdfd648d09d5a009071383800a7a7fc37ffd7230e0935e85878e5d59919` |
| `README.md` | 10289 | `0bc9287ce13020c88248f22891d96463cc1c6755e630a43e7993df848e5900bc` |
| `literal-inputs.json` | 13154 | `36ec89b2ea04bd1ab7e94b78f302e5cf69bab9445d32525065e14714a3538c0f` |

本次特别令指定的 README 和本正式交回件承担交付说明职责；未另建
`交付说明.md`。没有改工单集、产品源码、契约、测试、Skills、SDK、旧证据或
旧 served root。

## 既有状态与 dirty 保全

- A 树 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`。
- 分支状态：`line-A...origin/line-A [ahead 93, behind 1]`。
- 普通只读 `git status` 在
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 处被权限拒绝；
  未尝试修锁、扩权、改 ACL、setup 或切换 legacy。
- 使用 `git status --short --branch --ignore-submodules=all` 与开工前
  `tracked-dirty-before.txt` 机械比较：开工前 tracked modified 57 条，当前
  57 条，差异 0。
- 未执行任何 Git 写入：无 add、commit、rebase、stash、reset、clean、
  checkout 或 push。
- 五个批准蓝图当前字节/SHA-256 与 `approved-inputs.json` 一字不差。
- `config-editor`、`settings`、`settings-controller` 三个已构建模块当前 hash
  与批准输入完全一致；bundle project 中对应副本也同为批准 hash。

## 修改与逆变换

四个运行文件均由批准快照机械复制后再最小修改。逆变换回 `.before` 对应路径、
format、run 名和观察接线后，其余字节与快照相同。

### prepare.ps1

仅改变 `EvidenceRoot`、T34 prepared format、默认 run 名/正则和 manifest task。
源案件五文件、目录清单、source tree digest、复制逻辑、settings/daily marker、
fresh root inventory 及原有断言保持快照。

### entry.py

仅改变 `EVIDENCE_ROOT`、prepared/admission format 和 run 名正则。原 CaseRegistry
准入、只读 HTTP firewall、loopback 原生服务、私有 fake key stub、只读最终
session/case/SQLite 观察、关闭与清理逻辑保持快照。

### start.ps1

仅改变独立 T34 根、`entry.py`/observer 自钉、format、任务名、preflight 输出
fresh 断言，并在原冻结 suffix 中、法律 UI replacement 之前增加唯一
`t34-projection-observer` Cordis 行。

观察器使用本目录 `.mjs` 的精确 file URL；stateDir/outputPath 由本 run 明文
生成；两个生产模块 URL 使用该 profile/project 的
`createRequire(baseUrl).resolve(...)`。suffix 仍执行原
`prefix bytes + suffix bytes = overlay bytes` 全字节检查，并新增 observe row、
file URL、stateDir、outputPath 的逐字唯一断言。

以下冻结运行面保持原逻辑：随机 owned loopback、lifespan off、OCR off、
Retainer off、fake in-memory B key、credentials disabled、refuse outbound、
固定 proxy、private profile、24 staged pins、private native 三模块、E50/resolver/
guard/PDF 五资源、600 秒上限、exact PID/exe/UTC birth、端口关闭、旧路由、
preset 替换和 finally cleanup。

### stop.ps1

仅改变允许 runs 根、T34 run 正则和错误文字。exact identity、45 秒 stop report
等待、端口关闭检查和 fallback survivor 判据保持快照。

## 观察器设计

`projection-observer.mjs` 声明：

```js
export const inject = ['configEditor', 'settings']
```

Cordis 会等待两个真实服务。插件从生产 package resolution 得到精确 file URL，
在 import 前重算并对照批准 hash：

- `@deepseek-ai/dsh-config-editor`：
  `bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5`
- `@deepseek-ai/dsh-settings`：
  `9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136`

插件还要求：

```text
ctx.configEditor.constructor === ConfigEditor
ctx.settings.constructor === SettingsForms
```

任一 hash、export、服务或构造器不匹配，均不安装 wrapper，只写固定
`bindingReason`。这证明实际服务不是平行副本；不接受运行时新 lib。

绑定后仅包装：

- `ConfigEditor.prototype.edit`
- `SettingsForms.prototype.mutate`

每次调用用 `Reflect.apply(original, this, arguments)` 执行原实现一次。成功原值
原样返回；同步 throw 或 Promise reject 重抛同一个 error object。观察逻辑不
重试、不吞产品错误、不伪造成功，也不改变原方法和参数。

观察范围仅为 `llm-pi-ai`、有限 op 和已知 path segment；不复制 `set` value。
输出不含 message/details/stack/config/credential/material/prompt/response 原文。

## 输出契约

唯一文件：

`<runRoot>\gui\state\projection-observer.json`

插件要求绝对路径、文件名精确、位于同一 stateDir、路径组件及文件不是
reparse/symlink，并拒绝覆盖已有文件。上限为 8 条事件、16 KiB UTF-8 JSON。

固定错误枚举：

- `name`：`Error/TypeError/SyntaxError/AggregateError/ZodError/OTHER`
- `code`、`errno`：
  `EACCES/EPERM/ENOENT/EBUSY/EINVAL/EBADF/ESTALE/ETIMEDOUT/OTHER`
- `category`：
  `entry_unavailable/entry_changed/plugin_inactive/profile_not_sequence/`
  `overlay_override/no_configurable_entry/no_volatile_fields/`
  `nonvolatile_path/revision_conflict/other`

Zod issue code 使用固定集；path segment 仅已知字面键，数字下标固定为
`INDEX`，未知为 `OTHER`。module stack frame 仅允许以下三个 label 的数值
line/column：

- `@deepseek-ai/dsh-config-editor/lib/index.js`
- `@deepseek-ai/dsh-settings/lib/index.js`
- `@deepseek-ai/dsh-api-settings-controller/lib/index.js`

输出记录 fixed module identity/hash、`hashVerified`、`sameServiceClass`、
targeted installed flag 和 call count；`acceptanceProof` 恒为 `false`。
观察 fs 失败不改变产品返回/拒绝结果；文件缺失或 `installed=false` 不得声称
观察成功。

## 清理

disposer 逆序检查 prototype descriptor；仅当当前值仍是本插件安装的 wrapper
时恢复原 descriptor。它不改 service 实例、其他 Cordis context、其他方法或
外部窗口。启动若在第一个 wrapper 后失败，会立即恢复先前 wrapper。

## 根侧执行命令

根必须先完成源码、全部 diff、typed output、setup/finally、全部写面、source
case/profile identity、模块 pins 和旧资源审阅，再执行：

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\stop.ps1' -RunRoot '<runRoot>'
```

`<runRoot>` 必须直接位于本目录 `runs` 下，名为
`T34-private-projection-observer-YYYYMMDD-HHMMSS`。不得复用旧 prepared、
admission、served root 或事件。

## 本轮实际验证

已做且仅做静态/文件系统验证：

1. 核对 HEAD 与 dirty before/after，57 条 tracked modified 差异 0。
2. 核对五蓝图、三生产模块及 project 三副本 hash。
3. 用 `git diff --no-index` 审阅 prepare/entry/stop/start 全部差异。
4. 搜索旧 run 正则和新 run 身份，未发现旧根残留。
5. 搜索 observer 危险写面、网络、环境变量、console 和原始错误落盘，仅命中
   唯一输出文件的两处同步写与内存错误 message 分类。
6. 生成 literal inputs，并记录最终自钉 hash。

没有做 parser/AST、JSON 反序列化、PowerShell/Python/Node 语法检查、import、
单元/类型/构建检查或任何目标运行时。

## 非零与 NOT_RUN

- `author_runtime=0`
- `product_changes=false`
- `model_calls=0`
- `http_calls=0`
- `gui_actions=0`
- `test_build_type_import_calls=0`
- `git_writes=0`
- `package_install_or_update=0`
- `credential_reads=0`
- `old_evidence_rewrites=0`

`NOT_RUN`：prepare、admission、start、GUI 设置动作、observer capture、safe
classifier 实测、stop、parser/import/test/type/build、runtime6、395、模型、
私钥、真实案卷、底层投影 PASS 和 whole-T34 PASS。

## 阻碍与已知限制

1. 普通 Git status 仍因 `dsh` 子模块 worktree 元数据权限被拒绝；已用
   `--ignore-submodules=all` 做 tracked dirty 对照，未修锁或扩权。
2. 五条只读检索/diff 命令误填 `bash`，均在执行前由运行器以
   `E_ACCESSDENIED` 拒绝；没有执行 Bash、没有写文件或改变目标状态。其余命令
   使用指定绝对原生 PowerShell、`login=false`。
3. 作者不运行 parser 或运行时，因此源码仍须根本轮全审；本交回不声称已语法
   通过。
4. 插件若因生产 package 副本身份不同而拒绝绑定，这是安全 `BLOCKED` 现场，
   不应以复制模块、放宽 resolver 或替换服务绕过。
5. 即使根侧抓到精确错误，也只增加根因证据；是否修复产品须另行裁定。

## 根侧下一步

审阅通过后，只启动一个 fresh private run，执行一次原 T34 禁用投影动作，保存
真实 GUI/request/process/stop 证据及唯一 observer 文件；任何成功 capture 都
继续标为底层失败现场，不写成产品 PASS。作者在此停止。
