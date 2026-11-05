# B line handback: full-regression narrow fixes

状态：**源码与测试修正已落盘，由 B 作者完成；未运行、未取得新绿证、未宣称全量通过。**

执行身份：`deepseek-v4.1-flash-1017`，工作目录 `D:\Lawbeach\lawbench-B`。本轮遵守
只读 Git 边界，没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout` 或 `push`，因此没有提交 SHA。没有联系其他聊天、启动子代理、使用模型、
网络、Key、凭据或产品运行入口。

## 1. 既有实际状态

- 最近一次实际服务全量结果仍为：1373 项，`1301 PASS / 22 FAIL / 8 ERROR /
  42 SKIP`；其中 23 项有 `SafetyBlocked` 栈，另有 7 个非 `SafetyBlocked` 行。
- 原 `test_x8_too_long_original_registered_as_failed` 是实际 RED：长路径原件被登记成
  “不可读”，而不是 `path_too_long`；同时该用例要求非零 SHA。
- 原始 XLSX 无缓存公式的正确显示是
  `| 4 | 已收利息 | =SUM(流水!C4:C5,流水!C7) | 公式单元格，文件未存计算结果 |`，
  不能伪造 `2200` 或要求重算。
- 当前材料读取以持久 `text_path` 为准；旧索引没有该字段时才按 `rel_path` 推导。

正式令指定的
`D:\Lawbeach\lawbench-coord\FullRegressionBNarrowFixInput-20261031-141226\source-before.json`
不存在。实际输入目录为 `0-before.txt`、`1-before.txt`、`2-before.txt`，分别逐字节等于
修改前的 `materials.py`、`test_tools.py`、`test_t3_rework.py`；本轮以这三份实际快照
为基线，未改输入快照。

## 2. 文件改动

| 文件 | 有界改动 |
|---|---|
| `service/lawbench/case/materials.py` | 仅在 `gate.resolve_original` 成功后，把返回的 `checked` 转成 `pathlib.Path(_long_path(os.fspath(checked)))`，再执行原有 `stat` 和 SHA256。安全闸门、canonical 路径、异常处理和模块其他字节不变。 |
| `service/tests/test_t3_rework.py` | 保留原有逐字段值与 profile/office 断言；键集精确改为 `set(ex) | {"external_llm"}`，并断言默认值与当前 `EXTERNAL_LLM_DEFAULT` 的独立深拷贝一致。 |
| `service/tests/test_t3_rework.py` | 变更行数：上述 import 与 R13 断言，未改样例、schema 或其他 R13 测试。 |
| `service/tests/test_tools.py` | 单元格用例保留行/工作表断言，改为精确断言无缓存公式行和“文件未存计算结果”标记。 |
| `service/tests/test_tools.py` | 原 `rel_path` 被篡改为工作区用例只移除该材料的 `text_path`，成为明确的旧索引兼容分支；新增非法现代 `text_path` 拒绝用例，以及合法持久 `text_path` 在虚拟 `rel_path` 改名后仍返回原正文的正向用例。每个用例均恢复原 index。 |
| `docs/plan/evidence/FullRegression/BNarrowFixRunner-20261031-141226/bootstrap.py` | 从 `SafetyLoggingFix-20261031-133032/bootstrap.py` 整文件复制，仅将最后的 `str(tests_dir)` 替换为四个固定选择项；其余安全 guard、路径、环境、日志、JUnit、清理和 `full_service_pass_claimed: false` 保持不变。 |
| `docs/plan/evidence/FullRegression/BNarrowFixRunner-20261031-141226/README.md` | 说明该 runner 是聚焦选择，不是全量结果；保留 T37 排除和“不得宣称全量 PASS”的限制。 |

runner 固定选择：

```text
tests/test_tools.py
tests/test_t3_rework.py::test_r13_defaults_match_example
tests/test_t5_rework.py::test_x8_too_long_original_registered_as_failed
tests/test_t5_rework.py::test_x8_unreadable_folder_keeps_old_entries
```

## 3. 本次只读静态核验

- 三份实际 `*-before.txt` 与修改前目标源码的 SHA256 完全一致。
- `materials.py` 与基线做精确字符串替换反证，结果等于当前文件：全文件只有一行插入。
- `test_t3_rework.py`、`test_tools.py` 与基线做精确替换/插入反证，结果等于当前文件：
  没有列出之外的文本变化。
- runner 与 `SafetyLoggingFix` 基线做精确单段替换反证，结果逐字符一致；唯一差异为
  上述“一项选择”变成“四项选择”。
- 未执行 pytest、collection、import、语法自检、类型检查、构建、产品、HTTP、GUI、
  模型或契约自检。因此以下只是“作者源码”，不是新运行结果。

当前只读 SHA256：

```text
89C27669779847556878F43C8619194356F3350B029DC8C44F62F3D92C1618ED  service/lawbench/case/materials.py
C788BC66D977183E21E2DADC3EF60F9F7E832B28B335470AC597C4444C445D05  service/tests/test_t3_rework.py
B522C75315C154FEDC4FE904CE3BDBBD6631397A5DB53A704C2E9AA61F86BBE6  service/tests/test_tools.py
AA308848009117FBD8B03748262515C6CE3AC2499CC1240BD34F81EACDC01E08  docs/plan/evidence/FullRegression/BNarrowFixRunner-20261031-141226/bootstrap.py
B714AF1B3C98D99F7E0FF163D884142CA6926405829FD4214D99195E03A110AC  docs/plan/evidence/FullRegression/BNarrowFixRunner-20261031-141226/README.md
```

## 4. 未证明与仍开放

- 原 RED 与本次未运行源码不能等同为绿；必须由 root 在既有隔离边界、原样测试断言、
  长文件名真实行为和聚焦选择下独立验证。
- `converter_unavailable`、`timeoutfakeOLE`、`crashfakeOLE` 仍开放，本轮没有改转换器、
  fixture 或安全 allowlist。
- 其他不属于本次五类修正的 FAIL/ERROR/SKIP 仍按原状态开放；没有任何失败被改写成
  skip、过滤或弱断言。
- `test_t37_refs.py` 未运行、未改；其既有独立证据仍是该表面权威。
- 结果不能称为 full-service PASS。`full_service_pass_claimed` 仍为 `false`。
