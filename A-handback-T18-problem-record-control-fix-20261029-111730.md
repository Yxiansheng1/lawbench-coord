# A 线交回：T18 问题记录控制测试单行纠正

## 结论

- 状态：`COMPLETE_STATIC_CORRECTION`
- 范围：仅修正旧有限测试中 `sectionControls` 的测试夹具等级，不涉及产品源码。
- Gate/打包：本轮不重新声明通过或放行；有限测试器未执行。
- Git：`STRICT_READ_ONLY_HELD`；无 add/commit/rebase/stash/reset/clean/checkout/push，
  因而无提交 SHA。

## 纠正原因

`sectionControls` 的三个辅助负向控制使用默认等级 2 的 `miniDocument()`；旧观察器
对等级 2 问题记录也会返回 `hasProblemRecords`。两者叠加会掩盖“矛盾对照、证据链缺口、
自检结果”三项原有检查的实际比较。原有限测试在静态阶段被拒绝，未形成实际测试 FAIL，
也不是产品、模型或 6000D 网关红。

唯一修改位于：
`docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348\verify-problem-records-finite.mts`
第 406 行。

```text
修改前：const text = miniDocument().replace(`## ${section}`, `## ${replacement}`)
修改后：const text = miniDocument(undefined, 3).replace(`## ${section}`, `## ${replacement}`)
```

## 测试身份与全文反向

| 状态 | 字节 | SHA-256 |
|---|---:|---|
| 修改前 | 13921 | `9dff4cf0f70504a2d1e40d7817856c6f84f240f19f3ec78274d01d9ede4b187f` |
| 修改后 | 13933 | `4da26c9278d9db59eef360860dad525540825173236375ab9159ced0f92faffb` |

协调目录
`T18ProblemRecordControlInput-20261029-111730\verify-problem-records-finite.mts`
仍为修改前同哈希副本。修改后文件与冻结副本均为 415 行，逐行比较仅第 406 行反向；
其余 414 行精确一致。未改默认 `miniDocument`、其他调用、断言/预期错误、39 个控制、
导入、目标函数、源码固定项、MTS、B 服务或 manifest，也未放宽
`hasProblemRecords`。

纠正说明路径：
`docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348\control-correction-20261029-111730.md`

## Runtime 与 Raw Nonzero

- 作者 Runtime：`0`。
- 有限测试器：`NOT_RUN`。
- 本次模型重跑：`NOT_RUN`。
- 未执行 Node/Python/parser/AST/import/check/test/build/HTTP/model/GUI/SSH。
- 此前根审计原始记录：75 条命令、63 条成功、12 条非零；本轮未重演，也未复制或改写
  旧 runtime 数字。
- 本轮普通 `git status --short` 原始退出码为 `1`，原因是只读 worktree 子模块
  `.../modules/dsh: Permission denied`；使用
  `git status --short --ignore-submodules=all` 后退出码为 `0`。该只读阻碍不影响本次
  文件交付，未尝试改锁、权限、审批或沙箱。

此前证据与证明路径仍有效，不需为本次单行夹具纠正重跑模型或完整 consumer。
