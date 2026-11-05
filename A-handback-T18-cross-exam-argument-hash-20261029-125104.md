# A 线交回：T18 质证回调参数哈希域修正

执行令：`D:\Lawbeach\lawbench-coord\A-T18-cross-exam-argument-hash-order-20261029-125104.md`

## 结论

- 作者状态：`SOURCE_ONLY_FIXED_NOT_RUN`
- 本轮作者 Node/Python/AST/parser/import/check/test/build/HTTP/model/GUI/SSH/
  EnvKeyDPAPI/process probe 运行数：`0`
- 修复后有限验证：`NOT_RUN`
- 产品、模型、Native 管线绿灯：`NOT_CLAIMED`
- 原始业务质量：`FAILED_HELD`
- 整个 T18：`INCOMPLETE`
- Packaging：`HOLD`

根已确认旧采集器保存的 `c57b…` / `1878…` 是 canonical sorted JSON 摘要，
而当前测试器实际计算的是 JSONL `data.arguments` 原文字符串摘要，即
`4e47…` / `1e90…`。本轮只把两条错误固定断言改成根批准的 raw 字符串身份，
没有加入归一化、修改哈希算法、改写 source arguments 或削弱断言。

## 改动范围

源码只改
`docs/plan/evidence/T18/CrossExamCallbackRecovery-20261029-122319/verify-callback-finite.mts`
中的两条断言字面量：

```diff
-  'c57bd4d2679e6364bb725eb629a02042e1aed6af4af87c8e0fb03407ee995115',
+  '4e47b9d46f8c47b7b2becb7136352271d6ea3e6aea1cd7707b9b96fe6fe789d4',

-  '18782071255151490d54ad3e658f4a6e8c3d46ed633c7be103f38ac32806a480',
+  '1e90c7a5036f90971453d4be13288991eb273ad19956eaf33f4d4a6ce50850b4',
```

两条断言仍直接检查
`sha256(wrongAskEvent.data.arguments!)` 和
`sha256(validAskEvent.data.arguments!)`。全 JSONL `13555…` pin、call ID、
seq、实际问题/答案、旧 RED/新 GREEN、10 个非法控制、重复提交、并发读取、
读取失败恢复、当前 manifest、AST 抽取工厂、unwrap/inverse 和授权答案均原样保留。

README 同步更新测试器最终字节/SHA，并明确区分旧 canonical sorted 摘要与当前
raw arguments 摘要。README 旧稿曾把前者误标为实际参数字符串摘要；只纠正该说明，
没有改旧失败包、旧快照或其他文档。

## 文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| 输入旧 `verify-callback-finite.mts` | 35370 | `836b4082cad8ebcc51a164e9e45c071308dd7ad22bf8cfa13ae12b0951db53e4` |
| 当前 `verify-callback-finite.mts` | 35370 | `4d9a7da607ab7906b80eaf4ce3fad2fedd3d723255ea9964ae30d9ad0904decc` |
| 当前 `README.md` | 10678 | `9e3e9d595b093ff22246ee7285fd9933be89dcc7295224e5d960cc3b432d47ac` |
| 冻结 `native-cross-exam.mts` | 129399 | `6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454` |
| 冻结 `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| 冻结 `literalfixed-inputs.json` | 12276 | `b802114960025acbd28a567289c6ff066524fd6953142b622e972ab732acc03c` |

有限源码反证使用纯 PowerShell/UTF-8 内存比较：输入旧稿中的两个旧 canonical
字面量各出现一次；仅将其替换为两个新 raw 字面量后，所得全文与当前测试器逐字节
完全一致。两项文件均为 35370 字节，旧 canonical 字符串在当前源码中为 0 次，
新 raw 字符串各 1 次。该检查没有解析、导入或执行测试器。

## 复用证据与冻结边界

根只读证据：
`D:\Lawbeach\lawbench-coord\T18CrossExamArgumentHashInput-20261029-125104\root-argument-hash-domains.json`
（946 字节，SHA-256
`dd0c3928cc3f5aac14ebb6c77b9f6114a6df094a372d6516ab42addbd70a9005`）。
其中 session `13555ca8461f2e76fe987c4f0ff13ce35e57dd20fe6154546d27b01ed0f97604`、
seq/call ID 与两套哈希域保持原值。

原有限失败记录
`original-finite-hash-failure.json` 为 1139 字节，SHA-256
`9eba0c010602d93cf66e9b262c9e3f19ed7e6ed0f745781a12ca5e688212ef0a`；
其 `source_sha256` 仍是 `836b…`，`exit: 1`，`forced: false`，
`NativeResourceClaimed: false`，`CoreAgentSessionCreated: false`。本轮没有重跑
该失败，也没有把作者修复表述成有限 RED/GREEN 已通过。

Native consumer、B 服务、全量 manifest、产品 `5366…`、TaskState、Skills、
旧测试/旧源、private25 编译产物、build/runtime、原 run/report 与旧失败样本均
保持冻结。除上述测试器和 README 两个交付文件外，本轮没有修改任何工程或运行产物。

## 权威边界与根下一步

本轮没有执行任何有限测试、编译、准入或模型链路。作者结果不是 GREEN 证据。

根应按执行令继续：

1. 完整审计本轮命令，并做两处 literal 的全文件字节逆替换；
2. 只重跑受影响的有限测试及必要的 514 准入；
3. 准入通过后，只以同一 canonical 输入运行一次实际模型链路，并完成
   report/manual/JSONL/OS 闭环。

## Git 与阻碍

Git 严格只读。本轮没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout` 或 `push`，没有暂存或提交；交回以本协调目录文件为准。

普通 `git status --short --branch` 在既有
`.git/worktrees/lawbench-A/modules/dsh` gitdir 处返回 `Permission denied`；
使用 `--ignore-submodules=all` 只读查看后，目标证据目录仍属既有未跟踪内容，
主仓既有 dirty 全部保留。该 Git 权限拒绝不是本轮交付阻碍，未改权限、ACL、
沙箱、审批、index lock 或 writer 锁。

未联系其他聊天，未更换 API，未启动 setup 或 legacy，未执行 Bash，未读取或使用
凭据，未重演旧开工、安装、调研、全量测试或模型运行。作者到此停止。

命令审计：终段一次只读匹配计数命令因 PowerShell 管道闭合写法触发
`ParserError`，整条未执行；修复后一次同类核对误把 shell 参数设为 Bash，
运行器在执行前以 `BASH/E_ACCESS_DENIED` 拒绝，未产生读写。其余实质命令均使用
指定原生 PowerShell；这些审计事件不影响上述哈希和文件身份。
