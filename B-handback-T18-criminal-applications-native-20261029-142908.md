# B T18 刑事申请书原生消费者交回

状态：`AUTHORED_NOT_RUN`

结论：新场景源码、B 有界服务和固定输入清单已落盘，未执行任何运行时验证。`Gate1` 仍为 `INCOMPLETE`，`Packaging` 仍为 `HOLD`。

## 证据目录

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CriminalApplicationsNative-20261029-142908\`

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `native-criminal-applications.mts` | 138507 | `212c31756ce8dc5cf9ff6607a0e4154b604497b072f8d3ccaed0f2924ff32cf9` |
| `b-service-criminal-applications.py` | 48430 | `5841bfe21acd27ac6bc6dd468d8d2c1dedafbb28db52b176fb94d12032c7e28b` |
| `literalfixed-inputs.json` | 11650 | `e01b173ee11f2798db8317cc9cf239d8da56e8e989206aa7627382596c8d5501` |
| `README.md` | 4160 | `40fcffb01bd0ac7f6e047926f37e9c3ee714e29ab1ef05ef7e4db1c59eac1d6e` |

## 已完成的有界修改

- 消费者场景切到 `criminal-applications`，新任务名 `B-T18-criminal-applications-native-20261029-142908`。
- 三份规范材料仅为 `起诉意见书.txt`、`退赔收条.txt`、`讯问笔录.txt`；清单材料项为 3，规范输入行共 6，`inputs=[]`。
- 必问 ID 改为 `doc_type`、`authority`，来源标记分别为 `false`、`true`。合成答复文件仍为 119 bytes / `ee2edc...be6de`，只在真实两问回调后读取。
- 问询回调要求同时展示“取保候审”与“虚构区人民检察院〔起诉意见书 第34行〕”。第 34 行来自真实 TXT 文本行位置；材料内嵌“第5页”只作正文内容。
- 删除旧场景“先列材料、三答后才可读、五材料全读、8 列 4 行证据表”的专用门。新观察器允许先读材料推导机关，只硬约束真实两问答完后再成功保存。
- 草稿机械检查改为“取保候审申请书”标题、Skill 模板主项、受理机关、行级出处及“法律依据待律师核实”；不检查人物、金额、家庭事实等 golden facts。
- 引用仍逐个核验实际返回的材料版本与 source GET；不要求三份材料全读后才可保存。
- 原生 Session/R/队列/request header/provider/model/49152/HTTP 200/32 模型调用/48 工具调用/45 分钟预算、真实读取记录、持久化、JSONL close/reopen、清理与 finally 顺序保持不变。
- B 服务继续固定随机 loopback、lifespan off、拒绝出站与 Key getter、OCR off、Retainer off，并限制既有 API/core 路由；只把材料数量与 `.txt` 类型调整为三份。

## 固定输入与复用

- `approved-inputs.json`：2315 bytes / `ab1bdd4e163575cc294f49c889fa7b533f1ed1e90d5362422967f08424648e6b`。
- 原 25 项依赖、4 项编译私有件、3 个运行时及 346 项源码指针沿用；第 26 项依赖替换为 `criminal-applications-skill`。
- 依赖/私有件/运行时 role 总计 33（26+4+3），清单材料名 3。两个自身路径只指向本目录的消费者与 B 服务。
- 旧质证源码 148412 bytes / `0da719ca...33bfb` 保持未改。
- `settleOwnedCoreTask` 新旧规范化片段均为 `7e4c9602209e17a695f3bdce758129753d369ddcaaf6fab612f631e57ba513cd`。
- `createTaskSettlement` 新旧规范化片段均为 `2d6356224e08a40541ce821cc5bfb6e0d6620a89cae1cd127c90039bc9246f3a`。
- 仍未在没有实际运行的情况下继承旧场景业务 PASS；根执行者须重新跑完整原生工作流。

## 静态核验

- 三份材料、Skill、任务和参考元数据的目标 SHA/size 已逐一核对，与 `approved-inputs.json` 一致。
- 源码和 B 服务中已无旧五材料、三问或旧交叉询问专用校验残留；仅当前编译私有件的既有路径名含 `CrossExamQuestionPrivateBuild`，该路径按要求原样保留。
- 未运行 JSON/TypeScript/Python 解析器，因此本交回件不宣称语法、类型或运行通过。
- 根执行者仍须完成：全量固定命令与写入面、typed contracts、setup/finally、真实 `beginSubmission` 一次保存、草稿/答复/三材料手工复核、JSONL/OS/端口/Key 扫描，以及按实际行推导 510 项准入结构。

## 命令与阻碍

- 本执行者 `exec_command` 调用 65 条：成功 56，非零 9；Node/Python/parser/test/build/HTTP/model/GUI/SSH/DPAPI 运行次数 0。
- 非零包括：目标目录初查尚不存在 1；Git status 被子模块 `dsh` 读取权限拒绝 1；`git diff --no-index` 因存在差异返回 1 共 4；误填 `bash` 被运行时拒绝 3。
- 三次 Bash 误调用均无命令执行、无文件改动；其后全部使用指定原生 PowerShell。`git diff --no-index` 只读且未写仓库。
- Git 写操作 0：未 add/commit/rebase/stash/reset/clean/checkout/push；未改 index.lock、ACL、审批或沙箱。
- 所有产品代码、Skill、契约、运行时、配置、默认库与策略均未修改。当前新增文件未提交，交回以本文件为准。
