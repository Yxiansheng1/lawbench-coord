# B 线交回：T18 Changed Search Guard Binding

状态：**AUTHORED_NOT_RUN / PREPONLY / MODELNOTADMITTED**

交回时间：2026-11-01  
执行线：B  
任务入口：`D:\Lawbeach\lawbench-coord\ORCH-B-T18ChangedSearchGuardBinding-20261101-063909.md`

## 交付结果

已按正式执行令和 `approved.json` 创建唯一目标目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18ChangedSearchGuardBinding-20261101-063909`

目录中只有以下 3 个文件：

| 文件 | 字节数 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 156902 | `c0bf7bd47d21ebcb6c0ed029368ec65ea2a156cf0f20876e60371caea2770956` |
| `b-service-defense-opinion.py` | 53726 | `8857db3dc14b8485914639b78dd39eef79551880d0c408e666b4bf15fcabed35` |
| `literalfixed-inputs.json` | 12051 | `3f36e81b571d78ad15e8c0d81fa82cf436a10f8b3af35589ba5d52f1dac6d1e1` |

三项字节数和 SHA-256 均与 `approved.json` 的 `expected` 值精确一致。文件由批准的 `before-*` 来源创建；Python 文件为零替换逐字节复制，MTS 与 JSON 只执行了批准的字面替换，且写入前逐项核对了规定命中次数。

## 保留边界

- 原始 `APPROVED_INPUTS_PATH`、`SOURCE_PINS_PATH`（B346）路径和字节数未改动。
- 原任务、模型 `qwen38-27b`、最大输出 49152、温度 0.6、预算 32/48、Skill、prompt、callback answers、assertions、guards、disposal、request digest 均未改动。
- 未改动函数、helper、import、retry、watchdog、runtime 或 permission 逻辑。
- MTS 仅固定更新 4 个 current runtime pin 路径、agent 的字节数/哈希，以及 manifest 的字节数/哈希；Python 与批准值逐字节一致。
- 未复用旧的 served root，未复制、运行或探测消费者。
- 未执行 model、Key、admission、runtime、consumer、HTTP、app、GUI、env、credential、测试、构建、采集或准备执行操作。
- 未执行任何 Git 写操作；按要求未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 本次只新增上述证据目录和本交回文件，没有改动既有 dirty 文件。

## 检查与阻碍

- 唯一允许的最终文件校验已执行一次，只覆盖三个新文件的字节数和 SHA-256；结果如上。
- 开工前的只读 `git status --short` 因既有子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝而失败。按令未尝试修复权限、改动锁或扩权；这不影响本准备交付。
- 首次受控 PowerShell 脚本在解析阶段因错误消息中的 `$变量:` 插值语法失败，执行前即停止，未创建目录或文件。修正插值后以同一有界操作重跑成功。

未来真实模型执行仍需 Owner 明确准入；本交回不构成模型已运行、消费者已验收或允许运行消费者的声明。
