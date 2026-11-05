# A 线交回：T34 绑定清单数据修正

状态：`SOURCE_ONLY_DATA_HANDOFF / AUTHOR_RUNTIME_ZERO / GUI_NOT_ADMITTED`

## 结论

已按正式执行令完成有界数据修正：

1. `literal-inputs.json` 已以
   `root-approved-manifest-blueprint.json` 整体替换，仅把 `README.md` 自身行改为
   README 修正后的实际最终字节和 SHA-256。
2. README 只修正三组陈述：`literal-inputs.json` 当前身份表行、五个原始源文件
   未变、根侧 60/55/5 命令计数及旧正式件错误陈述的限定说明。
3. 七份既有源码/辅助文件和 Cordis 绑定源均按批准身份逐字节核验，未再修改。
4. 没有运行任何源码、有限助手、准备/准入/启动/停止、parser、import、test、
   build 或 GUI/HTTP/model/process 探测。

这是数据件交回，不是 GUI 准入，不是产品根因结论，也不是 T34 整条 PASS。

## 最终身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\literal-inputs.json` | 14,100 | `99a517acb3022adf67cbc46c7c319cfe2ff36641470e3466ebbe55c733d70b8b` |
| `docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\README.md` | 8,904 | `e536442391e839bc28a1c9e025b98003965297cbc8ea05279aa388a0df6fa200` |

清单自身仍为 `literal_inputs_self_hash = NOT_SELF_REFERENCED`；其
`handoff_source_files[README.md]` 精确记录上述 README 最终身份。

批准输入身份：

| 输入 | 字节 | SHA-256 |
| --- | ---: | --- |
| `approved-inputs.json` | 2,721 | `e69ca9d3d1777b819bf90cfee5f454e030707ecbac2d5aeee5962173858db1eb` |
| `root-approved-manifest-blueprint.json` | 14,100 | `df2c96a05a7a06989d4e94b69508d30df4167b1512bc9cbbc11de2f8081ec77e` |

## 清单替换范围

逐行比较结果为且仅为以下四个差异行，即 README 行两个旧值与两个新值：

```text
- "bytes": 8573
+ "bytes": 8904
- "sha256": "690dc32b7ba41832c5256ec6a0f3cbe53bf983096f3e9b5866e1f103d5c03a9f"
+ "sha256": "e536442391e839bc28a1c9e025b98003965297cbc8ea05279aa388a0df6fa200"
```

除此之外，清单数据与批准蓝图一致。历史 `baseline`、`primary`、
`sdk_sources_and_built`、`legacy18`、`current_B346` 均保留蓝图原值，没有动态
重算。`current_B346` 仍为 53,548 字节、SHA-256
`7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b`、
`mtime_ns` `1793302647316836800`。

蓝图原样的 `author_nonzeros` 字段仍保留
`accidental_bash_attempts_rejected_before_execution: 7`。该字段没有按根侧原始
命令复核结果重算；根侧采用的历史分类见下文 60/55/5 三栏，二者不得互相覆盖或
冒充当前运行计数。

## 冻结身份

以下七份目录内文件与 Cordis 绑定源均与 `approved-inputs.json` 及蓝图一致：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `binding-finite.mjs` | 2,104 | `6e2ce94e8f8618d572512acd820fc143f0148dcaefdcc6b541e676d40b92f2f5` |
| `entry.py` | 88,654 | `c504d34463f627b5f4632a4faf7fafc8398ac6c3cbcc444a6935f6cb6a0741f0` |
| `frame-classifier-finite.mjs` | 7,048 | `5b6203710b1c1df027c297ba3caa30fe13483504d5fbb565a27f167a0a4bb7dd` |
| `prepare.ps1` | 13,563 | `dfceea89a46b81131dbee5c200443200ac903b7523724ff9fdf77bca939c2287` |
| `projection-observer.mjs` | 18,544 | `0871eff40533f60776742cc20372b7a85b701a940b735f72035d37333c946c6b` |
| `start.ps1` | 76,332 | `462520ce1887478520d9df4b505c76f4431876d07af7e9dcc0d0691994b2bd1d` |
| `stop.ps1` | 7,180 | `3ea70a2886e68fd975a5e4f96b26f111248f4bad6b260414c91c4dc9391ce96d` |
| `dsh\vendor\cordis\lib\index.js` | 60,361 | `6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e` |

目录当前顶层仅上述七份冻结文件以及 `literal-inputs.json`、`README.md` 两份允许
修改的数据/说明文件。没有新增、删除或重命名源文件。

## README 修正

README 已作以下局部修正，其他安全、`once`、有限助手、600 秒上限、清理/finally、
路由、settings、模块 pin 和 `NOT_RUN` 边界保持不变：

1. `literal-inputs.json` 表行不再写旧 13,679 字节/旧 SHA；改为当前根清单、
   八项当前目录自身份，并明确包含 `binding-finite.mjs` 与 60,361 字节
   Cordis `6a9394...c57691e`。
2. `5 个源码持有进程已结束` 已改为 `5 个原始源文件均保持未变`。
3. 根侧原始计数现记为 60 条实际命令、55 条成功、5 条非零；5 条非零恰好为
   3 条 Bash 命令执行前被拒绝和 2 条 PowerShell 解析错误，所有成功 shell
   均使用绝对路径的原生 PowerShell。
4. 旧正式交回件中的“4 条 Bash / 3 条相对 `pwsh.exe`”明确标为错误陈述。
   本 README 只作现行限定和更正，不改写旧正式件、其历史状态或原始输出。

## 命令与计数

根侧已有的完整审计计数按正式令保持为：

```text
actual_commands=60
successful=55
nonzero=5
nonzero_breakdown=Bash_pre_execution_rejected:3, PowerShell_parser_error:2
successful_shell_mode=absolute_native_PowerShell
```

本轮 DeepSeek 数据修复共执行 13 次 shell 命令调用，均 exit 0、没有新增非零：

1. 完整只读正式执行令；
2. 完整读取 `approved-inputs.json`；
3. 完整读取 `root-approved-manifest-blueprint.json`；
4. 读取 README 并核验初始身份；
5. 读取旧清单并核验初始身份；
6. 核验初始九文件及 Cordis 身份；
7. 计算 README 局部修正后的最终身份；
8. 将批准蓝图复制为清单；
9. 核验七份冻结文件及 Cordis 身份；
10. 比较新清单与批准蓝图；
11. 检查 README 四个修正点；
12. 有界列出证据目录顶层文件；
13. 核验批准输入身份及交回路径状态。

另外执行两次 `apply_patch` 局部编辑：README 两处文字修正、清单 README 行身份
替换。未使用 Node、Python、AST、parser、import、check、test、build、GUI、HTTP、
model、process probe、SSH、环境密钥、DPAPI、安全配置或全局配置。

## Runtime 与 Git 边界

```text
author_runtime=0
product_changes=false
git_writes=0
node_or_python_invocations=0
parser_ast_import_check_test_build=0
gui_http_model_process_probes=0
credential_or_dsh_home_storage_reads=0
model_calls=0
installs_or_package_changes=0
```

本轮没有 `git add/commit/rebase/stash/reset/clean/checkout/push`，没有暂存、
扩权、修改沙箱/审批/ACL、拆除 writer 锁或更换 API。当前 PID 按令作为唯一
DeepSeek writer 使用；Git 中的未提交状态按执行令保留给主编排处理。

## NOT_RUN

```text
prepare
admission
start
GUI action
observer capture
classifier runtime check
finite frame classifier runtime check
stop
parser/import/test/type/build
binding-finite runtime
native projection PASS
whole-T34 PASS
```

本交回完成后停止。后续是否另行批准根侧有限验证与一次真实私有观察，由主编排
依据原边界决定；不得把本数据交回解释为已执行或已通过上述任何项目。
