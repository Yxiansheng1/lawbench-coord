# A 线交回：T34 行数修正

状态：`STATIC_FIX_HANDED_BACK_ONLY`  
不是 `T34 PASS`，也不是原生 GUI 验证结果。

## 依据与边界

- 执行令：`D:\Lawbeach\lawbench-coord\A-T34-read-line-count-order-20261030-131236.md`
- 批准前快照：`D:\Lawbeach\lawbench-coord\T34ReadLineCountInput-20261030-131236\approved-inputs.json`，3635 字节；SHA256 `ceeb481f6295213f3e3d247e8f3f533283b3890fbe702c1ebd08ec78e2416878`。
- 未改产品源码、测试、README 或其他观察器；未重演 prepare/start/GUI，未调用 Node、Python、模型、HTTP 或进程探测。
- Git 严格只读。初始 `git status --short` 因 `dsh` 子模块目录权限被拒而非零；没有尝试修复权限、改锁、暂存、提交、rebase 或改变沙箱/审批。

## 有界修改

`start.ps1` 仅把旧投影观察器的目录行从默认 1 次改为显式 2 次：

```text
@{ Line = "        stateDir: $observerStateJson"; Label = 'projection observer state directory'; Occurrences = 2 },
```

- 旧：86055 字节，SHA256 `18ad536c18f6dda0d6ba056e84e95f052eb085bead5771acc4077007e9ad94da`
- 新：86072 字节，SHA256 `d9e31fc10a3149c923dd618b6a8ac6572939727b51a8615d2a1f60309e2a1119`
- 唯一插入为 17 字节 ASCII `; Occurrences = 2`，偏移 62256；公共后缀 23799 字节。从新文件删除该插入后，与批准旧文件整文件逐字节完全相等。
- 新严格 2 次全局检查、两处完整行检查及其他全部字节均保留；没有弱化断言。

`literal-inputs.json` 只刷新 handoff 行：

- 第 217 行：`"bytes": 86072`
- 第 218 行：`"sha256": "d9e31fc10a3149c923dd618b6a8ac6572939727b51a8615d2a1f60309e2a1119"`
- 新旧均 25656 字节；旧 SHA256 `581fad3d55330f3976659f024af3e2649bd2c694ca082e43943fcc9f2287d899`，新 SHA256 `5714249986c559e7a6302bc0691603219902afeccc14b950f6f6f71181c22867`。
- 定向逐行比较仅第 217、218 行变化；其他基线/data/files 字段未改。

## 最终十文件

| 文件 | 字节 | SHA256 |
|---|---:|---|
| entry.py | 88657 | `d7b334aebbeb39d289ce9ada1bad040bfde9aedeac76254195dbe602d49fef4b` |
| literal-inputs.json | 25656 | `5714249986c559e7a6302bc0691603219902afeccc14b950f6f6f71181c22867` |
| observer-finite.mjs | 6845 | `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb` |
| prepare.ps1 | 13566 | `185fca19732ce43442049ab62aef9e48758079a3ee6de51992a64ec8b1711a53` |
| private-provider-binding.mjs | 2499 | `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e` |
| projection-observer.mjs | 20058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| README.md | 2334 | `9c3f5c8d98d83a2850d5046e6c3135d056ebda341c1acb59d1988d286a3c9648` |
| settings-read-observer.mjs | 11508 | `d432716c870f45986b7a467b5d56e3c5baa26ab9b9feb33af8c7e83821cc1e80` |
| start.ps1 | 86072 | `d9e31fc10a3149c923dd618b6a8ac6572939727b51a8615d2a1f60309e2a1119` |
| stop.ps1 | 7183 | `edd3e9ddd31650246fdc726fad8cc1aab536af843e4f49c303b75290dbfd8bbc` |

目录实际文件数 `10`；除上述两个目标文件外，其余 `8` 个文件与批准快照逐字节一致。

## 计数与未运行项

- 本执行者到交回草稿前的 PowerShell 调用：25；成功 24；非零 1（初始只读 `git status` 的子模块目录权限拒绝）。
- Git 写操作：0。
- 目标运行时、Node/Python、解析器/AST、import/check/test/build、GUI、HTTP、模型调用：0。
- NOT RUN：prepare、start、GUI、观察器捕获、有限五控件、停止/OS 关闭、UI 无源码变化检查、打包、原生投影 PASS、整 T34 PASS。

下一步按执行令由 Root 做有限五次及一次实际 GUI 闭环；本文件不宣称这些步骤已通过。
