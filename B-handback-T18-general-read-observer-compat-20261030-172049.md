# B 线交回：T18 通用文书 Observer 兼容修复

状态：`SOURCE_ONLY_OBSERVER_COMPAT_REPAIRED / AUTHORED_NOT_RUN`

运行时执行次数：`0`。作者侧未运行 Native、模型、HTTP、有限控制、正式 consumer、类型检查、构建、准备脚本或探测；结论仅来自源码与文件身份的静态核对。

## 有界修改

- `native-general-drafting.mts`：从当前 compiled Agent 同一模块绑定并校验 `questionRequirementDenial` 与既有 `questionsBeforeReadDenial`，将写入闸门函数加入分类器的输入、最小类型、生产返回值和正式调用点。
- 非读取错误只新增一个放行条件：工具必须为 `case_save_draft`，调用与结果都早于实际有效答案结果，且结果文本逐字等于 `Error: ${questionRequirementDenial(declaredIds)}`。未知非读取错误仍判红；已知写入拒绝出现在答案后仍判红。
- 读取闸门原有的逐字原因、答案前时序、错误标志、来源、配对和覆盖语义未放宽。
- 分类器的声明问题 ID 改为既有 `QUESTION_IDS`（`doc_type, recipient, goal`）；律师回调仍校验精确三 ID 集合、单次调用、时序与真实答案，未新增答案或改变回调逻辑。
- `general-read-order-finite.mts`：从候选入口指向的同一当前 compiled Agent 绑定两个真实拒答导出，不执行入口；原 13 个控制名称和断言语义保持，新增 3 个控制后共 16 个。
- `literalfixed-inputs.json`：只同步 `consumer.bytes` 与 `consumer.sha256`。四个当前编译固定项、两个正式导入、依赖、材料、运行时、预算和其他数据未改。
- `b-service-general-drafting.py` 与 `README.md` 逐字节未变。旧提示、答案、R、scope、save、来源事实、引文、JSONL、`finally`、32 模型调用、48 工具调用、45 分钟和 32768 token 约束保持。

## 当前文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-general-drafting.mts` | 109576 | `8551d19c4593272c94878ad2e9f59dabf6711901a111a267cbc5b63c258acbd0` |
| `general-read-order-finite.mts` | 16315 | `08c5e9bca8c18122af3a021545724f8751f2d23d9b3b0af285990f1e438e3a86` |
| `literalfixed-inputs.json` | 11938 | `5b8363a00a9759727afa8482dab4accf263a22509cb5f569c791511c9f9c5661` |
| `b-service-general-drafting.py` | 42437 | `44bb8b5ff60309a7d7dc3c1474ab4efebe00995673927f59137dbb1f86346203` |
| `README.md` | 4528 | `f96f3689667c3c1e0e475a761b1568b31ebc5fb4a01b85be01ee4a0011f9a2b8` |

## 静态核对

- 清单解析成功；消费者字节与哈希匹配，结构仍为 4 个编译固定项、26 个依赖、5 个材料和 3 个运行时。
- 四个 compiled Agent/Host/package/manifest 实际文件哈希与已接受值全部一致；当前 Agent 与 Host 正式导入各 1 处。
- 有限文件检测到 16 个控制；原 13 个名称仍在，特别保留 `unknown-unrelated-tool-error` 为 RED，新增答前已知写入拒绝 PASS、答后已知写入拒绝 RED、合法问题顺序变化 PASS。
- 清单对批准输入的差异只有 `consumer.bytes` 与 `consumer.sha256`；服务与 README 和批准输入逐字节一致。

## 边界与阻碍

Git 全程只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；没有提交 SHA。一次只读 `git status` 被 `dsh` 子模块权限拒绝，按令未修复权限、锁或审批。早期三次命令因执行参数误写为 Bash 启动器，均在载荷执行前被 MXC 拒绝；未启动 setup、未切换 legacy、未修改沙箱、审批或 ACL，也未拆 writer 锁。

请根执行者继续完成完整源码/delta/finite/allraw/typed/setup 审计，再运行有限 16 控制与 ESM/准入检查；通过后由同一个原始实际场景走报告、人工复核和操作系统进程清理闭环。
