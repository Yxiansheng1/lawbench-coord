# B 线交回：T18 真实导出器续接

状态：`AUTHOR_READY_NOT_RUN`

交回时间：`2026-10-29 Asia/Taipei`

## 结论

B 线已按正式执行令完成两件新产物：生产导出器续接脚本和 README。脚本尚未执行，因此本轮没有生成 DOCX、没有新的 `applied/manual/XML` 运行证据，也没有任何“完整 T18 通过”或业务质量通过声明。

原报告的不可变事实保持不变：

- 原始报告 SHA256：`020dc959e3fc3732ff4eaa8bc604d03da3a5d999802e3d90ec5ac9850e71ce6c`
- 原始报告状态：`FAILED`
- 已完成真实任务：`T-20261028234100-6b49`
- 案件 UUID：`9d535ab5-f14c-42cc-bd99-a2f669ff6200`
- 原生会话：`session-1cb28369-3a90-46dc-b047-e64986038394`
- 原生 R：`60fda87b-25a9-40c1-9abd-1e4893fa7b8b`
- 真实模型修改清单：6 条；5 条接受；第 5 条因 `find 跨越域代码或超链接` 留人工处理
- 草稿仍保留风险 3 的 `original 4.1`／正文“合同第七条”业务质量错误
- `fullT18PASS=false`
- `businessQualityPASS=false`
- `Packaging=HOLD`

## 新产物

| 路径 | 字节 | SHA256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\continue-genuine-exporter.py` | 43604 | `9536fae3ed58e78e6e0bdedfa2c6e625fcedadd528808f5e5009f0184aefb567` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\README.md` | 2445 | `ec039fa34e0742850abb3da5452a77102b9a90dcfa1f7229b55e361b68531807` |

正式执行令 SHA256：`01e91cbf20df10bbb42b63de6f28e5e28fe8533e02162b063923916dfdac3ac8`。

目标目录当前只有上述两个文件；没有 `owned-root-*`，没有生成 DOCX 或运行报告。

## 已做核验

以下均为作者阶段只读检查，不是脚本运行结果：

1. `genuine-inputs.json` 为 `e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1`，与令一致。
2. 原案卷 16 个文件、原生会话 1 个文件均逐项匹配清单中的字节、SHA256 与 `mtime_ns`；当前失配 0。
3. 两份外部材料夹具均匹配固定输入清单；当前失配 0。
4. 346 个 B 源码 pin 全部匹配；pin 清单 SHA256 为 `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379`。
5. `service/lawbench/tools/drafts.py` 仍为 `20481` 字节，SHA256 `e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822`。
6. 真实模型 `case_save_edit_list` 调用与交付输入中的 `actual-edits.json`、案卷修改清单一致。
7. 最终草稿哈希与清单一致，且仍包含人工修改说明和“合同第七条”业务错误。
8. 脚本文本审计：无重复定义；未见 `uvicorn`、`asyncio`、`subprocess`、socket、requests、环境变量 Key、Keyring、`.start()`、`.stop()` 或 Git 调用。
9. 工作树既有脏改未动；针对本任务目录的只读 Git 状态只有两个 `??` 新文件。

## 脚本边界

脚本先预检、再要求 `--owned-root` 为证据目录下不存在的新子目录。它会把已完成案卷逐字节复制到新根，使用私有 appdata 和假令牌装配生产 `create_app`，安装拒绝型 Key getter 与 `httpx.MockTransport`，立即把 `retainer` 换成既有关闭哨兵，然后：

- 不进入 lifespan；
- 不起 ASGI、HTTP、端口或转发；
- 不启动 OCR、retainer、模型或管线；
- 用 `CaseRegistry.open(..., template=None, kind=None)` 打开复制案卷并保持原 UUID；
- 用现有 `TaskStore` 读取已完成任务；
- 直接调用生产 `Exporter.redline`，仍指向原任务的真实修改清单；
- 验证 DOCX 已在同一已完成任务登记；
- 独立检查 ZIP/OXML 的 ins/del/批注计数与文本、表格、超链接、外部关系字符串和无关 ZIP 部件；
- 前后核对源案卷、原生 JSONL、夹具、报告、固定输入及 346 个 pin；
- 仅允许复制案卷中的 DOCX 新增、`result.json` 追加登记、`case.db`/WAL/SHM 的必要重定位；
- 在 `finally` 内只关闭本次 owned net client、产品日志和哨兵，不关闭或声称关闭原 `RetainerDriver`。

成功后只允许声明“生产导出器技术链通过”；报告内固定保持 `fullT18PASS=false`、`businessQualityPASS=false`、`wordGUI=false`、`legalAcceptance=false`、`Packaging=HOLD`。

## 主编排下一步

完整复核脚本后可执行：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' `
  'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\continue-genuine-exporter.py' `
  --owned-root 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\owned-root-20261028-235617'
```

运行产物应在：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\owned-root-20261028-235617\continuation-report.json`

## 偏差与阻碍

- 按要求未做 Python/Node/parser/import/compile/build/self-test/HTTP/model/GUI/SSH 运行。
- 未做任何 Git `add/commit/rebase/stash/reset/clean/checkout/push`。本交回不是提交，没有提交 SHA。
- 普通 `git status` 仍因子模块 `dsh` 的只读权限报 `Permission denied`；随后用 `--ignore-submodules=all` 完成只读状态核对。该问题不是本任务交付阻碍，未改权限、锁或审批。
- 过程中三次工具参数误填 `bash.exe`，均在命令启动前被 `ACCESS_DENIED`，没有执行命令或改变状态；随后全部使用指定的原生 `pwsh.exe`。没有使用 bash 包装实际工作。
