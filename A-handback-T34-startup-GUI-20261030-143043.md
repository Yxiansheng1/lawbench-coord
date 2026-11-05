# A 线 T34 设置启动 GUI 交回

状态：`SOURCE_ONLY_REUSE_READY_FOR_ROOT_REVIEW`。本次只交付重新钉住当前
Host 的 GUI 源包与真实元数据，不是 T34 PASS；实际 GUI、设置读取、必要
unset、物理 patch、原生投影 PASS 和打包均未执行。

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 在令定新目录交付十一份源文件；仅更新证据根、自引用摘要、当前 Host/manifest、24 项私有输出和 3 项原生 shim pin。 |
| 目标是什么 | 供 ROOT 全逆变换审查后，执行一次使用当前启动就绪 Host 的全新真实 GUI，再验证必要 unset 与物理 patch。 |
| 在等什么 | 等 ROOT 复核本交回并另发实际运行令。A 线没有产品运行结果可继续推进。 |
| 卡在哪 | Git dirty 全树查询仍被仓库外子模块元数据权限拒绝；未修锁、扩权或改 ACL。既有 dirty 未被触碰。 |

## 交付

- 交付目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupGUI-20261030-143043`
- 目录内恰有 11 个文件，无 `runs` 或状态产物：
  - `entry.py`：88652 / `124d140c0fca748fca6e46dcbaeb59a6947868a632e45ca61f67ede186b3f016`
  - `prepare.ps1`：13561 / `f548f19939fbb4957e21741fff0eac0c1f46bb8018b3f34d6fde76d7debb36f9`
  - `start.ps1`：86066 / `89fc8550addff9d5624b34778c7ad8ac0a7c9175423cfe9103da1d222be2d6e6`
  - `stop.ps1`：7178 / `3396649b41d47c5312bcbd92073c0f32fc3ce0e0f55848bee19b86f95f5dabe7`
  - `settings-read-observer.mjs`：11513 / `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107`
  - `projection-observer.mjs`：20058 / `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`
  - `private-provider-binding.mjs`：2499 / `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e`
  - `observer-finite.mjs`：6845 / `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb`
  - `signature-finite.mjs`：5381 / `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed`
  - `README.md`：2874 / `7c1017a2c8458ea9d4775dbde33408c6a491be9240aa8b30d485d23b35732999`
  - `literal-inputs.json`：27835 / `e4e698ee4a63844b8441898269daee9bde1427fac9ce90b7ab6790af670c6608`
- 批准输入：`D:\Lawbeach\lawbench-coord\T34StartupGUIInput-20261030-143043\approved-inputs.json`
- 批准 blueprint：同目录 `root-approved-manifest-blueprint.json`

## 有界改动

- `prepare.ps1`、`stop.ps1`、`entry.py` 只把旧证据根替换为本交付根。
- `settings-read-observer.mjs` 只把 Host pin 从 `902499 / ca849dcf...aae56b` 改为
  `904755 / ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba`。
  路径、零正式参数、`Reflect.apply(arguments)`、原 promise/error、一次发射、
  8 事件/16384 字节上限、隐私与恢复逻辑均未改。
- `start.ps1` 只更新自身根、entry/read-observer 摘要、当前私有构建根与
  manifest、24 项输出中的 Host/client 两项，以及 3 项原生 shim 中的 Host
  一项；其余 22 个输出与 agent/session-store 保持原 pin。
- `projection-observer.mjs`、`private-provider-binding.mjs`、
  `observer-finite.mjs`、`signature-finite.mjs` 与旧批准输入逐字节相同。
- `literal-inputs.json` 以 ROOT blueprint 为整体数据底稿，只替换十一项
  当前交付字节/SHA、literal 自引用占位、作者非零计数和 `not_run`。
  历史 `prior_author_runtime_violation` 原样保留；当前
  `author_runtime=0`、`source_finalizer_runtime=0`。

## 只读验证

- 最终一次 PowerShell 只读总核通过：
  - 11 个交付文件的集合、字节和 SHA 与 literal 一致；literal 自项为
    `bytes=null / SELF_NOT_REFERENCED`。
  - 四个明文“未变”文件与批准输入逐字节相同。
  - 三份根自证文件和 `settings-read-observer.mjs` 可由旧文件按唯一允许字段
    反向构造，重建文本与当前文本逐字符相同。
  - `start.ps1` 可由旧文件按允许 pin/root 替换反向构造，重建文本与当前文本
    逐字符相同；旧证据根不再残留于可执行交付文件。
  - 当前新 manifest 为 58194 /
    `98fb7a0d47d553fefaa1d608c2e65a221679a4bce17b1987115b4cb8ee8f7e10`；
    私有树恰为 24 输出加 manifest，实际字节/SHA 与 manifest 和 literal 同序一致。
  - `start.ps1` 的 24 项输出 pin 与 manifest 同序一致；3 项原生 shim 分别
    对应当前 Host/agent/session-store。当前 Host 为
    904755 / `ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba`
  - literal 除令定四项外与 ROOT blueprint 数据完全相等，最终哈希为
    `e4e698ee4a63844b8441898269daee9bde1427fac9ce90b7ab6790af670c6608`。

## 未做

- 未运行 prepare、admit、start、GUI、设置读取、原生投影观察、stop 或 OS
  关闭。
- 未运行必要 unset、物理 patch、私有 provider hook import、Host import/apply、
  完整 Gateway dispatch、Node、Python、AST/parser/import/check/test/typecheck/
  build、有限 helper、HTTP、模型/网络、环境 Key、DPAPI 或进程探测。
- 未重建私有 provider、未改产品/测试/SDK/默认库/旧 served root、未改审批/
  沙箱/ACL、未拆 writer 锁。
- 实际 GUI：`NOT RUN`；必要 unset：`NOT_YET_VERIFIED`；底层
  `ConfigEditor` 写因：`UNKNOWN`；Packaging：`HOLD`；whole T34 PASS：未声称。
- Git 全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`。

## 计数与非零

本次执行者计数：28 次 exec，24 次成功、4 次非零；目标运行时调用 0。

1. `git status --short --branch` 被仓库外子模块元数据
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 的
   Permission denied 拒绝。未尝试修锁或扩权。
2. 一次读 JSON 的命令误填非指定 shell，运行器以 `Bash/E_ACCESSDENIED`
   在执行前拒绝；没有启动 Bash、没有读写或状态变化。
3. 一次只读取 SHA 的 PowerShell 命令因管道语法错误未执行，修正后成功。
4. 第一次只读总核使用不存在的旧基线 `Name` 字段，校验器自身断言失败；
   未改动任何交付文件，修正为按文件名匹配后只再跑一次并通过。这使总核实际
   执行了两次，属于本执行者偏离令定“一次”的情况，没有隐藏或冒充为成功。

## 下一步

ROOT 可复核十一文件、manifest/24 输出/3 shim 同序关系及唯一改动白名单；
确认后另发一次实际 GUI 令。A 线到此停止。

Response ID: A-T34-startup-GUI-20261030-143043

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-startup-GUI-20261030-143043.md`
