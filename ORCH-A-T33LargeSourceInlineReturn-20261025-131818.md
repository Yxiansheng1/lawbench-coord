# A线 T33 LargeRefGui 单文件准备交回

状态：PREPARED_ONLY；不是 runnable GUI，不是运行 PASS；Packaging HOLD。

创建文件：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300\create-large-source.py`

语义：只接受固定 HostEntry runs 下的直接 `T33-host-YYYYMMDD-HHMMSS` 根；校验安全路径、空 case、原 prepared 契约与唯一 JPEG；顺序真实写入固定 100 MiB BMP 和独占 source manifest；`--verify-only` 只复核固定身份、字节、SHA-256、mtime 与不变条件，不写入。

生成器来源：BMP 函数逐字采用执行令内冻结的 `_create_big_bmp` 算法、头结构、1 MiB 零块、`xb` 顺序写、flush/fsync 与物理大小断言；未导入或执行旧 prepare/product。

关键固定值：prepared schema/head、JPEG 47379 字节及其 SHA、BMP 104857600 字节及其 SHA 均写死在 helper。source 前必须不存在，manifest 独占创建；失败留下的部分 source 不会被重试、清理、移动、复制或恢复。

不变条件：不写 case；不改 prepared/settings/daily marker/JPEG/旧 runs；遇 served 工件、链接/重解析点、额外 ready 文件、case 非空或任何身份变化即拒绝。

限制：helper 只支持固定允许基座和单一合成输入；不提供路径、尺寸、目标、provider 泛化选项；无 shell、网络、凭据、产品导入、解码或 OCR。

执行记录：正式令读取是首次且唯一一次 shell 操作；此后仅用文件补丁写上述 helper 与本交回件，未自跑、自测、自哈希或再执行 shell。正式 SHA 未填，由 root 计算。
