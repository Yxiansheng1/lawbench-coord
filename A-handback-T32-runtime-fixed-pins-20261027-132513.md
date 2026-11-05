# A 交回：T32 运行时固定树钉

状态：完成。`RUNTIME_NOT_RUN`

## 交付

- 修改：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs`
- 新增证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-materials-optin-fixed-inputs-20261027-132513.md`
- 配置修改前 SHA-256：`c04c58a5a8fa43aa57de7c54566c5427600819ed8cb6dbe68356ae1c3e311bc1`
- 配置修改后 SHA-256：`6c60333e2a488b75b51b2f3f7630d4141cdcfcefd276a5e4c0b5760f6b392076`

仅改两行树钉的值：

- `lawbench-ui-source`：92 个文件；`635866` 字节；`ca47a1390b26dcfa70676ddab251e94ea007606b6acb841dc1783b906a7d1c9a`。
- `embedded-contract-schemas`：69 个文件；`251741` 字节；`a0da8077fcece9ada61c2efb09be5b340f67deaa55606252697134b7a3043800`。

冻结 builder `build-private.mjs` 实测 SHA-256 为 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`；冻结蓝图 SHA-256 为 `f97c66e4084c051854be5f1d53f20dfad54bb642bb6970afe1e65af3bf018d6b`；冻结 UI 测试实测 SHA-256 为 `b338913095f92491cfe358001b9ba31fc19f760ae1a3c9c098f9958abf989b25`。

## 命令与非零

实际使用了 `Get-Content`、`rg`、`Get-FileHash` 和只读 `git status/sh`，精确命令记录在证据文件。`git status --short --branch` 返回非零：子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝。未尝试 Git 写入、扩权、改锁或改审批；已用 `git status --short --ignore-submodules=all` 保全现有 dirty 清单。

未运行任何配置、构建、测试、解析、Node、Python、HTTP、GUI、模型或安装命令；25 个运行时输出未生成、未验收。打包仍 HOLD。
