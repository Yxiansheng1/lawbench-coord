# A 线交回：T31 Host face 标记引号修正

- 执行者：独立 A 线 DeepSeek `deepseek-v4.1-flash-1017/max`
- 执行令：`D:\Lawbeach\lawbench-coord\T31-host-face-marker-order-20261026-054515.md`
- 状态：有界修正及只读字节核验完成；本文不声明构建、GUI、运行期或 T31 整体通过。

## 1. 已写入文件

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md`
3. 本交回文件

除上述文件外，本次没有写入产品代码、构建产物、transport、六补丁、`PATCHES`、冻结 resolver/guard、权限、ACL、锁或 Git 元数据。

## 2. `build-private.mjs` 精确字节差

前序快照：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-host-face-marker-20261026-054515\build-private.mjs`

仅第 604 行断言字面量发生引号变化：

```diff
-  assertMarker(paths.hostJs, 'face: "host"')
+  assertMarker(paths.hostJs, "face: 'host'")
```

| 状态 | 字节数 | SHA-256 |
| --- | ---: | --- |
| 修正前 | 32,121 | `522a17fcfe7ce824d263b64652e7e6016a616026289a8b36ca702c3745fdbc3f` |
| 修正后 | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |

零基字节偏移与字节值（十进制）为：

```text
22928: 39 -> 34
22935: 34 -> 39
22940: 34 -> 39
22941: 39 -> 34
```

全文只有这四个字节变化；没有行数、长度、行尾或其他字节变化。`assertMarker` 本身、package/face/remote 严格校验、Client `checkDiagnostics: true`/`mode: 'check'`、Host 生成、输出集合、源码模块与安全检查均未改动。

## 3. README 追加

前序快照：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-host-face-marker-20261026-054515\README.md`

| 状态 | 字节数 | SHA-256 |
| --- | ---: | --- |
| 修正前 | 18,441 | `77a74d5b07f9732f6c2cda78bab6438afbe395c0b6543e29643ca81e991a22dd` |
| 修正后 | 19,945 | `b3f88ec124a1671702bd6c4be7edafa4a6abe92490a63709eca79715c0e7ba19` |

旧 README 的 18,441 字节前缀逐字节相同；只在末尾追加 1,504 字节，追加段 SHA-256 为 `ddaa5f1f42e5c7dfd89d3eb73e292e72527b0f7aa26b05c90985f9cbe1c0f5ae`。追加内容记录 root 第四次构建结果 `root-build-20261026-054411\result.json` 的退出码 1、8.5 秒、Client 诊断和 Host 生成完成、五个元数据已写出，以及唯一失败点是错误的双引号 Host 标记断言；旧失败记录未改写。

## 4. 冻结输入与现场核对

- `build-config.mjs` 未改，当前 SHA-256 仍为执行令指定的 `0ac79a990da674d4eefe35cf5862118c645943a38be16202e02ba41b99bc53ac`。
- `git status --short --ignore-submodules=all` 成功，确认既有工作树大量 dirty；T31 私有构建目录整体仍为 untracked dirty，未暂存。
- 普通 `git status --short` 无法进入 dsh 子模块，报 `Permission denied`；按要求未改权限、未启动 setup、未切换隔离方式。该阻碍只影响完整 Git 状态展示，不影响上述已保全快照和文件字节核对。
- Git 全程只读，没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。本次没有提交 SHA。

## 5. 验证边界

作者没有运行 build、parser、tsc、测试/Vitest/pytest、collect、prepare、serve、probe、GUI、HTTP、模型或网络请求，没有安装依赖，也没有创建新的私有构建输出。因此本文只证明目标文件和快照之间的精确差，不证明新构建会通过，也不声明任何运行期行为。

root 下一步可按令对本交回及前序快照做反向字节复核；是否授权一次新的私有构建由 root 决定。Packaging 继续 HOLD；未来 GUI 必须保持 T50 memory credentials 为唯一 provider，不因本修正激活 production credentials。
