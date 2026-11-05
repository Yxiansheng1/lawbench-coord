# A 交回：T31 claimed native context 原生装配校正

状态：`NATIVE_ASSEMBLY_AUTHORED_RUNTIME_NOT_RUN`
证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ClaimedNativeContext-20261027-092001\native-assembly-20261027-093212.md`
结论：import 区之后的正文与原 EB 逐字节一致；只新增原生叶子、选择器和证据/交回文件，未运行任何测试或运行时。

## 新增交付

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-claimed-native-context.finite.ts` | 36,278 | `CE48A50E6F09946F2981249C2C7125BB176AEE65B669FBC2A938FDC7C4770AF6` |
| `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-claimed-native-context-native.config.mjs` | 1,316 | `CBA02E258D76361AB2BE3225AA580A3CE8CF3A6272CEAF469EA0A3DDBBBAD1F0` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ClaimedNativeContext-20261027-092001\native-assembly-20261027-093212.md` | 见文件属性 | 内容证据 |
| `D:\Lawbeach\lawbench-coord\A-handback-T31-claimed-native-assembly-20261027-093212.md` | 见文件属性 | 本交回件 |

原 EB `dsh-ext/finite-tests/t31-claimed-native-context.spec.ts` 保持 36,323 bytes、
`EB6CBE25DA992C6E104C34DC2DA5651767536392F84880E5A33FBDFBD8D18DAF`。新原生叶子从
`const PREP_DIR =` 起的正文与原 EB 均为 34,630 UTF-8 bytes，SHA-256 均为
`19E6799EACADA789873051E6882EE266995AFA1499F21B96F354731822A4792F`，逐字符相等。

## 装配

- 只改 import 区：同包导入改到 `../../src/...`，inbox 改到
  `../../../../core/agent-loop/src/inbox.ts`，`dsh-ext` 导入按新位置回指
  `../../../../../../dsh-ext/...`，并显式加入既有 `it`。
- 新选择器展开既有
  `vitest.t31-material-admission.config.mjs`（1,510 bytes，
  `ED1C57BBB492E28CAF43725896BA265905D126A16126DC8824EAEA9BE961CDB9`），
  复用原生根、thread-safe 项目、setup 与 aliases。
- 只复用 `dsh-ext/vitest.config.mjs`（2,641 bytes，
  `62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF`）中已有的
  `lawbench-contracts` 插件对象；没有新增 resolver、loader、alias、mock 或插件。
- 根项目和 thread-safe 项目的 `include` 都只指向新原生叶子。

## 冻结与验证

冻结 B 入口仍为 92,339 bytes、
`8777C7D75479DFDD62B433F5C4CC04F0CF4BED12E3DA1FF14F14C00C90F45793`。
没有修改产品源码、旧测试、旧配置、B346 source pin、入口、guard、P29、原初始
spec/config/README、产品或 frozen outputs。

已做且仅做静态 PowerShell 检查：正文逐字符比较相等，12 个相对导入目标均存在为文件，
记录全部新增/来源哈希。未运行新 selector、Vitest、Node、Python、导入、收集、tsc、
构建、prepare、serve、HTTP 或模型，结果为 `RUNTIME_NOT_RUN`。

## 非零记录与边界

`git status --short --branch` 退出 `1`，原始错误为：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

按令未修复或绕过权限、ACL、审批、沙箱或锁，也未用替代 Git 状态命令重跑。未执行任何
Git 写入或暂存。原有 dirty 保持，Packaging HOLD，Gate 1 未完成。请 root 对累计源码/
配置复核后，再对新的原生叶子执行一次全新实际运行并由新证据判定结果。
