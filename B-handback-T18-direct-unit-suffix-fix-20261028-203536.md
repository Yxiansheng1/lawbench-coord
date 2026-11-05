# T18 直接双比率单位后缀返修交回

状态：`NOTRUN`。两处正则首段字面量和指定交回件已落盘；作者侧只做了只读静态核验。未运行测试、Python、Node、AST、解析、导入、构建、HTTP、模型或真实工作流。新源码没有运行绿证据，不能沿用上一版源码的通过读数。Gate 1、完整 T18 和项目整体仍未完成，Packaging 维持 `HOLD`。

## 执行入口与开工状态

正式执行令：

`D:\Lawbeach\lawbench-coord\B-T18-direct-unit-suffix-fix-order-20261028-203536.md`

开工输入目录：

`D:\Lawbeach\lawbench-coord\T18DirectUnitSuffixInput-20261028-203536\`

执行令把该路径写成文件形式，但实际入口是同名目录；其中的 `drafts.py`、`test.py`、`root-static-review.json`、`previous-formal.md` 和 `B-dirty-before.txt` 均已只读核对。

上一版源码与输入快照逐字节一致：

- `service\lawbench\tools\drafts.py`
- SHA-256：`6F7198F626BAD4737AD7F4FDF10F5A5CCB11F4F7CF26C7702617CD5995E6E863`

既有专项测试与输入快照逐字节一致，且执行令指定的哈希成立：

- `service\tests\t18_rate_ratio_20261028_194123.py`
- SHA-256：`6A2B80C38586817A45F68116CD0A2538BD00A7D7ABBA2511A8C012CBA04DFC63`
- 静态只读核对为 8 个既有测试方法，包括真实 20 倍句、中文二十倍、改正为 2 倍、反向主体、括号形式和非断言负例。

## 根因

`_segment_rates()` 记录的费率 `end` 停在分子末尾，真实句中的 `/日` 仍在费率区间之外。旧版：

- `_DIRECT_RATIO_BRIDGE_RE.fullmatch(segment, rates[0]["end"], rates[1]["start"])` 从费率末尾直接期待空白、可选右括号和“是/为”，无法消费第一个 `/日`；
- `_DIRECT_RATIO_CLAIM_RE.match(segment, rates[1]["end"])` 从第二个费率末尾直接期待空白、可选右括号和“的”，无法消费第二个 `/日`。

因此真实句：

`逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。`

仍会在直接句式匹配处跳过，无法到达既有精确算术检查。这是从实际偏移契约和源码得到的静态结论，不是本轮运行红证据。

## 有界修改

只改 `D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py` 中两个既有正则的首段字面量：

```python
_DIRECT_RATIO_BRIDGE_RE = re.compile(
    r"\s*(?:(?:/|每)\s*[日月年]\s*)?[）)]?\s*(?:是|为)\s*"
    r"(?:[^（）()，,。；;！!？?\n]{1,80}[（(])?\s*"
)
_DIRECT_RATIO_CLAIM_RE = re.compile(
    r"\s*(?:(?:/|每)\s*[日月年]\s*)?[）)]?\s*的\s*"
    r"(?P<multiple>[〇零一二两三四五六七八九十]{1,8}|\d{1,6}(?:\.\d{1,6})?)\s*倍"
)
```

可选后缀只接受 `_rate_unit()` 已支持的 `/` 或“每”加日/月/年，并允许既有空白口径；后缀位于可选右括号之前。未加入全角斜杠、新 helper、新常量或全文件正则重写。

`_rate_unit()`、单位一致性判断、索引方向、算术、主体语法、长度、标点、引文、否定、假设、单位和所有保存/API 错误边界均未改。目标测试文件未改动，既有断言和红例未删除或削弱。

## 静态核验

- 输入快照与上一版源码哈希一致。
- `git diff --no-index` 显示相对上一版仅两个正则首段的删除/新增，其他源码行无差异。
- 最终 `drafts.py` SHA-256：`816869ED16178A3243B300455E5A509F139272437B11A7B50BB1421F01B22FA2`
- 最终专项测试 SHA-256：`6A2B80C38586817A45F68116CD0A2538BD00A7D7ABBA2511A8C012CBA04DFC63`
- `git --no-optional-locks diff --check -- service/lawbench/tools/drafts.py` 无输出。
- 目标源码和测试的尾随空白扫描均无命中。
- 开工 dirty 快照为 5615 行；修改后使用 `git status --short --untracked-files=all --ignore-submodules=all` 得到同样 5615 行，集合差异为 0。既有 dirty 未清理、覆盖、暂存或提交。

## 阻断与偏差

- 初始普通 `git status --short --untracked-files=all` 在只读子模块 `dsh` 的 `.git` 路径处报 `Permission denied`。按要求未修权限、未改 ACL、未扩权、未动锁；后续只读状态统一使用 `--ignore-submodules=all`，并以开工 dirty 快照比较确认无其他状态变化。
- 最近一次完整状态输出还遇到既有长路径目录警告；未清理或重排这些用户产物。
- 本轮没有使用 Bash、cmd 包装器或其他 shell；所有命令均使用指定原生 `pwsh.exe` 且 `login=false`。
- 未执行任何 Git 写操作，包括 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 主编排待办

请主编排按执行令在完整审阅后执行：

1. 对最终源码做全量字节逆向核验、8 个既有有限专项方法和受影响的 12 项有限回归；
2. 通过后刷新批准的准确 pin；
3. 以原预算和同一实际工作流运行一次，验证真实模型句在写前被拒绝、收到准确 2 倍反馈、改正后保存；
4. 只有新一轮真实运行通过，才可讨论后续门禁。

本文件只记录作者侧静态完成状态，不构成测试通过、真实工作流通过或发版结论。
