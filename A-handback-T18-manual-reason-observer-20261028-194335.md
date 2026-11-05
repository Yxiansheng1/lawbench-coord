# A 线交回：T18 人工原因观察器更正

工单号：`T18-manual-reason-observer`

分支最新提交 SHA：未变；`line-A` HEAD `a23271abee333a9a256fd46a3141da16975c2380`。执行令禁止 Git 写入，本轮未 add、commit、rebase、stash、reset、clean、checkout 或 push。

交付说明：当前专用执行令要求写本交回件；本件即正式交回。工作区证据目录为 `D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/`，其中 README 已按本轮实况更新，不是完整 T18 的交付说明。

## 结论

状态：`AUTHORED_NOT_RUN`。观察器源码与离线测试源已写好，但按作者运行边界没有运行 Node、Python、TS 解析器、测试、编译、HTTP、模型、GUI 或安装包流程。

旧实跑 `FAILED` 保持不可变，不追溯改成通过。合同数值比例 `20 vs 2` 的业务红灯仍未解决，属于 B 线上下文；本件不宣布全绿、不修改模型草稿、不把 Gate 1、完整 T18 或项目判为通过。Packaging 继续 **HOLD**。

## 改动

- 仅改 `native-contract-workflow.mts` 的 `assertOutOfScopeReported` 函数体和唯一调用点。
- 函数第三步接收实际 `edits`，按 `out_of_scope.id` 绑定唯一实际编辑、评论中的 `风险N`、编辑 `para` 与对应风险块中的段落引用。
- 每一被拒条目必须在同一风险块的唯一 `处理方式` 中写 `该条需人工修改（原因）`；其他风险块的人工修改字样不能代过。
- `find 跨越域代码或超链接` 允许空白归一后的 `find 跨越超链接` 或 `域代码`；其他原因保持归一化精确匹配。
- 缺失、重复或歧义 id、风险块、处理方式及错误段号均失败关闭。
- 新增 `manual-reason-observer.spec.mts`：从当前 consumer 源码提取函数，先检查调用目标白名单，再转译到无 process、文件系统或网络能力的有限 VM；不导入 consumer，不触发 `main()`。固定读取实际草稿与编辑清单，覆盖实际输入、3 个允许语义变体和 12 个失败场景。

## 只读检查

- 新版 consumer 与协调目录保存的修改前 consumer 逐行比较：差异只在目标函数和唯一调用点。
- 输入不可变件仍为：
  - `actual-final-draft.md`：7520 B，`1228EA9EEAC21BA79209AC061159FC758FBA2036F8B7F4FA3ABB5C738E48C3F5`
  - `actual-editlist-and-result.json`：2912 B，`FEB951E915623B169DF7ACC139F41D277FF54FFD944357F8AF2C50A3F9183375`
  - 修改前 consumer：103451 B，`782D9D55CCCBDECC8CCF754DFB9D9EC49AE9C4BDDF9B4683F5311B3915E210ED`
  - `b-service.py`：30607 B，`4FEF1D5202B696B51467D1AABA52B00F71AA97610DBAFFE3C65877ABDC60F59F`
  - `fixed-inputs.json`：17162 B，`B187D49B0DF3E913099F938BCFC91D2184C2F6632A16C58FD2BDE50BC3710139`
- 新版 consumer：107162 B，`D1146FCFD9BC71E73DE091E1FC578EB0FAA66C71D4E562FE535016B7FFB80479`
- 新测试源：7377 B，`EE7A89AF4A3387B69177B7919911607923FE0FCF4C5B62C111855DA50C672934`

## 阻碍与交回

- 初始只读 `git status --short --branch` 因 `dsh` 子模块权限拒绝而失败；随后以 `--ignore-submodules=all` 读取主工作树。未修改权限、审批、ACL、锁或子模块。
- 一次只读 `rg` 检查误把 shell 设为 `bash`，环境以 `E_ACCESS_DENIED` 直接拒绝，命令未执行；随后全部使用显式原生 PowerShell。
- 工作树已有大量非本轮 dirty/untracked 产物，全部保留；本轮没有清理、暂存或重写。
- root 完成全量复核后，再执行 README 中的有限离线观察器测试；随后由 root 按执行令处理源码逆向核对、pin、清理与后续有限全流程。本件不代替 root 的实跑验证。
