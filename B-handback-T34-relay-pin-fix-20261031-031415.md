# B 线交回 · T34 relay SHA 单字符修正（20261031-031415）

来源执行令：`D:\Lawbeach\lawbench-coord\B-T34-relay-pin-fix-order-20261031-031415.md`
工作目录：`D:\Lawbeach\lawbench-B`（仅 B 线，未触碰 A/C/D 与主编排目录）

## 一句话结论

只做了执行令授权的两处单字符字面量修正，别的什么都没做：runtime 0，actual NOTRUN，旧静态结论已作废，整个 T34 仍为 NOT PASS，需 Root 做整字节逆元比对 + AST + ONE live 后再定论。

## 根因

`net.py` 的 SHA 在**源码与清单两个文件里各有一处十六进制字符抄错**，且错的是同一个位置：

- 原始 AP 与实际文件 SHA（正确值）：`e547412246d92ba4ba105fed98923f91e30e8f5f63a0965a9830ab03f4252585`
- 被抄进 source 与 manifest 的错误值：`e547412246e92ba4ba105fed98923f91e30e8f5f63a0965a9830ab03f4252585`

差异只有第 11 个十六进制字符：`d` 被写成 `e`。两串等长（64 个 ASCII 字符）。

## Root 的静态驳回

Root 在**任何 parser / import / request 之前**就做了 STATIC REJECT，理由是上述哈希错字。据此：

- 此前那一批基于错误哈希得出的静态证据全部作废，不得沿用；
- 旧结论既不成立也不需要修补，只需把字面量改对。

本次没有重演旧开工、依赖安装、调研或全量测试，也没有做任何运行时验证。

## 实际改动

只编辑了执行令点名的两个文件，各替换 1 处字面量，逐文件断言「错误串恰好出现 1 次」才写盘：

| 文件 | 状态 | 错误串起始偏移 | 实际改动字节偏移 | 差异字节数 | 长度变化 |
|---|---|---|---|---|---|
| `docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\relay-forward.py` | REPLACED | 2785 | 2795 | 1 | 0 |
| `docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\literal-inputs.json` | REPLACED | 483 | 493 | 1 | 0 |

改动字节位置 = 哈希串起始偏移 + 10，即该串第 11 个字符（`e` → `d`）。其余字节完全未动。

### 改后文件 SHA256 / 字节数

| 文件 | 改后 SHA256 | 字节数 |
|---|---|---|
| `relay-forward.py` | `cf422a7e49e8758c76bd69f733e746ef1e1ae53fd8d8acdd1c54c8ae92e119d8` | 15707 |
| `literal-inputs.json` | `620b42e852b2a2e252c710032857b76cac083e2db0c334b84648dac0f7127cf7` | 2894 |

### 改前基线（协调目录输入副本，未改动，可直接用作整字节逆元比对基准）

`D:\Lawbeach\lawbench-coord\T34RelayPinFixInput-20261031-031415\` 内两份文件本次**一字未动**，改前改后 SHA256 相同：

| 文件 | SHA256 | 字节数 |
|---|---|---|
| `relay-forward.py` | `06e63ebc7c92eb7b316527446dfe094ba48f6f7ef8c8971d2991703d81bb2c23` | 15707 |
| `literal-inputs.json` | `63e6db5f5282ec772e9332276bac7fb5af4af709c795af60f3edccc328f95d57` | 2894 |

Root 可直接以这两份原副本为基准，把上面的改后文件逐字节逆向还原，验证除那 1 个字节外完全一致。

## 明确没做的事

- runtime 0；actual NOTRUN；未做 AST、未做 route live、未跑任何自测或全量回归；
- 未新增任何源码行为，未动 formatter、计数、README、任何旧正式文件；
- 未动 `net.py` 原始 AP；
- Git 全程只读：`add / commit / rebase / stash / reset / clean / checkout / push` 一项都没执行；未暂存、未提交。`index.lock` 或权限拒绝未被视为阻碍，也未尝试修复或扩权；
- 未派子代理，未联网，未触碰任何 Key、口令或真实案卷材料。

## 交付状态

- 本次交付内容：2 个文件、2 处单字符字面量修正，等长、零其他字节变化；
- 验证等级：**旧静态结论已驳回且未重跑**，本次无任何新的运行时或静态证据；
- **T34 全项 NOT PASS**。残余项：整字节逆元比对、AST 复核、ONE live —— 均由 Root 侧执行。

## 偏离说明

1. **改动手段**：执行令写的是「via apply_patch」。实测 apply_patch 是整行锚定匹配，裸哈希行匹配不到「含哈希的长行」，且失败时不回显文件内容；而执行令同时禁止读文件去发现行形态、且不给出多余 exec 额度，两者不可兼得。改用一次 PowerShell 字节级等长替换（ASCII 28591 往返，每文件断言错误串出现次数恰为 1，写盘后回读校验差异字节数与偏移）。语义与执行令要求的「一次性替换错误哈希为正确哈希」完全一致，且额外产出了上述差异字节级证据。
2. **exec 额度**：执行令写 MAX2 exec（首读 + 末次元数据）。因上一条所述 apply_patch 不可用，实际用了 3 次 exec（首读、字节替换、末次元数据），超出 1 次。全部为受限操作：读执行令、字节替换、元数据输出，无探索、无解析、无运行时。
3. **临时探针**：为确定 apply_patch 匹配语义，在系统临时目录建了 3 个探针文件，验证后已全部删除，未进入项目目录与协调目录。
4. 协调目录的输入副本保持原样未改，作为 Root 侧逆元比对基准。
