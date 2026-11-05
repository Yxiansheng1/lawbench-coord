# HANDBACK-A-T18QualityOtherActual-20261031-1815

## 结论

状态：`SOURCE_PREPARED_NOT_RUN`

已按正式执行令完成两套已验收原消费者的有界元数据重绑：

- 通用文书：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QualityGeneralActual-20261031-1815\`
- 诉讼文书：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QualityLitigationActual-20261031-1815\`

每套目录含 consumer、B 服务副本、固定输入清单、有限 helper 和 README，共 5 个文件。没有运行正式 consumer，也没有产生新的 actual、功能通过或业务验收声明。

## 有界改动

两套 consumer 和 B 服务副本的 `SOURCE_PINS` 均重绑为：

- 路径：`D:\Lawbeach\lawbench-coord\T18QualityCurrentInput-20261031-173317\reviewed-b346-current.json`
- 字节：53548
- SHA-256：`0da04b925d421c711b7c6ef8d8bbc049b75c04fba537ba2275efc0a642b81847`
- 入口数：346，未改

两套 consumer 的 compiled Agent/Host 静态导入及清单 `compilerPrivate` 均重绑为已验收 private25 构建：

- 根：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QualityPrivateBuild-20261031-173317\private-output-20261031-180837`
- Agent：560271 字节，`245e6a7d53fac32a5108be69b18b6c7102114dcfaf62a12597eefcd1904731c7`
- Host：904755 字节，`ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba`
- package.json：1257 字节，`3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`
- manifest.json：58591 字节，`a9ba84e7b92b80f864122616be859521eda9d3570b8252bac05f7f9c0215ac3c`

两份清单还重绑了自身 `consumer` 与 `bService` 的路径、字节数和 SHA-256。除此之外，原 consumer 的函数、prototype、guard、回调语义、任务与 Skill、材料、approved inputs、模型、预算、setup/cleanup 和断言均未按令改写。

两份有限 helper 按令逐字复制，未改其内部旧 source 身份，也未执行。它们不是本轮 actual 证据。consumer 仍以 `EVIDENCE_DIR` 从自身目录派生清单和服务路径，根包含关系随搬迁保持。

## 最终字节身份

以下身份来自重绑后的原生字节数/SHA-256 汇总。清单随后只填入了自身 consumer/bService 身份；未在清单最终保存后再做哈希，遵守本令的一次有效最终汇总边界。

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `QualityGeneralActual-20261031-1815\native-general-drafting.mts` | 109572 | `27b093e733851126f7c92d71b98a999e198ab3dec34ec3f66804877e56ee8c43` |
| `QualityGeneralActual-20261031-1815\b-service-general-drafting.py` | 42450 | `d5e9c196f2a280b3fa3816756dd612226852ccfdd350b4adc77bcd5bbe31ac06` |
| `QualityGeneralActual-20261031-1815\general-read-order-finite.mts` | 16315 | `08c5e9bca8c18122af3a021545724f8751f2d23d9b3b0af285990f1e438e3a86` |
| `QualityGeneralActual-20261031-1815\README.md` | 2142 | `7e479d9663aa21edd9b82c6f97452768c34678c3fcc3d26ff3455eda0a49b1e7` |
| `QualityLitigationActual-20261031-1815\native-litigation-docs.mts` | 127226 | `82ed992bfe16069b24021de0dc2e08496bc733152e9f802ebf49d4b8a7edad01` |
| `QualityLitigationActual-20261031-1815\b-service-litigation-docs.py` | 46305 | `1bd8351632f2b898fcba075d8714c960d566dab89f498d6f1c2f7c6385a5a58b` |
| `QualityLitigationActual-20261031-1815\observer-replay-finite.mjs` | 24524 | `424ba29c59629250aa0b402a662888999362e0d8d33f96926d179dc39a47e542` |
| `QualityLitigationActual-20261031-1815\README.md` | 2238 | `035004ca77fd3a0064ca71cf7a82e0cbe9cd0ee0cbd22a98d4a7104fa8716cdc` |

两份最终 `literalfixed-inputs.json` 在自身身份写回后未重算哈希；根执行者应从这两个目标文件重新取最终身份完成封存。

## 原始异常

- 首轮 B 通用 consumer 读取输出在 46357 tokens 处被工具截断。
- 首轮 B 诉讼 consumer 读取输出在 54175 tokens 处被工具截断。
- 上述截断后只对指定源文件做定向文本读取，没有扩大到材料、答案、参考或 oracle。
- B 通用目录的 README 身份表已陈旧：表列 consumer 108578 字节和 helper 14005 字节，但其当前 `literalfixed-inputs.json` 的 consumer pin 为 109576 字节；复制到的实际 helper 为 16315 字节。未用 README 旧数字替代实际文件，也未改 helper。
- 第一次最终哈希汇总的默认表格格式截掉了 SHA 列，随后以紧凑单行格式重做有效汇总；因此哈希读取调用共 2 次，第一次为格式失败、第二次成功。
- 第二次哈希汇总的 `shell` 参数误写为 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native-powershell\pwsh.exe`，不是执行令指定的 `...\dependencies\native\powershell\pwsh.exe`；该命令仍由原生 pwsh 路径环境执行并以 0 退出，未使用 bash。未再重跑哈希。
- 未发生 managed MXC 拒绝，未启动 setup，未切 legacy，未改变沙箱、审批或 ACL。

## 命令边界与计数

在写本交回前，共执行 20 次 `exec_command`：

1. 正式执行令读取 1 次。
2. 指定 B 源和固定绑定元数据读取 4 次。
3. 定向字面量文本扫描 6 次。
4. 清单、绑定与静态导入段读取 5 次。
5. 目标存在性只读检查 1 次。
6. 新目录创建及 10 个文件机械复制 1 次。
7. 哈希汇总 2 次，原因见“原始异常”。

另执行 5 次 `apply_patch` 完成上述有界文字修改；写本交回是第 6 次。

没有执行 Git 读写、Node、TypeScript、Python、parser、AST、tests、import、build、prepare、GUI、HTTP、模型、凭据读取、selftest、产品代码或正式 consumer。没有接触 Git index/lock，没有拆 writer 锁，没有修改 B 文件，没有联系其他聊天或更换 API。

## 根执行者下一步

1. 对两份目标 consumer/服务/清单做逆向源码审计，确认仅发生上述字面量重绑。
2. 对两份最终清单重取自身身份并封存。
3. 分别运行一次全新 actual consumer；两套各只跑一次。
4. 按原任务完成人工业务/法律复核、进程清理与报告核验。当前不得把本交回解释为 actual PASS。
