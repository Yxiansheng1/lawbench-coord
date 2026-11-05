# A 线交回：T18 刑事模板私有案件守卫

## 1. 目标与出处

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-template-guard-order-20261029-094640.md`
- 目的：修正旧 `verify_private_case` 将真实刑事模板创建的三项空目录误判为额外文件的问题。
- 原始实际运行：`CriminalReadingScopeContract-20261029-092051\run-F9lTfU`
- 原始最终状态：B `RuntimeError`；只识别的消息为
  `private source area contains an extra file`。
- 原始 traceback：不存在于现有正式状态中；本交回不补造。
- 真实 `02案件材料` 只读核对：四个 Markdown 加 `会见笔录`、`家属沟通`、`涉案证据`
  三个空普通目录。

主注册表来源已核对：当前 B
`service/lawbench/case/registry.py` 与冻结快照均为 11656 字节，
SHA-256 `05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21`。

## 2. 改动清单与提交 SHA

本运行器明确禁止 Git add/commit/rebase/stash/reset/clean/checkout/push，因此没有提交 SHA；
没有暂存、提交或改写 index。当前只读 HEAD 为
`a23271abee333a9a256fd46a3141da16975c2380`，分支 `line-A`，只读状态显示
`ahead 93, behind 1`。工作区原有大量 dirty 内容全部保留。

新增目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640`

文件：

| 文件 | 字节 | SHA-256 | 说明 |
|---|---:|---|---|
| `registry.py` | 11656 | `05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21` | 冻结主注册表快照，原样 |
| `native-criminal-reading.mts` | 121019 | `2401deb96f10320e80887ae09be9479bca04f6aef6c6d3dc0b74a495399c4f96` | `2401` 整文件逐字节保持 |
| `b-service-criminal-reading.py` | 48308 | `d216a0394488e6d6c90e0a20f373fe43b1d5d62d0e06126f0c85e0673591a9be` | 仅守卫函数及两处调用变化 |
| `literalfixed-inputs.json` | 11707 | `0afd235aee78bd36e3160cfde7838594b1af6400a34814954bde117a9121f08a` | 仅重绑自身 consumer/B 对象 |
| `verify-criminal-template-finite.py` | 15467 | `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d` | 未执行的有限验证脚本 |
| `README.md` | 6096 | `2d01a2f34dc8f7a1e1d806e4f99f3b913382125913aa4e4832dc03cefe426b77` | 合同、命令、限制 |

冻结输入 B 为 46172 字节，
`e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c`。

B 源码 diff 仅有：

1. `verify_private_case` 函数体改为仅关键字 `allow_criminal_template=False` 的精确合同。
2. 旧关停核验改为 `allow_criminal_template=True`。
3. `fixtureInputsUnchanged` 改为 `allow_criminal_template=True`。

初次复制后的调用仍为默认 `False`。函数外除上述两个显式调用外没有源码变化。

`literalfixed-inputs.json` diff 仅有 `consumer.path`、`bService.path/bytes/sha256`。
其余对象未变；没有动态接受新哈希，也没有改 source pins、模板、25 项依赖、private objects、
runtime executables、raw、legacy 或旧运行结果。

## 3. 守卫合同

- 默认：`02案件材料` 必须恰有四个普通 Markdown，字节、SHA-256、mtime 全部一致，且不得有
  其他文件或目录。
- 后置 `True`：只额外接受 `TEMPLATES["criminal"]` 精确派生的三个空普通目录：
  `会见笔录`、`家属沟通`、`涉案证据`。
- 三个目录必须全部存在且为空；缺失、多余、未知文件、嵌套内容、symlink、junction/reparse
  point 均拒绝。
- 三个目录的 reparse 判断是函数内局部 lstat；全局 `ordinary_dir`/`ordinary_file` 未改。
- 四个材料的普通文件、身份、字节、mtime、SHA 检查保留；不允许路径模式或通用目录忽略。
- 没有回退、静默通过、关闭闸门或新的产品策略。

## 4. 验证

### 4.1 作者本轮实际运行

作者只做了只读源码、状态、路径、身份核对：

```powershell
git -c core.fsmonitor=false status --short --branch --ignore-submodules=all
git rev-parse HEAD
git branch --show-current
git diff --no-index --unified=4 -- '<冻结 B>' '<新 B>'
git diff --no-index --unified=2 -- '<冻结清单>' '<新清单>'
Get-FileHash -Algorithm SHA256 -LiteralPath <对象路径>
Get-ChildItem -LiteralPath '<旧运行 02案件材料>'
Get-Content -LiteralPath '<源码和冻结证据>'
```

`git diff --no-index` 返回 1 是存在预期 diff 的非零，不是测试失败。首次仓库根
`git status --short` 因 `modules/dsh` 子模块权限被拒而退出；随后用
`--ignore-submodules=all` 取得只读状态，不修复权限、不改 ACL、不碰子模块。

另有两次只读工具调用误选了 bash shell，运行器在命令执行前以
`Bash/E_ACCESS_DENIED` 退出；没有执行 bash、没有写文件、没有改变工作区。其余命令均使用
执行令指定的原生 PowerShell。该偏差如实记录，不作为交付阻碍。

身份核对结果：

- 当前 B 主注册表 = 冻结 `registry.py` = `05d326…`，11656 字节。
- 冻结/新 MTS = `2401…`，121019 字节。
- reviewed B source pins = 53548 字节，
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。
- 批准输入 = 2706 字节，
  `7514275a52f7ff840fb5499894e6d9083585615a66e72e3bc3670b56ee3b281f`。
- A `dsh-ext/agent/index.ts` = 46547 字节 `40ab…`。
- A `dsh-ext/agent/task-state.ts` = 21264 字节 `fa24…`。

### 4.2 有限脚本

作者没有执行：

```powershell
python 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\verify-criminal-template-finite.py' --root 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640' --report 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\finite-report.json'
```

脚本设计计数：模块导入 2，真实注册表导入 1，`CaseRegistry.open` 1，全新根 1，初始复制 1，
负例 6；reparse 可用时拒绝 6，不可用时拒绝 5 并记
`PASS_WITH_REPARSE_NOT_RUN`。HTTP/model/Key/HTTP server/Agent/Session/child service/build
运行数均设计为 0。实际结果：`finite: NOT_RUN`。

脚本写入面只有 `--root` 下新建的全新 `mkdtemp` 根和显式 `--report` 文件；使用隔离
`home/appdata/TEMP`、现有 B `contracts/case_db.sql`、真实刑事模板，只建立一次私有案件。
没有 create_app、HTTP、Agent、Session、Key、模型、真实案卷或子服务。

### 4.3 未运行

- `finite: NOT_RUN`
- `full model: NOT_RUN`
- 旧 B outbound/getter/metrics：`NOT_RUN`
- 生产 JSONL 重开：`NOT_RUN`
- Python/Node/TypeScript/parser/AST/import/check/test/build：作者执行 0
- 完整 T18、业务质量、法律意见、打包、发版：未通过

## 5. 契约或文档摘要

本包不改 `contracts\`、`docs\src\`、`skills\`、SDK、config、policy/permissions、产品代码或
真实 B 主树。`contracts/formats.md` 已定义刑事模板
`02案件材料/会见笔录、家属沟通、涉案证据`，本次只是让私有验证与既定模板一致。

旧运行和旧报告保持只读未改；没有新增/改写 history、R、events、fake model 或生产 JSONL。

## 6. 自检、遗留与模糊条款

- `finite: NOT_RUN`，所以本交回不声称函数运行绑定、语法或 reparse 负例已实际通过。
- 有限脚本必须在全新自有根运行；若原生 symlink 不可创建，只记录异常类名，不改 ACL/UAC/policy。
- 完整 T18、真实模型、旧 outbound/getter 指标、JSONL 重开仍由 ROOT 后续验证。
- 当前无需要作者自行拍板的模糊条款；若有限脚本运行暴露缺口，应回 ROOT 审定，不扩修。
