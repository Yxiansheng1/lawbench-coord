# A 线交回：T18 criminal-evidence-review 轮次引用运行时

## 结论

已完成有界 source-pin 再绑定。只改 consumer、B 服务和 manifest 的规定字面对象；三项冻结输入已复制，
README 与正式交回文件已落盘。本轮 `runtime=0`，finite 与 full model 均 `NOT_RUN`；旧实际运行的
技术事实复用，但数字位置、推理、轮次引用的人工复核失败保持。

状态：`SOURCE_ONLY_REBIND_READY`，Gate 1 `INCOMPLETE`，打包 `HOLD`。

## 正式产物

作者目录：

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalEvidenceRoundRuntime-20261029-105056
```

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-criminal-evidence.mts` | 120951 | `788b18db4587e0aa44185ab85e8713f4785ca81781dac81589029b9063af2060` |
| `b-service-criminal-evidence.py` | 48428 | `c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb` |
| `literalfixed-inputs.json` | 12237 | `b1ee91e2f28c1f0f54758119e9f03c43c28049c74c43f021e447f567503ed083` |
| `README.md` | 静态说明 | 见本交回后的最终只读文件 |

新 source-pins：

```text
D:\Lawbeach\lawbench-coord\T18RoundCitationRuntimeInput-20261029-105056\reviewed-b-source-pins-round-citation.json
53548 bytes
6b07e5773dc77c6b13fd6688e4febca847af250f8a37ce13d3a4af4d581c5205
```

## 变更边界

1. `native-criminal-evidence.mts` 只改 `SOURCE_PINS_PATH` 与 `SOURCE_PINS_SHA256`。
2. `b-service-criminal-evidence.py` 只改等价路径和 SHA。
3. `SOURCE_PINS_BYTES=53548`、`SOURCE_PINS_ENTRIES=346` 均未改。
4. manifest 只改 `sourcePins`、`consumer`、`bService` 三对象的 path/bytes/SHA；其他组、顺序、
   空白与换行均未改。
5. 未新增 parse 直接依赖、loader、framework、import、product、SDK、runtime、guard 或 build。
6. 未改 source-pin JSON、golden facts、baseline、raw、Skill、任务、材料或历史运行。

静态反向核验结果：

- consumer 将新路径/SHA 换回旧值后，与 120949 字节旧文件全文精确相等；
- B 服务将新路径/SHA 换回旧值后，与 48426 字节旧文件全文精确相等；
- manifest 将三组新对象换回旧值后，与 12223 字节旧文件全文精确相等；
- 新旧 source-pins 均 346 项，逐行差异仅为 `service/lawbench/checks/parse.py` 对象的 SHA 与
  bytes 两行，其余 345 项不变。

旧 `parse.py`：11974 字节，
`3fd25b61a965abe5432b8d301448517dea003d77739f45a0331bbbf07fa123bc`。
新 `parse.py`：14357 字节，
`56f6ac85636eb5266db117067397fe5bad8cd1376360a1be8c52b92203b9db83`。

## 保留约束

- 真实 `stance` ID、callback、展示、材料来源标志和 answer literal 保持。
- Skill 13276 /
  `4405955c130cb7f9ea58c997965f41a62b6d7efcdafbb258d57fbd4028d906d2`；
  canonical task 646 /
  `44d4a257aacdc6b5036e83215c701658459a76da2512effdcac2b32e3af67e5f`。
- approved 8 的 paths、bytes、SHA、mtime 保持。
- 五份固定 Markdown、source GET、deep JSONL reopen、32 model / 48 tools / 45 min / 32768
  tokens / HIGH / 128K / request 1200000 ms 保持。
- provider/model/KEY stdin/TTY 默认、凭据脱敏、fetch 拒绝外连、OCR/retainer/lifespan 关闭保持。
- current private25 保持 manifest 58200 /
  `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14` 加 24 输出。
- baseline raw/B source/source resource/private25/legacy18/approved8 未重写。
- 无 history、R、seq、fake model、新 model request 或 test points to model。
- A-E、strict、must-fix 和 final cleanup 规则未削弱。

## 既有证据复用

老实际运行目录：

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalEvidenceNative-20261029-100253\run-Z1Q8ad
```

该运行状态 `TECHNICAL_PASS_REVIEW_REQUIRED`；8 次模型 POST 全 200，18 次网络观察为 model 8 /
core 9 / health 1，外连拒绝 0；真实 stance callback、五材料读取、16 条结构化引用、
`must_fix=0`、2 hints。JSONL 关闭后重开逐事件相等，48 事件 / 228040 字节 /
`a7d6e11c364b8f3a503370075a590d359e129d4b7107d8e10bfcee36280cf03d`。cleanup 完成，
一个完整 OS 进程最终消失，无网络残留。

采用的上游 source/finite 审查事实：旧 actual E=0，新 E=8/16 条结构化引用保持；原有 7 个边界和
N45 的旧 initial miss=2、新 E=2；canonical nested-year negative PASS，2.422 秒；一个完整 OS
进程最终消失，无网络。以上均未在本轮重跑。

历史实际的数字位置、推理和轮次引用人工失败仍为 `HELD`。本轮没有把这些事实编码进提示词、材料、
断言或 golden facts。

## 累计审计口径

```text
459 + 45 + 8 + 1 = 513
```

涉及 A `40ab48b8…d5794`、B citations `6171f0dd…a19b412`、当前 parse
`56f6ac85…b9db83`、新 346 项 source pins、current private25、legacy18 和 A/TS/ESM 边界。
所有对象仍对应同一个原始实际入口，匿名已保存 DPAPI 凭据经 stdin 供给；本轮没有读取、导出或
重建凭据。

## 命令与运行状态

完整入口未执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalEvidenceRoundRuntime-20261029-105056\native-criminal-evidence.mts' --credential-stdin
```

| 项目 | 状态 |
|---|---|
| Node/Python/TS/ESM | `NOT_RUN` |
| parser/AST/import | `NOT_RUN` |
| check/test/build/prepare/setup | `NOT_RUN` |
| HTTP/model/GUI/SSH | `NOT_RUN` |
| Env/Key/DPAPI/process probe | `NOT_RUN` |
| Git 写入 | `NOT_RUN` |
| finite / full model | `NOT_RUN` |
| raw/source/byte runtime admission | `NOT_RUN` |

作者仅执行 PowerShell 静态读取、`Get-FileHash`、目录列举、三文件复制、受控文本补丁和静态全文
反向比较。一次误指向 `bash` 的只读调用被 `E_ACCESSDENIED` 拒绝，没有发生命令或文件改动；未尝试
切换 legacy、修改沙箱/审批/ACL、拆分 writer 锁或绕过限制。

## Git 与 dirty 状态

按本运行器覆盖规则，没有执行 Git 的 add/commit/rebase/stash/reset/clean/checkout/push，也没有
暂存。工作树既有 dirty 未清理、未回滚、未覆盖。开工前 dirty 快照保存在：

```text
D:\Lawbeach\lawbench-coord\T18RoundCitationRuntimeInput-20261029-105056\A-dirty-before.txt
```

只读 `git status` 在 `dsh` 子模块处报
`cannot chdir ... Permission denied`；这不是本交付的修复项，未尝试修复权限或锁。当前 HEAD 为
`a23271abee333a9a256fd46a3141da16975c2380`，本包没有 Git 提交 SHA。改用
`--ignore-submodules=all` 的只读状态检查后，仍对既有若干超长会话路径报 `Filename too long`；
既有 tracked modifications 保持 57 项，目标目录的四个文件均显示为未跟踪 `??`。上述限制均未处理、
未绕过。

## 遗留与停止

- 人工复核失败仍待主编排处理；
- finite 与 full model 本轮均未运行；
- Gate 1 未完成，打包继续 HOLD；
- 是否需要实际重跑由主编排另行决定。

交回后停止，不联系其他聊天、不更换 API、不继续运行。
