# A 线交回件 — T34 Native Relay 精确契约编辑

- 交回时间：2026-10-31
- 执行令：`D:\Lawbeach\lawbench-coord\A-T34-native-relay-exact-contract-order-20261031-040222.md`
- 执行范围：仅一次有界源码编辑 + 目标文件元数据 + 本交回件。其余动作（测试、运行、Git 写入、联查旧历史）均未执行。

## 1. 结论

已从 known-good 基线完成全部 7 处字面替换，写入唯一目标文件；未执行任何运行/测试，源码作者身份保持"未跑"。文件为 UTF-8 无 BOM、保持 LF 行尾，全部缩进与既有格式未动。

## 2. 输入与输出

- 基线（只读，未改）：`D:\Lawbeach\lawbench-coord\T34NativeRelayExactContractInput-20261031-040222\known-good-source.py`
  - SHA256：`A43E338C5A799DB15199195B191EE9432A14AA5AF5032E25FD99893D68D1B7C3`（与执行令一致，开工前已校验通过）
- 目标（唯一写入）：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-relay.py`
  - SHA256：`4887D321AEBA3B94C3F989F8A8BCFE676E12B8331EF13A9420F41458B409E1F7`
  - 字节数：32566
  - 修改时间（UTC）：2026-10-30T20:03:58.3021721Z
  - CR 计数 0 / LF 计数 857；UTF-8 BOM：NO

## 3. 已施加的七处改动

| 编号 | 改动 | 结果 |
|---|---|---|
| A | `class NativeSseStream:` → `class NativeSseStream(pinned.httpx.AsyncByteStream):`（4 空格缩进保留） | 命中 1 处 |
| B | `self._source = source` 后新增 `self._iterator = source.__aiter__().`（12 空格） | 新增行 1 处 |
| C | `chunk = await self._source.__anext__()` → `chunk = await self._iterator.__anext__()`（16 空格） | 命中 1 处 |
| D | `self.aclose_called = False` 后新增 `self.aclose_completed = False`（12 空格） | 新增行 1 处 |
| E | `await self._source.aclose()` 后新增 `self.aclose_completed = True`（12 空格，紧随 await 兑现） | 新增行 1 处 |
| F | `native_stream is not None and native_stream.aclose_called` → `... and native_stream.aclose_completed` | 命中 1 处 |
| G | 仅内层 handler：`except Exception:` → `except (Exception, asyncio.CancelledError):` | 命中 1 处（16 空格） |

G 项定位证据：结构扫描得到 2 个候选 `task.cancel()`→`try:`→`wait_for(task, timeout=CLEANUP_TIMEOUT_S)`→`except` 块，缩进分别为 12 空格与 16 空格；按执行令要求锁定 16 空格的内层块。改动前后该块逐字如下：

改动前：

```
                task.cancel()
                try:
                    await asyncio.wait_for(task, timeout=CLEANUP_TIMEOUT_S)
                except Exception:
```

改动后：

```
                task.cancel()
                try:
                    await asyncio.wait_for(task, timeout=CLEANUP_TIMEOUT_S)
                except (Exception, asyncio.CancelledError):
```

外层 12 空格 `except Exception:` 未改；全文剩余 `except Exception:` 8 处，`except (Exception, asyncio.CancelledError):` 1 处。未捕获 `BaseException`，未去缩进，未新增 helper/import/class/条件。

## 4. 未执行与边界

- 未运行源码、未运行任何测试、未安装依赖、未发起 HTTP/真实传输/TLS/Key/模型调用；`native-relay.py` 目前为"作者已改、作者未跑"。
- 未做 SDK/产品代码字节改动；其余 3 个源文件未触碰，仍为字节保持。
- Git 全程只读：未 add/commit/rebase/stash/reset/clean/checkout/push；工作区原有 dirty 状态保留。
- 旧 formal/status/raw/snapshots 文件未重写；本次只新增本交回件这一份新文件。
- 未使用 `apply_patch` 修改 Python 源码（按执行令要求改用 `System.IO.File.ReadAllText` + 字面替换写入）。

## 5. 过程中的阻碍（无残留）

- 第一次编辑尝试在**写入之前**被自身的缩进前置校验拦下（内层块定位到的是 12 空格候选），因所有写入均发生在校验之后，目标文件未被创建或污染。第二次改为按结构定位后一次成功。该失败尝试未产生任何文件副作用，也未触碰不可变基线。
- 已知-good 基线与三个旁系源文件均未被修改，无需恢复。

## 6. 遗留

- 源码的运行验证（RED/GREEN、内存态、真实 POST）按执行令留给 Root 侧控制；本线交付的是"已精确编辑、未运行"的源码本体。
- 本次改动未触及 `docs\src\*.md`、未触及 `skills\`，故未触发 `build_docs.py` / `build_skills.py`。

## 7. Git 状态

无提交、无暂存。交付以本协调目录文件为交回件，符合本运行令的只读 Git 边界。
