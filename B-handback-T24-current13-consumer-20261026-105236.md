# B 线交回：T24 current13 单用途消费者

日期：2026-10-26  
状态：`PREPARED_ROOT_RUN_REQUIRED`  
作者 Python 执行次数：`0`  
当前代码 PASS 宣称：`NONE`

## 交付文件

本次只新建以下两个源码/说明文件：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CurrentFixtureCheck-20261026-105236\current_sentence_fixtures.py
D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CurrentFixtureCheck-20261026-105236\README.md
```

文件身份：

```text
AEE07AEE028D997169DC91B958C682AED5B6614FA554BF3E58DFC63592356DA6  current_sentence_fixtures.py
21F947570E0DD57E2FF9107977E9367D4C913860F5898BD85B18A28441DB4D4B  README.md
```

没有修改任何既有产品、测试、fixture、schema、工单集或文档源文件。目标路径在本次开工时不存在。

## 消费者范围

`current_sentence_fixtures.py` 是单一、纯 fixture 消费者：

- 只按 fixture 行提取 `penalty`、`years`、`months`、`execution_start`、`custody` 传给实际
  `lawbench.calc.sentence.calc`；`custody` 缺省为 `[]`；
- 强制 fixture ID 恰为显式列出的 `S01` 至 `S13`，按序、无重复；
- 用实际 `lawbench.contracts` API 显式以
  `D:\Lawbeach\lawbench-B\contracts` 为根，校验 `#/$defs/args` 和 `#/$defs/result`；
- 仅在原 fixture `expect` 含对应字段时比较 `start`、`end`、`offset_days`、`custody_days`；
- 完整比较有序 milestone `(name, date)` 对；
- 逐项比较每条 `notes_contains` 子串；
- 要求所有返回 basis 和 milestone basis 以源码实际
  `sentence.PENDING`（即现有 `（待律师核实）`）结尾；
- 不生成日期、期望数字、规则或 fixture，不重释法律条文；
- 不导入 `lawbench.tools.sentence`、`pytest`、`t8_helpers`、`Env`、app/lifespan、设置对象、
  模型、网络或 Office 代码。

`lawbench.contracts` 现有模块自身会在加载时导入 `lawbench.config.REPO_ROOT`；消费者没有另行
直接导入 `Config` 或构造设置对象，并在导入后立即调用
`set_contracts_dir(D:\Lawbeach\lawbench-B\contracts)` 钉死 B contracts 根。此既有传递依赖已写入
README 供复核。

成功时 stdout 只有一行 JSON，含 `status=PASS`、13 个 fixture ID、源码/fixture/schema 哈希及
契约/待律师标记已校验字段。有限不匹配时输出一行含 `status=FAIL`、`case_id`、`field`、
expected/actual 的 JSON，并以非零退出；没有 skip、吞错或弱化断言。未知异常不捕获。

脚本先设 `sys.dont_write_bytecode = True`，执行命令另加 `-B`；无输出路径参数，不写任何文件或
数据，不访问网络。

## 既有状态与原始证据复用

观察到的分支头状态：

```text
## line-B...origin/line-B [ahead 141, behind 1]
```

既有 36 个 tracked 修改保持原样；本次路径级 Git status 只显示两个新文件为未跟踪。未执行
add、commit、rebase、stash、reset、clean、checkout 或 push，也未暂存。

既有 tracked dirty 基线：

```text
C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T24Current13-20261026-105236\B-tracked-before.patch
SHA256 5E78AB2AD23D4AE33F388F1FC91AE80CAB4FF3C7831035E4A8E4AD323F853BD1
```

四个冻结输入的当前 SHA256 均与 before 快照逐字一致：

```text
F02D51396A1CB2682DD16518646161A8B3191B99855ECA464D8AA5B410633F2B  service/lawbench/calc/sentence.py
34668D91F14A45CF715425C83D4CC52B59505EE0458C796CBBE1B6AB93D5149C  service/tests/test_sentence.py
D1008DEE1373D58E8F869D95FC7DE62246F0F7BD68094F465910D631B26168C3  tests/fixtures/sentence-cases.json
95455B1D2776B596FA0CE8DEB2606E304B52FCBBE9C0ABC33C3D445DB70E60D7  contracts/tools/case_calc_sentence.schema.json
```

未重跑旧 30/28 源测试、旧 3/3 root、全量 pytest、安装、调研、历史 Git 对象搜索或旧报告准入。

## Root 待执行命令

Root 完成累计源码、setup、命令与正式件复核后，使用 PowerShell 精确执行：

```powershell
C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe -B D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CurrentFixtureCheck-20261026-105236\current_sentence_fixtures.py
```

Root 应私下捕获 stdout/stderr 与退出码。接受条件：stdout 单行 `status=PASS`、
`cases_checked=13`，且退出码为 0；若为 `FAIL` 或非零，按输出中的 case/field 返修或裁决。

## 作者验证栏

实际执行：

- 只读完整读取正式执行令、四个冻结输入、冻结断言源、`contracts.py` 加载依赖、before 快照与
  自身新建文件；
- 用 PowerShell `Get-FileHash` 核对四个输入与 before 一致；
- 用只读、路径限定的 `git status --ignore-submodules=all` 核对 dirty 保全和唯一新增文件；
- 人工只读审阅消费者与 README。

`NOT_RUN`：Python、pytest、parser/AST、selfcheck、collect、任何测试执行、schema 自检、service、
GUI、HTTP、model、network、prepare/serve/probe/build/install。因此本件不宣称当前 13 fixture
通过，也不作法律规则正确性断言，不新增律师门。

## 命令异常记录

- 一次读取按正式令简写落成的 `D:\Lawbeach\lawbench-B\tests\test_sentence.py` 失败，因准确路径
  是 `service\tests\test_sentence.py`；随后按准确路径只读重试成功，无写入。
- 一次 exec 命令误将 shell 参数设为 `bash`，运行器以 `Bash/E_ACCESSDENIED` 拒绝，命令未执行；
  此后所有 exec 均使用指定的原生 PowerShell、`login=false`。
- 未尝试切换 legacy、启动 setup、更改沙箱/审批/ACL、拆 writer 锁或修复 Git index/lock。

## 停止点

B 线工作停在“13-fixture 当前代码验证件已准备、等待 root 执行”这一有限边界。未增加其他业务
检查或框架。打包保持 `HOLD`。
