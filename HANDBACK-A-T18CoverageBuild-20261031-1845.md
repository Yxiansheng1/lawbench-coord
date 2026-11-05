# A 线交回：T18 Coverage Private Build Prep

状态：`SOURCE_PREPARED_NOT_RUN`

执行者：DeepSeek A 线当前执行进程。未启动第二 writer，未联系其他聊天，
未更换 API，未更改沙箱、审批或 ACL。

## 产物

新目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CoveragePrivateBuild-20261031-1845`

目录内恰有三份文件，无子目录，无 `private-output-*`，未运行构建：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20791 | `3a083524459c9cfd9ce82c75a9fce9fdddde474206dbec63bf2556c3b96fc92f` |
| `README.md` | 1913 | `ab24d375e1fbf862293137ff84b19f3835a3cab0a67213210fe7fae2e031333b` |

`build-private.mjs` 与已验收源文件逐字节一致。

## 配置重绑定

相对已验收的
`QualityPrivateBuild-20261031-173317\build-config.mjs`，文本差异仅为执行令
授权的六行替换：

- `EVIDENCE_ROOT` 指向本次新目录；
- `lawbench-agent-source` 固定为 4 files、89916 bytes、tree SHA-256
  `b6523f17b93372d8e880e3fea16fcfea45a8f678f98e6ed597122ccb73da9ce9`；
- 既有 `dsh-ext/agent/index.ts` FILE pin 更新为 57789 bytes 对应 SHA-256
  `d8328b142489dc69d12f56156884d04f975b45b90eca7ce54a25c4c1c202fa0c`；
- 既有 `dsh-ext/agent/task-state.ts` FILE pin 更新为 24595 bytes 对应
  SHA-256
  `8c68eb6b99e36f774cddd0f7cd30fb0441c27d3e55b01d6eb733381538a0d899`。

未新增重复 pin。其余 17 个 tree pin、UI tree/full files 与 bytes、旧 39 个
FILE pin 中的其余项和两条 Agent pin 之外的既有项、14 个 reference pin、
legacy 18、output 25、SDK 与 resolver 均未修改。未重跑 metadata-tree scan。

## 核对结果

- 冻结 builder SHA 与 32121 bytes 精确匹配；
- 当前 `index.ts` 为 57789 bytes，SHA-256 与令中新值精确匹配；
- 当前 `task-state.ts` 为 24595 bytes，SHA-256 与令中新值精确匹配；
- 配置差异逐行核对后仅包含上述授权项；
- 既有 dirty 工作树未清理、未暂存、未覆盖；
- Git 仅执行只读核对。普通 `git status` 因子模块 `dsh` 路径权限拒绝而中止，
  随后使用 `--ignore-submodules=all` 读取顶层状态；未尝试修复权限、锁或扩权。
- 未执行 Git add/commit/rebase/stash/reset/clean/checkout/push。
- 未执行 builder、测试、类型检查、安装、打包、发布、runtime、GUI、HTTP、
  model、network、credential 或产品/测试写入。

请 ROOT 独立复核整套输入、先后镜像/whole-byte 检查、全 pin、setup/cleanup，
然后执行一次全新的 private build。既有 Bash PREEXEC 偏差保留在正式资格记录
中；本交回不声称此前没有任何偏差。
