# T18 刑事模板私有案件核验包

## 1. 状态

- 作者状态：`SOURCE_READY_FINITE_NOT_RUN`
- Gate 1：`INCOMPLETE`
- 打包：`HOLD`
- 本包不声称完整 T18、业务质量、法律意见或发版通过。

执行令记录的原始 `run-F9lTfU` 在 13 次模型 HTTP 200、真实 LIST/ASK/scope answer、4 次读取、
5 次保存和 source GET 之后，以 B `RuntimeError` 失败。最终状态只保留
`RuntimeError / private source area contains an extra file`；没有原始 traceback，本包不补造。

根因已由只读复核确定：真实刑事 `CaseRegistry.open` 在 `02案件材料` 下创建
`会见笔录`、`家属沟通`、`涉案证据` 三个空普通目录，旧守卫却只接受四个 Markdown 文件。
本包只修正该私有案件守卫，不重跑模型、不执行有限脚本、不做构建。

## 2. 文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `registry.py` | 11656 | `05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21` |
| `native-criminal-reading.mts` | 121019 | `2401deb96f10320e80887ae09be9479bca04f6aef6c6d3dc0b74a495399c4f96` |
| `b-service-criminal-reading.py` | 48308 | `d216a0394488e6d6c90e0a20f373fe43b1d5d62d0e06126f0c85e0673591a9be` |
| `literalfixed-inputs.json` | 11707 | `0afd235aee78bd36e3160cfde7838594b1af6400a34814954bde117a9121f08a` |
| `verify-criminal-template-finite.py` | 15467 | `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d` |

冻结输入 B 副本为 46172 字节，
`e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c`。新 B 副本只改变守卫函数体
和两个显式后置调用；默认初次复制检查、其它 B 函数、导入、路由防火墙、清理、脱敏、最终写入、
模板和 pins 均未改。冻结 MTS 保持 `2401` 整文件逐字节不变。

`literalfixed-inputs.json` 只改了 `consumer` 与 `bService` 两个自身的路径/字节/SHA；其余对象、
source pins、七项批准输入、25 项依赖、4 个 private compiler objects、3 个运行时文件、
459 项 raw、legacy 与旧运行结果均保持。

## 3. 守卫合同

`verify_private_case` 新增仅关键字参数 `allow_criminal_template=False`。

- 初始复制后仍调用默认值：`02案件材料` 必须恰有四个普通 Markdown，字节、SHA-256、mtime 不变，
  且不得有其他文件或目录。
- 只有真实 `CaseRegistry.open(..., template="criminal")` 后的两个关停核验传入 `True`。
- `True` 时只额外接受生产模板常量派生的三个空普通目录：`会见笔录`、`家属沟通`、`涉案证据`。
- 缺失或多余目录、未知文件、嵌套内容、symlink/reparse point、材料身份变化全部拒绝。
- 三个模板目录使用函数内局部 `lstat` 与 `FILE_ATTRIBUTE_REPARSE_POINT` 检查；全局
  `ordinary_dir`、`ordinary_file` 和生产路径策略未改。
- 没有通用目录忽略、路径模式、静默失败、回退、关闭闸门或动态接受新哈希。

## 4. 有限验证脚本

脚本只使用旧冻结 B 副本、新 B 副本和现有 B `lawbench.case.registry.CaseRegistry`，模块导入不会
触发各副本的 `main`。它创建一次全新 `mkdtemp` 根，在隔离的 `home/appdata/TEMP` 下建立一个
私有案件，使用现有 B `contracts/case_db.sql`，复制四个批准 Markdown，然后：

1. 旧和新守卫在初始四文件状态下均通过。
2. 调用真实 `CaseRegistry.open(template="criminal", kind="criminal")` 一次。
3. 从真实 `TEMPLATES["criminal"]` 派生并核对三个精确目录名，确认三个都是空普通目录。
4. 旧守卫抛出精确的 `private source area contains an extra file`；新守卫显式允许后通过。
5. 依次验证意外文件、意外空目录、已知目录嵌套内容、缺失已知目录、篡改 Markdown 均被拒绝；
   每个负例立即用自有字节或精确改名恢复，随后回到四文件加三空目录通过状态。
6. 无 ACL/UAC/策略变更时尝试原生 symlink/reparse 负例；若原生创建不可用，如实记录
   `NOT_RUN:<异常类名>`，报告状态为 `PASS_WITH_REPARSE_NOT_RUN`。

预期计数：模块导入 2，真实注册表导入 1，`CaseRegistry.open` 1，全新根 1，初始复制 1，
负例 6；reparse 原生可用时拒绝 6，不可用时拒绝 5 并明确记录未运行项。HTTP 请求、模型请求、
Key 访问、HTTP 服务、Agent、Session、子服务和构建均为 0。

写入面只有两项：`--root` 下新建的全新 `mkdtemp` 根，以及显式 `--report` 文件。脚本不删除、
不递归清理旧目录，不改旧 run/status/report；只精确移除自己创建的临时负例探针并立即恢复。

PowerShell 命令：

```powershell
python 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\verify-criminal-template-finite.py' --root 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640' --report 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\finite-report.json'
```

本轮作者没有执行这条命令；`finite: NOT_RUN`。

## 5. 冻结与未运行

- reviewed B source pins：346 项、53548 字节、
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。
- 批准备用输入：2706 字节、
  `7514275a52f7ff840fb5499894e6d9083585615a66e72e3bc3670b56ee3b281f`。
- 当前 A 关键对象仍为 `dsh-ext/agent/index.ts` 46547 字节 `40ab…`，
  `dsh-ext/agent/task-state.ts` 21264 字节 `fa24…`。
- 当前 B 主注册表与冻结 `registry.py` 完全相同，11656 字节 `05d3…`。

本轮作者对 Node、Python、TypeScript、解析器、AST、import、check、test、build、HTTP、
model、GUI、SSH、Env/Key、DPAPI、root driver 和进程探测的执行次数均为 0。没有安装、准备
setup、连接其它聊天或更换 API。

未运行：

- `finite: NOT_RUN`
- `full model: NOT_RUN`
- 旧 B outbound/getter/metrics、生产 JSONL 重开：`NOT_RUN`
- 完整 T18、打包、发版：`NOT_RUN`

这些不能由本包的任何通过文字替代。
