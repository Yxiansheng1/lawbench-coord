# T18 辩护意见原生链路（源码交付）

状态：`AUTHORED_NOT_RUN`。本目录只包含源码、固定输入清单和说明；本次没有启动 Node、TypeScript、Python、HTTP、模型、GUI、测试、构建或任何语言解析器，运行时执行次数为 0。

## 交付内容

- `native-defense-opinion.mts`：一次有界的原生链路消费者。
- `b-service-defense-opinion.py`：当前 B 服务的有限 HTTP 入口。
- `literalfixed-inputs.json`：输入、依赖、私有编译产物和运行时可执行文件的完整清单。
- `README.md`：边界、复现方式和证据说明。

## 场景

使用的是 `defense-opinion` 的公开样本 `样本01-诈骗罪轻`：

- 原件仅两份：`起诉意见书.txt`、`讯问笔录.txt`。
- 任务说明明确选择上游 `_上游成果-刑事阅卷笔录.md`，作为普通 prior 输入。
- prior 以原样字节复制到新案件 `成果/刑事阅卷笔录.md`，由生产 `TaskService.input_refs` 计算标题、版本和 SHA-256；没有伪造历史任务、结果、模型消息或成果索引。
- `/api/task` 传入且只传入该一个相对路径；不调用 `/api/request/scope`，任务落盘要求 `request_scope: null`。
- B 服务要求两份原件经当前文本扫描器解析，并要求 `/core/context` 中的 L1 是该 prior 的完整注入，`truncated=false`、`toc=[]`。

## 有界行为

- 保留生产 CaseRegistry、文本扫描、Native Session、真实 R/UUID、TaskService、Host、AgentLoop、工具运行时、任务结算和冻结后的模型路由/预算。
- 保留既有本机回环、来源读取、拒绝外连、OCR/retainer/import 拒绝、凭据不可读取、进程清理和终态报告护栏。
- 三问 ID 固定为 `direction`、`stage`、`key_points`，声明来源依次为 `[false, true, false]`；必须由真实一次联合提问触发，授权合成答案只在提问后读取。
- 起点要求加载 `defense-opinion` Skill；关键事实必须实际调用 `case_search` 和局部 `case_read_material`。
- 草稿标题只接受“辩护意见”或“辩护词”；机器检查只覆盖交付结构、原件行号引用、法律核验标记和草稿正文洁净度。
- 草稿引用必须覆盖两份当前材料，且所有 citation `source` 请求都必须解析到未变化原件。覆盖情况按实际读取记录核验，不要求读全两份材料。
- 退赔金额、16,500 元与郑某 30,000 元的实质判断、不利事实回应、法律核验及最终答复自检留给根层人工审阅；源码不内置答案匹配器。

## 固定边界

- 三份基线源码快照仍按提供时的字节数和 SHA-256 使用，未改写。
- 26 个依赖中只将原 Skill 依赖替换为 `defense-opinion-skill`；其余 25 个依赖保持原路径与哈希。
- 4 个私有编译产物、3 个运行时、346 条源码 pin 以及原 Skill/模型/预算设置保持原值。
- 产品 A/B、Skills、tests、默认库、SDK、loader、provider、预算、构建脚本和产物均未改动。

## 本次未验证

本交付没有运行时结果，不能据此宣称任何真实模型、接口、草稿质量或产品场景已经通过。由于执行令禁止运行脚本、测试、解析器、构建和 Git 写入，本目录也没有 Git 提交 SHA。

只读检查限制：

- `git status` 在 `dsh` 子模块处被权限拒绝；没有尝试修复、提权、改锁或写入 Git。
- 本会话有数次工具参数误设为不可用的 `bash`，执行器在启动前拒绝，未执行 Bash 命令，未产生修改；所有成功读取和检查均使用规定的原生 PowerShell。

## 未来有界运行入口

只有在根层另行授权运行窗口后，才可按冻结路径执行：

```powershell
E:\node\node.exe D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseOpinionNative-20261029-155352\native-defense-opinion.mts --credential-stdin
```

该入口需要按既有匿名 stdin 方式提供凭据；源码不读取环境变量或本地密钥文件。上述命令仅作为未来运行说明，本次没有执行。
