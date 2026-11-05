# B 线 Capsule 入口边界修正交回

关联执行令：`D:\Lawbeach\lawbench-coord\ORCH-ToB-CapsuleFix-20261025-184310.md`

交回时间：2026-10-25

## 1. 结论

三个指定文件已按执行令完成有界修正：探针改为核对真实 `ready.case_path`、成功时按真实 JSON `null` 核对 `failure_code`，并实际发送正反两种重复 Authorization；服务端在非 GET 请求转交原生认证之前拒绝任一重复 Authorization，且不占用胶囊唯一写声明。README 只补充这一条边界说明。

未改产品源码、契约、Skills、A/旧入口、E50、外层 server、关闭字段或既有网络边界。Git 保持只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

当前状态：**代码修正完成，待主编排做根级复核与有限真跑；打包 HOLD。**

## 2. 改动差异

- `docs\plan\evidence\Capsules\NativeEntry-20261025-183517\probe.mjs`
  - `request()` 的 Authorization 支持直接传入原样字符串数组；单 Token 分支仍生成同一个 `Bearer <token>`。
  - 固定 `prepared.paths.root` 核对保持不变；删除不存在的 `ready.root` 核对，改为深度规范化后比较 `ready.case_path` 与 `prepared.paths.case.path`。
  - 最终 `failure_code` 的期望由空字符串改为 `null`，其余 outcome、close、route、credential、guard、source、fixture、lifecycle 与日志脱敏断言保持不变。
  - 在首个合法 PUT 之前加入两次真实 TCP PUT：`[valid Bearer, invalid Bearer]` 与反序各一次，均要求 403；随后合法候选 B PUT 仍要求 200，验证未消费唯一写机会。无效值仅为 `Bearer synthetic-invalid`。
- `docs\plan\evidence\Capsules\NativeEntry-20261025-183517\server.py`
  - 在 `Firewall` 的非 GET 未认证转交分支之前统计 scope headers 中小写等于 `b"authorization"` 的字段数。
  - 数量大于 1 时通过既有 `_guard_reply` 返回固定 403 `DUPLICATE_AUTHORIZATION` 并立即返回，不进入原生认证、不进入写声明路径。
  - `ROUTES`、固定 PUT/reset 范围、常量时间比较、token 内存、phase、once、canonical、file、sparse 等既有检查未改；服务端未增加 `ready.root`，关闭字段未改。
- `docs\plan\evidence\Capsules\NativeEntry-20261025-183517\README.md`
  - 仅把重复 Authorization 的拒绝补入原第 3 条边界；命令、时限、轮询和其他边界不变。

## 3. 验证状态

本轮严格没有重演旧开工、安装、调研、全量测试或 GUI 运行，也没有联系其他会话或更换 API。

按执行令最多两次命令的硬限制，两次均用于只读入口：先读正式执行令，再以无登录绝对路径 PowerShell 读取完整投影输入。此后只使用文件补丁并写本交回件，因此本轮**未运行** Python 编译、服务启动、自检、Node 探针、fresh-root 真跑或 Git 状态查询。

没有把源码未变的旧证据改写为新通过结论；旧证据是否可继续沿用仍由主编排按源码身份核验后判定。本轮未产生或伪造 PASS。

## 4. 未运行项

- 未运行 `server.py` 的语法/AST 复核。
- 未运行 `ROUTES`/`Firewall` 修改范围的核对。
- 未创建 fresh run，未启动服务，未运行 `probe.mjs`。
- 未等待自然关闭，未生成新的 `ready.json`、`final-metadata.json`、`loop-closed.json` 或请求日志证据。
- 未运行 Git 状态、diff、rebase 或任何 Git 写操作。
- 未做打包、GUI、重启、真实 Host/RPC、模型、OCR 或整卡验证。

## 5. 已知原因与边界

旧探针首次会被两个与产品行为无关的断言阻断：读取不存在的 `ready.root`，以及把成功关闭产生的 JSON `null` 当作空字符串。它们已按真实未变服务行为修正，未通过修改服务端输出来迁就探针。

重复 Authorization 风险来自已安装 Starlette `Headers.__getitem__` 的“返回第一个匹配值”行为：旧防火墙取最后一个值，若首值有效、末值无效，会把请求当作未认证而交给原生层，原生层又按首值认证通过。新边界在任何这类转交前拒绝重复字段，正反顺序均覆盖。

投影输入的原请求上限为 32000 tokens，但运行器显示原始 19949 tokens 的传输在中段被截断；防火墙分支和三个待改文件的关键上下文仍按投影中的精确文本完成匹配。该传输截断是本轮不做全量或真跑判断的额外原因，不能据此宣称完整回归。

Node 内置 HTTP 若无法把数组编码成多个 Authorization 字段，首次真跑应按执行令记 BLOCKED，不能用单头、拼接值或模拟结果替代；同一原因再次失败即停止收缩，不做反复试改。

## 6. 复核入口与后续

主编排的下一步应先只读核对本次三个文件的实际 delta 与 `ROUTES`/`Firewall` AST 范围，再沿用源码未变的既有证据；随后用全新 run 做一次有限真跑，重点确认正反两种重复 Authorization 均 403、后续合法 PUT 仍 200，并检查关闭后 guard、请求日志脱敏及自然关闭字段。

若真实重复字段无法按数组发送，直接判 BLOCKED 并写明 Node 行为；若重新出现同一根因，停止迭代。验证完成前不进入打包，不宣称 GUI、重启、真实 Host/RPC、模型、OCR 或整卡通过。
