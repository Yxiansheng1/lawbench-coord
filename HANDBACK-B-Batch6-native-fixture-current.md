# B 线 Batch6 真机 24 份引用材料交回

状态：源码交付完成，待 Root 绑定与执行。

## 结论

新资源位于：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\Batch6\NativeMaterials-20261103
```

本轮完成了 fresh run 准备器、严格服务入口、启动/停止脚本和 Root 绑定说明。源码使用真实 `CaseRegistry.open`、`Materials.import_(mode="ref")`、`Materials.list` 和当前生产 `create_app`。没有运行产品、服务、GUI、测试、模型、OCR 或 Git。

## 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `prepare.py` | 24440 | `951e5cbfd540b7b4c1f9d992dfa388908b4e76b14d1b42cf7ce9a9e92a0ae55f` |
| `entry.py` | 44738 | `23fdc7d8bca96af1086134082b9422745fca1eb52e20dfb6f580d28f585426c8` |
| `start.ps1` | 95462 | `429594fc05e94e2caf3fc27dff7d4a4e3aa8443baa06d34fa557db992dd95954` |
| `stop.ps1` | 7143 | `a75d07c67e7b67daacf3c76f173d223ca455950897cfc608b354e40d20e6218e` |
| `README.md` | 7689 | `41b8bd833c6d7b528be58deb400f63fe50b739038767612b7b807b2d05aa2374` |
| `private-provider-binding.mjs.template` | 2260 | `7f8ec740e3c38671939b96e0eefdfcc6cb4c3708020d28f335920db0e43dcd30` |

## 已落实约束

- 准备器只接受 `...\NativeMaterials-20261103\runs\B6-native-materials-YYYYMMDD-HHMMSS` 的 fresh 直接子目录。
- 24 个文件名固定为 `Test-material-01.txt` 至 `Test-material-24.txt`；前 12 个位于含“发票”的虚构参考目录。正文只有虚构测试标记。
- 已验收的 5 个 T30 文件复制进新案件，原 5 文件及两个旧 session 的固定字节/SHA 不变。
- 材料通过真实产品引用接口登记；外部文件不复制进案件，移除只允许取消引用。
- 设置沿用 Batch5 隔离形状，外部模型关闭，OCR 回退关闭；`daily-case.json` 指向新案件。
- 服务入口固定校验 prepared 清单、24 份材料、Root 绑定的 24 个编译输出和 3 个 native shim。
- `create_app` 使用当前生产实现，`lifespan="off"`，`MockTransport` 拒绝模型 HTTP，Key getter 启动时为 0，证件识别禁用。
- 只放行真实案件打开/最近、设置与胶囊读取、材料列出/引用导入/引用移除、task/output/wiki/OCR 状态读取。
- 启动器保留 Batch5 的真实 Electron 隔离、精确 PID/exe/UTC birth、`Listen 0`、600 秒 watchdog、精确 stop、端口关闭检查。
- Batch5 的投影与设置读取观察器没有进入新启动器；没有 HTML/React 替身、DOM/CDP 或事件注入。
- 原 E50 guard、resolver、T37 pin 和旧资源均未改。Batch5 helper 入口仍为 88614 字节及固定 SHA。
- 未调用 `git add/commit/rebase/stash/reset/clean/checkout/push`。

## Root 剩余绑定

1. 按 README 的固定格式生成 `RootBinding.json`，列出当前 24 个编译输出、编译 manifest、私有 Desktop package 和 3 个 native shim 的绝对路径、字节数、SHA。
2. 将模板复制为 `private-provider-binding.mjs`，填入当前原始 Provider、B6 编译 Provider、B6 编译 manifest 的固定值。
3. 用 `RootBinding.json` 替换 `start.ps1` 的 `$PrivateOutputPins` 与 `$NativeShimPins`。
4. 填写 `start.ps1` 的 Desktop、manifest、Provider、canonical head 和全部固定字节/SHA；A terminal 后若 canonical runtime 有变化，由 Root 更新 38 项只读 pin。
5. 将 `RootBinding.json` 原始 SHA 写入 `entry.py` 的 `ROOT_BINDING_SHA256` 和 `start.ps1` 的 `$ExpectedRootBindingSha256`。
6. 将最终 Provider binding 与 `entry.py` 的字节/SHA写回 `start.ps1`。
7. 确认 `rg "ROOT_BINDER_REQUIRED" start.ps1 entry.py private-provider-binding.mjs` 无结果后，运行 `prepare.py`，再按 README 启动。

## 未执行与阻碍

- 当前 `start.ps1` 和 `entry.py` 有意保留 `ROOT_BINDER_REQUIRED`；Root 未完成 24 项编译绑定前，启动器会在 preflight 拒绝运行。
- 本轮按执行令禁止执行准备器、语法解析、测试、服务、Electron、GUI、模型、OCR、Key 和 Git，因此没有真机证据，也不能宣称 GUI 通过。
- 执行令列出的 `service\lawbench\case\layout.py` 不存在；案件目录布局实际由 `service\lawbench\case\registry.py` 的 `WORK_DIRS` 实现。
- Root 仍需亲自观察真实滚轮与滚动条、最后一项单击移除、管理栏搜索/筛选/多选批量移除，并保存窗口、日志、`final-metadata.json` 与 `stop-report.json`。

文档校核：删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 2 / 过程 0 / 黑名单 0。
