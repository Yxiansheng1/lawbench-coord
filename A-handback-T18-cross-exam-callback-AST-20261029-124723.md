# A 线交回：T18 质证回调 AST 抽取修复

## 结论

- 作者状态：`SOURCE_ONLY_FIXED_NOT_RUN`
- 本轮作者 Node/Python/AST/parser/import/check/test/build/HTTP/model/GUI/SSH/
  EnvKeyDPAPI/process probe 运行数：`0`
- 修复后有限验证：`NOT_RUN`
- 产品、模型、Native 管线绿灯：`NOT_CLAIMED`
- 原始业务质量：`FAILED_HELD`
- 整个 T18：`INCOMPLETE`
- Packaging：`HOLD`

本轮只修复有限测试器读取真实源码时的 AST 参数解包缺陷。实际源码把回调写成
`(async (…) => {…}) as never`；旧测试器只剥离一层 `AsExpression`，其内部的
`ParenthesizedExpression` 被误当作非箭头节点，最终在实际回调执行前以
“0 个实际回调”退出。新测试器在同一既有 TypeScript AST 上循环剥离任意层
`AsExpression` / `ParenthesizedExpression`，直到得到真实 `ArrowFunction`。

## 改动范围

源码改动只有
`docs/plan/evidence/T18/CrossExamCallbackRecovery-20261029-122319/verify-callback-finite.mts`
的 `extractRequestCallback` 参数解包块：

```diff
-      if (ts.isAsExpression(callback)) callback = callback.expression
+      while (
+        ts.isAsExpression(callback)
+        || ts.isParenthesizedExpression(callback)
+      ) {
+        callback = callback.expression
+      }
```

以下约束原样保留：

- `setupProduction` 必须严格只有一个，且 `user-questions/request` 实际回调也必须严格为一个；
- 实际参数若不是箭头函数仍失败，不用 fixture 回调或正则猜测替代；
- 回调正文及其 `getText(sourceFile)` 来源不变；
- 每调用独立 `makeCallback` 的 `question` 词法绑定不变；
- 旧错误 `confirm_scope` 到合法三 ID 的 RED/GREEN 顺序、10 个非法控制、
  成功后拒绝重复提交、并发读取、读取失败后清锁重试均保留；
- 全文逐字节反向恢复、原有 source pins、全 Native manifest、
  compiler-private import 和授权答案 pin 均未削弱；
- 没有改完整 consumer、B 服务、产品、测试、Skill、私有构建、运行时、
  loader、pins、原正式报告、原运行记录或原失败样本。

## 文件身份

| 文件 | 字节 | SHA-256 / 结果 |
|---|---:|---|
| 修复前 `verify-callback-finite.mts` | 35283 | `a3a3bd8158f58468ada592134ff98ed08fc363a39327d17fc097f17538f1f6b2` |
| 修复后 `verify-callback-finite.mts` | 35370 | `836b4082cad8ebcc51a164e9e45c071308dd7ad22bf8cfa13ae12b0951db53e4` |
| 更新后当前 `README.md` | 9978 | `5b42f8327bfc49b26ebbecb07a7e3a5e9c9e0c4d82a4f69a9a02e0401f1f1621` |
| 冻结 `native-cross-exam.mts` | 129399 | `6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454` |
| 冻结 `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| 冻结 `literalfixed-inputs.json` | 12276 | `b802114960025acbd28a567289c6ff066524fd6953142b622e972ab732acc03c` |
| 当前 `dsh-ext/agent/index.ts` | 46684 | `5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c` |

源码字节反证：修复前文件中旧单行目标恰好出现一次；仅在内存中将其替换为
上述新块后，所得 UTF-8 字节为 35370，和修复后文件逐字节一致。因此除该聚焦块外，
有限测试器其余字节全部保留。该检查是纯字节比较，没有解析、导入或执行测试器。

README 已更新有限测试器的新字节/SHA，并明确原失败是测试器夹具抽取形状错误，
不是产品失败或模型红灯；仍声明作者没有运行修复后测试。

## 原始失败事实

- 原失败包：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18CrossExamCallbackFinite-root-20261029-124641`
- 冻结失败快照：
  `D:\Lawbeach\lawbench-coord\T18CrossExamCallbackASTInput-20261029-124723`
- 原测试器 SHA：
  `a3a3bd8158f58468ada592134ff98ed08fc363a39327d17fc097f17538f1f6b2`
- 原报告：exit `1`，elapsed `0.725955s`，`source_unchanged: true`，
  `forced: false`，`NativeResourceClaimed: false`，`CoreAgentSessionCreated: false`
- OS 记录：两个完整身份、exe 和 UTC birth 均已观察为 `gone: true`
- 失败时机：实际回调执行前；实际回调数 `0`
- 结论：本次是有限测试器 AST 形状抽取错误，不是产品失败、模型红灯或
  Native 运行结果

原失败包、原测试器、原 run/report/source snapshot 均未改写。

## 权威边界与下一步

本轮没有运行修复后的有限验证，也没有运行模型、完整 consumer、Native 管线或
任何准入/全量测试。不要沿用作者状态宣称 GREEN；根必须自行验证。

根按执行令应：

1. 完整审计本轮命令并重做 source/full-byte inverse；
2. 仅重跑受影响的有限测试及必要的 514 准入；
3. 准入通过后，只通过一次同一 canonical 实际模型并完成后续闭环。

根应保留原 `a3a3…f6b2` 失败证据。作者未在同一 canonical 输入上执行模型，
因此严禁把本轮修复表述为模型通过或 T18 释放。

## Git 与阻碍

本轮严格遵守只读 Git 边界：没有 `add`、`commit`、`rebase`、`stash`、
`reset`、`clean`、`checkout` 或 `push`，没有暂存或提交。交回以本协调目录文件为准。

只读观察：分支 `line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`。
普通 `git status --short` 仍在既有
`modules/dsh` gitdir 处遇到 `Permission denied`；随后仅以
`--ignore-submodules=all` 只读查看主仓 dirty，所有既有 dirty 均未改写或清理。
没有改权限、ACL、沙箱、审批、lock 或 writer 锁。

命令审计：本轮一次 PowerShell 只读文件身份命令因管道写法触发 `ParserError`，
未执行文件操作；已用原生 PowerShell 重跑成功。未使用 Bash，未启动 setup，
未切换 legacy，未探测或拆分 writer 锁，未联系其他聊天，未更换 API。
