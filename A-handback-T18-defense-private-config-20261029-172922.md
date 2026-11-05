# A 线交回：辩护意见必问能力私有构建配置

日期：2026-10-29  
状态：`READY_FOR_ROOT_REVIEW / CONFIG_NOT_IMPORTED / BUILD_NOT_ADMITTED / RUNTIME0`  
项目状态：`Gate 1 INCOMPLETE / full T18 INCOMPLETE / project INCOMPLETE / Packaging HOLD`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 交付冻结构建器、只含两项数据变化的私有构建配置和准备说明；没有执行构建或重跑旧测试。 |
| 目标是什么 | 给 ROOT 一次全新 25 文件私有开发编译准备可反审输入；编译、独立验收和消费者接线仍是后续工作。 |
| 在等什么 | 等 ROOT 完成全部命令、整文件配置反演、源码和冻结构建器清理复核，并明确构建准入；准入后再执行一次全新编译。 |
| 卡在哪 | 本单只获数据源准备权限，没有导入、编译、运行或模型验证权限；原始真实问答失败原因仍未查清，不能从已有单测推出业务通过。 |

## 依据与验证

唯一执行入口：

`D:\Lawbeach\lawbench-coord\A-T18-defense-private-config-order-20261029-172922.md`

冻结输入目录：

`D:\Lawbeach\lawbench-coord\T18DefensePrivateConfigInput-20261029-172922\`

| 输入文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20483 | `dc64b64cc46e7bd274bb7dc4a00563dfc45bd82211967af4a9b1b3b7ff9c2cf2` |
| `build-approved-inputs.json` | 21799 | `6d2b787fbe0b0214ba3b2fdc21a7c8fb111f13b3f83bbb4c06051909efbc1553` |

准备目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DefenseQuestionPrivateBuild-20261029-172922\`

| 交付文件 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 与冻结输入逐字节相同 |
| `build-config.mjs` | 20471 | `36e85da4c40f8e6c44baa266111f76a1b5c78dccb8e75ac4e69069e1114670a2` | 仅两项批准数据变化 |
| `README.md` | 4302 | `d2c218a55ed7706db4522feaadb8525cce78c50ed1bf634df9a0b87220392a88` | 记录身份、复用证据和后续边界 |
| 本交回件 | 落盘后核对 | 落盘后核对 | 正式交回 |

目录实测为 3 个文件、0 个子目录、0 个 `private-output-*`。没有生成编译产物。

配置相对输入只改两处：

1. `EVIDENCE_ROOT` 指向本准备目录。
2. `lawbench-agent-source` 从 4 文件、75605 字节、
   `fe13bc5a86d899dd087969f3abc9f28eaa3fa99fed4669fc478bb12bc496196f`
   改为 4 文件、75754 字节、
   `95d0b63bf2ac846e9f1cac6aedbaac47a4708268ed0baef74b34dfd2dd9b1231`。

新值逐字取自批准的输入文件，没有动态重算树摘要或升级依赖。把两项旧值替换成新值后，
结果与目标文件逐字节一致；撤销两项后，结果与输入文件逐字节一致。新路径和新数据块
各出现 1 次，旧路径和旧数据块均残留 0 次。因此其余 17 棵树、39 个文件、14 个引用、
53 个文件/引用身份、Node/tsx、25 个预期输出映射、固定路径、构建开关和 loader 保持
输入字节。

当前产品与测试身份仍为批准值：

| 对象 | 字节 | SHA-256 |
| --- | ---: | --- |
| `dsh-ext\agent\index.ts` | 46958 | `442b67e8573f93647c1eac00e4ed810f3820bca7dcd8c4c515287aa94d81d3b1` |
| `dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| `dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts` | 20288 | `7fff83589539e15b622218d34a3053d0c0bd7748d02d2cf12075a120d2dba1c8` |

前序结果按执行令原文复用，没有重跑：5 个聚焦 UNIT 测试通过，耗时 6.1555407 秒；
类型检查退出 0，耗时 8.9745187 秒；作者运行器为 0；5 个已验证 OS 进程自然消失，
没有强制终止。原始真实运行仍为 32 次模型 HTTP 200、30 次提问错误、0 个答案、
1 次保存，且保存失败；这些证据保持原样，不因本配置或单测通过而改写。

限定路径 Git 只读检查显示：当前产品与测试仍是既有修改/未跟踪状态，准备目录只有三个
新增未跟踪文件。没有暂存、提交或重写历史，所以没有提交 SHA。

## 未做与降级

- Node、Python、TypeScript、TSX、AST、解析器、导入、类型检查、测试、构建、安装和打包
  执行次数均为 0。
- HTTP、模型、GUI、SSH、环境变量和 Key/DPAPI 执行次数均为 0。
- 没有创建或启动编译输出，没有运行任何旧编译件，也没有把旧结果冒充本次源码结果。
- 没有修改产品、测试、fixture、消费者、Skill、契约、运行时、SDK、默认库、旧编译件、
  权限、锁、审批或全局设置。
- 没有读取凭据或真实案卷，协调目录没有写机密。

## 过程偏差

- 不带 `--ignore-submodules=all` 的 Git 状态检查被子模块工作区权限拒绝；随后只使用
  限定路径和忽略子模块的只读检查，未尝试修权限、ACL 或锁。
- 首次整文件反演脚本按 CRLF 拼接两行，与实际 LF 不一致，返回不一致；改用实际换行
  重跑后，正向和反向均逐字节一致，期间没有改写文件。
- 一条限定路径的 Git 状态命令误填为 Bash，运行器在启动前以
  `Bash/E_ACCESS_DENIED` 拒绝，没有执行命令或改文件；随后以指定绝对原生 PowerShell
  `login=false` 重跑成功。

## 下一步建议

当前状态是“构建输入已备好，尚未准入”。ROOT 应先复核本交回全部命令和写入面、整文件
配置反演、当前源码及冻结构建器清理状态；复核通过后，用本目录冻结构建器执行一次
全新的 25 文件私有开发编译，并独立验收恰好 25 个输出。输出验收后再按精确消费者
字面运行时 pin 和被动接线 Schema 元数据另单处理，消费者运行须另行批准。

不得使用安装器或打包流程，不得运行旧 `896f` 编译件作为新的运行门，不得启动旧编译件
冒充本次新能力，不得进入 UI，不得改默认库、安装目录或删除输出。

Response ID：`A-T18-defense-private-config-20261029-172922`  
Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T18-defense-private-config-20261029-172922.md`
