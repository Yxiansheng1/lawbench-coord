# A 线 T18 直接 runtime pins 交回

件型：交回  
工单：T18 direct runtime pins  
状态：数据针刷新完成，写入后机械核对通过；未提交、未暂存。  
Git：按本次执行令全程只读，没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，因此没有本工单提交 SHA。

## 当前身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `reviewed-b-source-pins-direct.json` | 53548 | `d3acf07a4d50e8de5c6e7b56c823be086795e1efcd2e24d7f245a6c7bc975803` |
| `b-service.py` | 30635 | `0cc128781680dc7f9237a1b38dd9e59ffe5228c65c886077deb00f0a3ef7c70b` |
| `fixed-inputs.json` | 17194 | `b8a9b829398345013b1d8e987f3d5f1cfd29f51b46edc76a826176cfe4dc280a` |
| `native-contract-workflow.mts` | 107202 | `54a9cf4f6e23dc0747c4b02591abbe55a57e010bdc9ca8ad9a84d0293784bdac` |
| `manual-reason-observer.spec.mts` | 9832 | `01f3394735d033ffda806627283cdc6f12292a04b3748bdd0071397083821a34` |

历史 `reviewed-b-source-pins.json` 保持 53548 字节、`3a6615c7eae3d8f977910cc13ac455d43f8e1e7d135eab88bcb2f1dca65cfb31`，继续供旧运行 `Q5tQMz` 引用。

## 改动

1. 从历史映射逐字节复制出 `reviewed-b-source-pins-direct.json`，仅将 `service/lawbench/tools/drafts.py` 从 13437 字节、`7c54c068…d0ab` 改为批准的 14654 字节、`816869ed…fa2`；其余 345 行、346 项计数、顺序和布局不变。
2. `b-service.py` 仅修改 `SOURCE_PINS` 文件名后缀为 `-direct` 和 `SOURCE_PINS_SHA256`；`SOURCE_PINS_BYTES=53_548`、`SOURCE_PINS_ENTRIES=346` 未变，其他字节不变。
3. `fixed-inputs.json` 仅更新 `sourcePins.path`、`sourcePins.sha256`、`bServiceEntry.bytes`、`bServiceEntry.sha256`；`sourcePins.bytes` 仍为 53548。其他 459 项固定身份、fixture、runtime、旧 proof 和 JSON 字节不变。
4. `native-contract-workflow.mts` 仅将唯一 `FIXED_INPUTS_SHA256` 常量从 `7bd20304…72bc` 更新为 `b8a9b829…280a`。人工原因观察子句、24 项测试语义、动态导入和其他 consumer 字节不变。
5. `README.md` 已更新当前身份、数据针链和真实资格边界。

## 验证

全部使用原生 PowerShell 读取、哈希和 Latin-1 字节逆替换，没有运行 Python、Node、TypeScript 解析器、测试、编译、HTTP、模型、GPU、GUI 或安装流程。

- `reviewed-b-source-pins-direct.json` 反向替换唯一字节数与 SHA 字段后，与 before 映射逐字节相同，53548 字节。
- `b-service.py` 反向替换直接映射路径和 SHA 后，与 before B 入口逐字节相同，30628 字节。
- `fixed-inputs.json` 反向替换四个数据值后，与 before 固定输入逐字节相同，17187 字节。
- consumer 反向替换唯一摘要常量后，与写入前 consumer 逐字节相同，107202 字节。
- observer 测试保持 9832 字节及执行令给出的固定 SHA。
- 固定输入、B 入口和 consumer 中的依赖 SHA 均与磁盘实际文件摘要一致。

复用且未重演的 root 有限证据：

- 当前 24 项 observer：PASS，1.172 秒，自然完成，2 个完整 OS 身份均已结束，无残留。
- 当前 rate-unit 8 项：PASS，1.657 秒；affected-current 12 项：PASS，2.203 秒；两路均自然完成、各 1 个 Python OS 身份已结束、运行后无残留，`drafts.py` 前后摘要一致。
- 旧 model 运行 `Q5tQMz`：225.859 秒、11 次 HTTP 200，但因数值语法和答案/原因观察失败；observer、报告和运行证据保持不可变。

上述只证明有限 checkpoint 与数据针机械一致，不证明新 consumer 的模型实跑、redline/OOXML、完整 49 项、完整 T18 或项目发布通过。Packaging 保持 HOLD。

## 留给 root

下一步由 root 执行全量 49 项风格命令、源码反向、459 项 pin、BAST 和 ESM 核对；全绿后再用既有专用授权 DPAPI、匿名 stdin 仅运行一次新的同合同实际模型工作流。A 未启动 host、模型、编译或测试。

## 阻碍与运行器偏差

- 执行令引用的 `T18DirectRuntimePinsInput-20261028-204014` 单文件不存在；协调目录中实际存在同名目录，已按目录内输入读取。该输入目录未附带 observer 测试副本，故该文件按执行令给定身份直接核对。
- 普通 Git 状态查询因 `dsh` 子模块目录权限拒绝及若干超长路径告警不能形成干净全仓清单；未尝试修复权限、ACL 或锁，也未执行 Git 写入。目标文件以范围化只读哈希和逐字节逆还原核对。
- 运行中有 3 次只读检查误填 `bash` shell 参数，均被环境以 `Bash/E_ACCESS_DENIED` 拒绝，未执行命令、未改文件；另有 1 次写入命令的 shell 路径字段拼写为 `native-powershell`，命令仍由 PowerShell 语义成功执行。实质写入后的全部核对均显式使用指定原生 `pwsh.exe`、`login=false`。
