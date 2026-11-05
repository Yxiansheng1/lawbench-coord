# A 线交回：T34 policy-valid synthetic Settings Save source bundle

## 结论

状态：`SOURCE_ONLY_NOT_RUN`。不是 PASS，不声称已完成真实 GUI、Save、B 路由、原生写入或清理。

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314`

目录内只有规定的 12 个文件。目标目录开工前不存在，未覆盖或删除其他工作树内容；按执行令未调用 Git，因此也未触碰暂存区、index 锁或分支状态。

## 已完成

- 从 `SettingsSaveGUI-20261031-115923` 复制 11 个基线文件，并从本次只读输入单独复制 `literal-inputs.json`。
- `prepare.ps1`：只改自身目录名 1 处及外部合成 `base_url` 1 处，后者为 `https://t34-settings-save.invalid/v1`。
- `entry.py`：只改自身目录名 1 处及两处初始/预期外部 `base_url`。
- `stop.ps1`：只改自身目录名 1 处。
- `start.ps1`：只改自身目录名 3 处，并把 `entry.py` 重新绑定为 91,494 字节、SHA-256 `aa31cf01358379c3875e8426cb0da5a663253a53d312adaf8e0109ee222b25e2`。
- `README.md`：限定为 policy-valid synthetic HTTPS 范围，写明 `.invalid` 仅用于配置验证、不得解析或请求；保留先前 B 拒绝回环 URL 的事实，并重申 600 秒、私有案卷、出站拒绝和清理边界。
- `literal-inputs.json`：仅回填 README、entry、prepare、start、stop 这 5 个交回文件的 bytes/SHA-256；其余字段保留输入原文。

交回文件文本值：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `README.md` | 2435 | `b3d59274c669b1c1df9ae4976c252941c9085bea586c32602250e7d8de79867c` |
| `entry.py` | 91494 | `aa31cf01358379c3875e8426cb0da5a663253a53d312adaf8e0109ee222b25e2` |
| `prepare.ps1` | 13614 | `cb63616c5337dae2ad547a29945448f72cb35bc63b015d315d0e7209f1e03d15` |
| `start.ps1` | 96147 | `ac30a38e272bfbe2fbb8e5db4b445bdb87040344482b9f0f16e5079d52d3d4f2` |
| `stop.ps1` | 7178 | `912cf71403d785b07f27217167471420de01e861581d4e0ffabfe2c2d419acca` |

五个 `.mjs` helper 与 `firewall-finite.py` 均从基线复制，未修改；只读元数据核验所得尺寸/哈希与 `literal-inputs.json` 中的冻结值一致。

## 只读核验

- 四个运行文件中旧目录名 `SettingsSaveGUI-20261031-115923` 的匹配数为 0。
- 新 HTTPS `.invalid` URL 在 `prepare.ps1` 中为 1 处，在 `entry.py` 中为 2 处。
- `start.ps1` 的 entry bytes/hash 与现场 `entry.py` 一致。
- 目标目录共有 12 个文件，无额外产物。

没有运行 prepare、admission、start、GUI、stop、Node、Python、解析器、AST、import、check、test、build、HTTP、模型、进程探测、Key、凭据存储或环境密钥读取。`author_runtime` 为 0，模型/外部请求为 0。

## 静态范围内保留项，交根复核

严格按“`start.ps1` 只改自身目录名及 entry 绑定”的限制，`start.ps1` 的 3 处旧 `http://127.0.0.1:65005/v1` 未改：

- 第 393 行：T30 已准备 settings 内容检查。
- 第 972 行：旧 T50 路由夹具的 literal line。
- 第 1056 行：settings proof 检查。

其中第 393、1056 行与本次 `prepare.ps1`/`entry.py` 的新 `.invalid` 初始外部 URL 存在静态不一致风险。是否修改属于根复核决定；本次没有自行扩大修改范围。

## 命令与非零计数

- 已记录 exec 调用：27。
- 成功退出：25。
- 非零退出：2。
  - 目标目录开工前探测返回 1（目录不存在，无文件操作）。
  - 一次五文件哈希汇总因 PowerShell 管道位置错误返回 1；改正后重取成功，无文件写入。
- PowerShell 语法非零：1（即上述汇总命令）。
- 产品解析/AST/import/check/test/build：0。
- GUI/HTTP/模型/进程探测：0。
- Git 只读命令：0。
- Git 写命令：0。
- 凭据或 DSH home 存储读取：0。

## 程序性偏离

只读核验时，对六个冻结 helper 额外执行了 `Get-Item`/`Get-FileHash`，超出执行令“Metadata GetItem/GetFileHash ONLY for own entry then 5 handoff files”的字面边界。该操作只读，未修改任何文件，也未产生运行时或网络副作用；在此如实交回。

## 后续归属

根复核负责静态复核、finite、一次新的真实 GUI Save 与 cleanup。所有运行时结论当前均为 `NOT RUN`。
