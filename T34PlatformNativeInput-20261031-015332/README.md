# T34 required-peer dependency-context source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / PREPARED_RESOURCE_NOT_CREATED_BY_AUTHOR / NEW_TARGET_NOT_RUN / FULL_TEST_NOT_RUN`

本件只处理一个已界定的原始资源缺口：既有依赖复制表只遍历了包依赖，遗漏了静态
appBoot import 所要求、但未由依赖声明带入复制上下文的 mandatory peer package
Group。固定的 14 个源码 pin 不变；本轮把复制清单扩为原始依赖和 mandatory peers
闭包，不自行补可选 peer，也不引入新 SDK 字节。

## 既有状态与本次边界

- 根侧已知根因仍是拆分模块的 module-local root Include 注册表问题；该问题已被证实，
  本件不作新的原因改写。
- 最近一次 4,704 文件副本控制在实际流程的第一步 import 处失败，发生在 boot 和唯一
  mutation 之前。其精确的有界原因仍为 `UNKNOWN`；本件不声称已经复现出更具体的
  ESM 异常，也不把 peer 缺口误写成该异常的同义解释。
- 新复制表范围是原始 E50 包的 declared dependencies 加 mandatory peerDependencies
  闭包；可选且不可得的 peer 不虚构补入。固定清单为 153 个原始包、4,782 个文件、
  26,091,571 bytes。
- 只改变 `COPY_TABLE` 的 path、bytes、SHA-256、schema 对应值、文件数、总字节，以及
  `PREPARED_RESOURCE_ROOT`。其它源码字节保持基线，包括原有函数、guard、隐私边界、
  45 秒实际流程、180 秒准备流程、路径处理、唯一 unset、shutdown、固定 14 pins、
  观察器、已知错误标签和任务元数据。

## 固定输入

- 新复制表：
  `D:\Lawbeach\lawbench-coord\T34RequiredPeerContextInput-20261031-013407\approved-copy-table.json`
  （1,751,043 bytes，SHA-256
  `3dd579f3244d1bd9e59fbecc2353d92f3614cc30194853e568a3047b860ab197`）。
- 表 schema：`lawbench-t34-fixed-original-dependency-table-v1`。
- 表计数：4,782 个文件，26,091,571 bytes。
- 新固定准备根：
  `D:\Lawbeach\lawbench-coord\T34RequiredPeerResources-20261031-013407`。
  本源作者没有创建该目录；只有根侧 `--prepare-only` 可以创建它。
- `literal-inputs.json` 以 `approved-inputs.json` 的完整 JSON 核心和字段顺序为基准，
  只在末尾追加 `handoff` 自述、非零计数与全部运行状态的 `NOT_RUN` 标记。

## 根侧唯一执行顺序

本源码只提供两个入口。根侧必须先确认固定准备根不存在，再使用既有批准的 Electron
Node mode、冻结 resolver 与冻结 network guard 执行一次 `--prepare-only`，外壳上限
180 秒。准备成功后，根侧须独立核对全部已复制文件、原始来源及 OS closure；未通过
即停止，不能启动实际路径。

准备与独立核对通过后，才可在本证据目录的 `runs` 下选择一个尚不存在的新目录，
执行一次实际路径，外壳上限 45 秒。实际路径只在固定表、14 pins、准备工作、全部副本、
owned/reparse 边界通过后 import 固定准备运行时；退出码判定沿用源码既有标签。

## 作者侧边界

- Node、Python、import、check、test、build、prepare、actual、boot、应用、GUI、HTTP、
  模型、SSH、DPAPI、worker 与 process probe 均为 0。
- 固定准备根由作者创建：否。实际运行新 root 由作者创建：否。
- 本件只执行公开 SDK 字节的清单与源码数据化交接；未复制业务产品内容，未读取或写入
  Key、密码，未调用模型或 GUI，未修改 SDK、resolver、guard、观察器或旧 packet。
- Git add/commit/rebase/stash/reset/clean/checkout/push 均为 0；仅执行一次只读
  `git status`，既有 dirty 原样保留。
- 本件不运行准备或实际目标，故新目标运行与完整测试均为 `NOT_RUN`，不能由源码交接
  推定 PASS。