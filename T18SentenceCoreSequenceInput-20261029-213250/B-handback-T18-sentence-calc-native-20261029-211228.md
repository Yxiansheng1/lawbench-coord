# B 线交回：T18 sentence-calc 原生场景

## 状态

`AUTHORED_NOT_RUN`。按
`B-T18-sentence-calc-native-order-20261029-211228.md` 完成有界作者交付。consumer、
service、Node、Python、TypeScript、模型、HTTP、GUI、产品路径和测试均未执行；本交回
不宣称业务、法律、Gate 1 或完整 T18 通过。主编排复核源码和 manifest 后，再决定是否
发起一次全新的实际运行。

## 交付

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\native-sentence-calc.mts` | 151508 | `4ae328eca562a3fc021981cb7bd17cfde16968c97e9f05dd5dbc0bc0261ab55d` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\b-service-sentence-calc.py` | 50541 | `227b3d0eef6e3903d0825e521329564f55d04740ed41468ede360374ad9f4430` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\literalfixed-inputs.json` | 12424 | `2cf99a5610ef467a3964644f9aa1d24c2ede32a875fb46dc3b3143a02f93dcc2` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\README.md` | 5388 | `853a5a562b5bfc5cd77737fa32768146fb3db74b1b8e2985dc87a5bae213bea0` |

目录中只有上述四个普通文件。manifest 与
`root-approved-manifest-blueprint.json` 逐行只差 consumer/service 的四行占位改为实际
bytes 与 SHA；其余元数据原样。八条输入、26 个依赖、四个 current private 编译件和三个
运行时均按主编排批准值固定，未动态接受产品源码、旧编译件、旧报告或旧会话。

## 场景约束

- 私有 `criminal` 案件仅复制五份实际 TXT，保留 bytes、SHA-256、`mtime_ns`；三个犯罪
  模板目录必须存在且严格为空；扫描与 CaseRegistry 使用真实产品路径。
- 无 prior、无 request scope，`task.inputs=[]`。任务固定低思考、64K、16384 max tokens、
  32 model calls、48 tool calls、45 分钟和 1200000 ms timeout。
- 模型先 `case_list_materials`，再以 `刑事判决书 + more_names 其余四份` 一次全读，
  不传 `max_chars`；之后才允许一次联合 `purpose`、`penalty`、`custody` 确认。
- 授权答案只在合法联合问句之后读取并返回。未知 ID、缺项和非法问句走生产拒绝，不回填
  预置答案。任何预答案读取或计算都被拒绝。
- 回答后只允许真实 `case_calc_sentence` 一次；成功返回后首存“刑期计算表”，后续修订
  仍用同一标题。consumer 不嵌入预期日期、参数答案或金标事实。
- 草稿 citation 必须回到当前五材料版本的真实 `/api/source`；A-E 类 citation 问题为零，
  F/hint 保留 severity 与内容供主编排人工处理。
- 原八行和案件五文件前后保持 bytes、size、所需 `mtime_ns`；JSONL 关闭重开深比较；
  自有 PID/exe/UTC birth/loopback port、fetch allowlist、stdin、密钥清理和 finally
  均沿用已审核基线。未改产品源码、Skill、contracts、tests、权限、审批、ACL 或锁。

## 已验证与未验证

作者侧仅完成只读源文件审稿、身份哈希与路径/字段核对：五个材料名、三项问题 ID、
低/64K/16384 参数、32/48/45/1200000 预算、单一计算和无 prior 约束均一致；旧 pre-issue
流程键已清除。没有执行 syntax check、import、contract check、产品测试、实际模型或报告生成。

主编排仍需人工判读：联合问句是否完整展示用途、刑种刑期、各段羁押止日与出处；逮捕证
不清日期是否保留原字符并从清楚原件核对；参数是否有实际材料来源；判决书起止是否与程序
结果对照；实际返回日期/折抵/羁押/里程碑是否原样进入草稿；法律依据、自检和业务法律质量
是否真实。

## 纪律偏差

- 只读 `git status --short --branch` 因共享 worktree 的 `dsh` 子模块元数据返回
  `Permission denied` 而中止。按令未修锁、扩权或尝试 Git 写。
- 三次误传 `shell=bash` 的只读调用均由 MXC 在执行前以 `E_ACCESSDENIED` 拒绝；一次只读
  `Get-Content` 误用了不匹配口令的 PowerShell 完整路径，但只读取源码片段。没有一次执行
  Node、Python、测试、模型或产品命令。
- 没有 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；
  没有修改沙箱、审批、ACL、锁或其他 Git 写入口。
