# B 线交回：T18 圆括号出处 N45 嵌套年份

日期：2026-10-29  
执行者：B 线 DeepSeek 冷执行  
状态：源码与有限验证已准备，等待主编排先审源码/差异，再由受控环境执行有限验证  
Git：未执行任何写操作，未暂存、未提交、未 rebase

## 结论

已修当前 `68456CD5.../parse.py` 的圆括号排斥条件。原先任一半开区间重叠都会排除圆括号
候选；现改为只有六角括号范围完整包住圆括号候选时才排除。这样保留“圆括号片段位于规范
出处内”的原有排除，同时让圆括号包住材料名内合法年份的 N45 输入进入既有圆括号形状判断。
命中后仍只返回原样 E 类，`raw` 不变、`ok=False`，不解析 `items`，不生成结构化出处。

未改契约、正则、`citations.py`、pin、驱动、运行时报告或旧证据。未运行 Python、解析器、
测试、构建、应用、任务、服务、模型或网络，因此本次不宣称测试或模型通过。

## 写入范围

1. `D:\Lawbeach\lawbench-B\service\lawbench\checks\parse.py`
   - 仅改 `find_cites` 圆括号排斥谓词，静态逐行比较相对冻结 `parse.py` 只差两行。
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RoundCitationN45-20261029-104443\verify-round-citation-finite.py`
   - 从冻结输入中的旧有限脚本复制；原数据与断言保留，新增指定 N45 边界。
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RoundCitationN45-20261029-104443\README.md`
   - 范围、静态标识、执行顺序、边界和未做事项。
4. 本交回件。

所有 B 线原有 dirty 内容均未清理、移动、暂存或覆盖。

## 源码变化

位置：`service/lawbench/checks/parse.py` 第 172-174 行附近。

修改前：

```python
if (not after_markdown_link and not _overlaps(span, quotes) and not _overlaps(span, brackets)
```

修改后：

```python
if (not after_markdown_link and not _overlaps(span, quotes)
        and not any(a < i and end <= b for a, b in brackets)
```

第三行 `_is_round_citation_shape(...)` 未改。该谓词对应执行令要求的边界方向：
“圆括号片段位于既有六角范围内部”仍排除；“圆括号包住内部的年份六角范围”不再被误排除。

## 有限验证脚本新增内容

脚本保留旧实际样例、旧快照双文件哈希、`16` 个结构化出处、原有 `8` 个 E 类、原有边界
`7` 项和全部引号/普通日期/法院案号/Markdown/代码块/标题/六角括号断言。

只新增下列 N45 内容：

- 冻结 `68456cd588a983e83362cb5c3799cb20ac505698b384fed4bafa78f266a3c62f` 的
  `parse.py` 哈希校验；原旧快照哈希表未改。
- 通过 `finally` 恢复当前 `lawbench.checks.parse` 后，再使用冻结模块验证全角、半角输入漏报。
- 当前模块对 `（京政发〔2024〕1号 第1段）` 和 `(京政发〔2024〕1号 第1段)`
  必须各返回一条 `raw` 完全相同的 `ok=False` 候选。
- `check_text` 对两项必须各产生一条 `must_fix` E 类，结构化出处数为 `0`。
- `〔京政发〔2024〕1号（试行） 第2行〕` 必须继续通过，且仍为 `1` 个结构化出处。

脚本哈希：
`F4FF562E9A071207234AA82F74D2C17CF077EA12F8F16C96169F5D806985EA89`

## 静态证据

| 对象 | SHA-256 / 状态 |
|---|---|
| 修改前及冻结 `parse.py` | `68456CD588A983E83362CB5C3799CB20AC505698B384FED4BAFA78F266A3C62F` |
| 当前 `parse.py` | `56F6AC85636EB5260DB117067397FE5BAD8CD1376360A1BE8C52B92203B9DB83` |
| `citations.py` 当前 | `6171F0DD8C564CB9FE092A1C3D222217ACAEDAB6BF500BAF04AFEAFECA19B412` |
| 新有限脚本 | `F4FF562E9A071207234AA82F74D2C17CF077EA12F8F16C96169F5D806985EA89` |
| `parse.py` 对冻结输入逐行比较 | 只多出新谓词两行、移除旧重叠谓词一行 |
| `citations.py` 对冻结输入 | 哈希未变 |
| N45 原始探针 | 未改；仍记录旧行为 `observed=[]` |
| 旧有限脚本与旧实际证据 | 未改 |

## 主编排待执行

1. 审查当前 `parse.py`、相对冻结输入的精确差异及新有限脚本。
2. 完成令要求的终端全部命令/源码/差异/`setup finally` 审查。
3. 在冻结依赖与数据源中运行：

```powershell
python docs\plan\evidence\T18\RoundCitationN45-20261029-104443\verify-round-citation-finite.py
```

4. 只有脚本通过后，再按令完成消费者数据 pin 的单行批准复核与重钉。

脚本预期最后为 `PASS`、`n45_old_initial_miss=2`、`n45_new_round_E=2`；
这是待执行预期，不是本次结果。

## 环境阻碍与纪律记录

- 默认 `git status` 递归进入受限 `dsh` 子模块时报 `Permission denied`；改用只读
  `git status --short --branch --ignore-submodules=all` 取得 B 线状态，没有尝试修权限或锁。
- 本会话中共有五次工具调用误填 `bash`，均被 managed 隔离直接拒绝，未执行命令：
  早期三次为路径/目录探测，后两次为证据静态比较/哈希。之后固定原生 `pwsh` 完成只读检查。
- 未修改沙箱、审批、ACL、`index.lock` 或 writer 锁；未扩权。
- 未联系其他聊天，未更换 API，未使用 Key，未启动模型或服务。

## 遗留

有限验证尚未由主编排执行；消费者数据 pin 尚未由主编排批准/重钉。产品最终验证状态仍以
主编排受控执行结果为准。
