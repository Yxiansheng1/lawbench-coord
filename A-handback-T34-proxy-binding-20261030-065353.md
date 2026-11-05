# A 线 T34 投影绑定顺序修复交回

状态：`SOURCE_ONLY_HANDOFF_READY / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_FINITE_AND_ONE_RUN_REQUIRED`

工单/执行令：`T34-proxy-binding-order-20261030-065353`

仓库基线：`line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`。

本次没有提交 SHA：本运行器被明确限定为 Git 严格只读，未执行
`add/commit/rebase/stash/reset/clean/checkout/push`，也未修锁、扩权、改审批
或拆 writer 锁。交回以本文件和证据目录为准。

## 1. 结论与边界

已完成有界源码修正：旧 observer 的两处 `.sameServiceClass` 不再读取会被
Cordis tracing 包装的 `service.constructor`，改为比较服务实际原型与精确导入
class 的 prototype。原始模块 URL、字节/SHA-256 校验、export 引入和 class
存在性检查全部保留，没有退化为类名、duck typing、catch-all、成功 seed 或私有
symbol 解包。

没有改产品、SDK、Cordis、契约、测试或旧证据。没有运行新 GUI，没有重演旧
开工、安装、调研或全量测试。底层产品拒绝原因仍未捕获，不得据本次源码交回
宣称产品根因、原生投影或 T34 整条 PASS。

已确认的旧现场事实仍为：`settings/rejected` 真实复现，但 observer 未安装，
原因为 `service_class_mismatch`；两个 `hashVerified=true`、
`constructorIdentity=false`、事件数 0。当时 15 个完整 OS 身份、60762 端口和
窗口均已关闭，5 个源码持有进程已结束。

先前从 `withProps` 96 行推导完整原因的结论已撤回。Cordis
`createTraceable()` 第 123-143 行会包装每个字符串键函数属性，包括
`constructor`；`getProto` 没有 trap，因此同真实 class 也可出现旧误判。

## 2. 证据目录

唯一新证据根：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353`

目录当前恰好 9 个文件、0 个子目录、无 `runs`。旧目录
`ProjectionObserver-20261030-061810` 的全部源码、runs 和报告保持不可变。

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `binding-finite.mjs` | 2,104 | `6e2ce94e8f8618d572512acd820fc143f0148dcaefdcc6b541e676d40b92f2f5` |
| `entry.py` | 88,654 | `c504d34463f627b5f4632a4faf7fafc8398ac6c3cbcc444a6935f6cb6a0741f0` |
| `frame-classifier-finite.mjs` | 7,048 | `5b6203710b1c1df027c297ba3caa30fe13483504d5fbb565a27f167a0a4bb7dd` |
| `literal-inputs.json` | 13,679 | `5775e35bd7345ba9e7f80be654d60f4fcc7e292aa6390c8426b6ddf140b86387` |
| `prepare.ps1` | 13,563 | `dfceea89a46b81131dbee5c200443200ac903b7523724ff9fdf77bca939c2287` |
| `projection-observer.mjs` | 18,544 | `0871eff40533f60776742cc20372b7a85b701a940b735f72035d37333c946c6b` |
| `README.md` | 8,573 | `690dc32b7ba41832c5256ec6a0f3cbe53bf983096f3e9b5866e1f103d5c03a9f` |
| `start.ps1` | 76,332 | `462520ce1887478520d9df4b505c76f4431876d07af7e9dcc0d0691994b2bd1d` |
| `stop.ps1` | 7,180 | `3ea70a2886e68fd975a5e4f96b26f111248f4bad6b260414c91c4dc9391ce96d` |

## 3. 逆变换与改动清单

8 个源文件均从旧候选目录机械复制；复制前逐字节/SHA 核验与其批准值一致。
逐行静态比较结果：

| 文件 | 差异行数 | 仅允许差异 |
| --- | ---: | --- |
| `entry.py` | 2 | 旧/新 `EVIDENCE_ROOT` 末段各 1 行 |
| `frame-classifier-finite.mjs` | 2 | 旧/新 `CURRENT_OBSERVER` 各 1 行 |
| `literal-inputs.json` | 0 | 原字节复制 |
| `prepare.ps1` | 2 | 旧/新 `$EvidenceRoot` 各 1 行 |
| `projection-observer.mjs` | 4 | 旧/新两个 `.sameServiceClass` 表达式各 1 行 |
| `start.ps1` | 10 | 旧/新 `$EvidenceRoot`、entry 字节/SHA、observer 字节/SHA 各 1 行 |
| `stop.ps1` | 2 | 旧/新 owned runs 根各 1 行 |
| `README.md` | 重写 | 本次源码交回说明 |

observer 只替换为：

```js
Object.getPrototypeOf(configEditorService) === ConfigEditor.prototype
Object.getPrototypeOf(settingsService) === SettingsForms.prototype
```

start 的新自钉精确对应本次最终 `entry.py` 和 `projection-observer.mjs`：

```powershell
$NativeEntryBytes = 88654
$NativeEntrySha256 = 'c504d34463f627b5f4632a4faf7fafc8398ac6c3cbcc444a6935f6cb6a0741f0'
$ObserverBytes = 18544
$ObserverSha256 = '0871eff40533f60776742cc20372b7a85b701a940b735f72035d37333c946c6b'
```

格式、任务名、T34 run 前缀、600 秒上限、旧断言、清理/finally、循环、路由、
settings、B346、runtime6、private build、resolver、guard、PDF resources、
source case、legacy18、SDK 和源码 case 均保持原值。

## 4. 新有限绑定助手审计

`binding-finite.mjs` 的静态审查结果：

- 只静态导入 `node:assert/strict` 和 `node:fs`。
- 只读取精确 Cordis 路径
  `D:\Lawbeach\lawbench-A\dsh\vendor\cordis\lib\index.js`。
- 先断言 60,361 字节与 SHA-256
  `6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e`，
  校验后才动态导入精确 URL
  `file:///D:/Lawbeach/lawbench-A/dsh/vendor/cordis/lib/index.js`。
- 创建全新 `Context` 和一个真实 `Service`，服务名固定为自有
  `t34-binding-finite-owned-service`。
- 通过 `ctx.get(name,false)` 走实际 tracing，断言旧
  `traced.constructor !== Service`，而
  `Object.getPrototypeOf(traced) === Service.prototype`；raw service 的原型
  仍精确为 `Service.prototype`。
- 一个普通函数通过 raw/traced 调用输出相同，返回对象为 `{ value: 17 }`。
- `ctx.fiber.dispose()` 位于 `finally`；清理后再次以同一自有名称读取，
  断言得到 `undefined`。
- 不实例化 ConfigEditor、Settings 或产品 app/RPC/Agent/Native/Session；
  不访问其他服务、网络、进程、模型、Key、环境凭据或案卷，不写文件。
- 只有全部断言通过后才输出有限 JSON PASS 行；作者没有运行它。

## 5. 静态验证结果

已执行的必要静态核对：

- 批准执行令只读全文：通过。
- `approved-inputs.json` 只读全文：通过。
- Cordis 实际第 110-160 行只读审计：确认第 123-143 行的 function-property
  包装行为。
- Cordis 实际文件：60,361 字节，SHA-256 精确匹配批准值。
- 旧 8 个候选文件：字节/SHA 全部匹配；本交回前再次核对，8/8 未变。
- 57 个既有 tracked dirty 文件：字节/SHA 全部匹配批准基线，0 mismatch。
- B346：53,548 字节，
  `7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b`。
- 目标目录：9 文件、0 子目录、`runs` 不存在。
- Git 只读状态只显示整个新证据目录为 `??`；没有 Git 写入。

## 6. 实际命令

绝大多数执行使用显式绝对原生 shell；下列偏差单独保留记录：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

主要实际命令如下；路径内重复的逐文件读取、哈希、`Select-String` 和
`Compare-Object` 调用均按同一字面路径执行，没有运行 `.ps1`、`.py` 或 `.mjs`：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-proxy-binding-order-20261030-065353.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProxyBindingInput-20261030-065353\approved-inputs.json'
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\projection-observer.mjs'
$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vendor\cordis\lib\index.js'; for ($i = 109; $i -lt 160; $i++) { '{0,4}: {1}' -f ($i + 1), $lines[$i] }
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vendor\cordis\lib\index.js'
Get-ChildItem -Recurse -File -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810'
git -c safe.directory='D:/Lawbeach/lawbench-A' status --porcelain=v1 --untracked-files=no --ignore-submodules=all
git -c safe.directory='D:/Lawbeach/lawbench-A' status --porcelain=v1 --untracked-files=normal --ignore-submodules=all -- 'docs/plan/evidence/T34/ProjectionBindingFix-20261030-065353'
git -c safe.directory='D:/Lawbeach/lawbench-A' rev-parse HEAD
git -c safe.directory='D:/Lawbeach/lawbench-A' branch --show-current
New-Item -ItemType Directory -Path 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353'
Copy-Item -LiteralPath '<verified-old-source>' -Destination '<new-evidence-root>\<same-name>'
Compare-Object (Get-Content -LiteralPath '<old-file>') (Get-Content -LiteralPath '<new-file>')
$rows = foreach ($file in Get-ChildItem -LiteralPath '<new-evidence-root>' -File | Sort-Object Name) { [pscustomobject]@{ Name=$file.Name; Bytes=$file.Length; Sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant() } }
```

源码和 README 的具体修改由 `apply_patch` 完成，没有使用
`Set-Content`、重定向或 `cat` 写文件。

阻碍记录：四条只读命令把 shell 参数误填为 `bash`，均在执行前被运行器以
`E_ACCESSDENIED` 拒绝，没有命令效果；三条只读命令误用相对 `pwsh.exe`
（`Get-Content`、目录清单、最终文件集合核对），均成功但未改文件。未为此
启动 setup、切换 legacy、改沙箱/审批/ACL 或拆 writer 锁。上述工具调用错误
不影响最终文件身份或静态核对。

## 7. 根侧唯一接续顺序

根必须先全量审阅本目录、上述逆变换、typed output、setup/finally/cleanup、
所有写面、source/profile identity、B346 和字面 pins，再执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\binding-finite.mjs'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\frame-classifier-finite.mjs'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\stop.ps1' -RunRoot '<runRoot>'
```

`<runRoot>` 必须直接位于新证据根 `runs` 下，名称保持
`T34-private-projection-observer-YYYYMMDD-HHMMSS`，不得复用旧 root。

根必须先让 `binding-finite.mjs` 通过，再做一次新私有 GUI 观察；不得为刷绿
重复真实 GUI。运行后核对 owned OS 身份、端口、窗口和 observer 输出，再关闭
全部资源。若 observer 只抓到 `settings/rejected`，如实交回；只有在实际捕获
后才可描述产品原因。任何绑定失败应保留现场并以 `BLOCKED/NOT_RUN` 回报。

## 8. 非零与未运行

`author_runtime=0`

`product_changes=0`

`sdk_changes=0`

`cordis_changes=0`

`model_calls=0`

`http_calls=0`

`gui_actions=0`

`tool_test_build_import_calls=0`

`git_writes=0`

`installs_or_package_changes=0`

`credential_reads=0`

`old_evidence_rewrites=0`

`NOT_RUN`：`binding-finite.mjs`、`frame-classifier-finite.mjs`、prepare、
admission、start、GUI 设置动作、observer capture、stop、任何 parser/import/
test/type/build、runtime6、395、模型、私钥、真实案卷、原生投影 PASS 和整条
T34 PASS。

旧 `finitePASS` 只能复用给未改的旧分类器函数事实，不能复用为本次绑定、原生
观察或整条 T34 的成功证据。

## 9. 遗留问题

唯一未完成项是根侧全量审阅、两个有限助手实际运行、新私有 GUI 的一次真实
观察，以及关闭后的最终交叉判读。作者在此源码交回后停止。
