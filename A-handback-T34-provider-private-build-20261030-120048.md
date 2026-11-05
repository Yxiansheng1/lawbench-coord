# A 线 T34 private provider build 交回

状态：SOURCE_ONLY_NOT_RUN。作者未运行 Node、helper、import、check、test、build 或 GUI；无模型/HTTP/SSH/进程探测调用。`private-output` 未创建。

## 交付

- Helper：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\build-private-provider.mjs`
  - 17,801 bytes
  - SHA-256 `25AA3270796E32B951BC28A487D26C94D9D879CE2CC3F57807BD718CE8DEFD84`
- 字面输入：同目录 `literal-inputs.json`
  - 37,402 bytes
  - SHA-256 `574CF123040AC41A62C264667CFEED038FA6793A93B3A43EA34E67AA634AE28C`
  - 与 `T34ProviderPrivateBuildInput-20261030-120048\approved-inputs.json` 逐字节相同
- 说明：同目录 `README.md`

作者侧只读复核了 12 个源码、13 个 esbuild 工具文件、118 个 frozen 钉点和 1 个 Node 钉点，共 144 行；字节数与 SHA-256 均为 0 失败。既有 2 个 positive case body 与 corrected negative 原始证据保留，未重跑。候选源码未改，原 SDK source/lib/resolver/guard/private25 未改。

## 有界构建约束

Helper 固定使用 `E:\node\node.exe` 24.21.0 和精确 esbuild 0.28.1 `lib\main.js`。在创建输出前核验全部输入钉点、literal 自身散列、固定路径及无 reparse 输出父链；随后只调用一次 `buildSync`，参数为已批准的 `bundle/format:esm/platform:node/target:node24/packages:external/write:false/metafile:true` 等。输出只允许 `llm-pi-ai.mjs` 和最后写入的 `manifest.json`，并校验实际 metafile 输入、external imports 和两项文本标记。

下一责任人是主编排：先完整复核 helper、literal、API、路径检查、setup/cleanup 和全部命令，再决定是否授权唯一一次构建。构建后由主编排消费 manifest/output/pins，并自行进行原生 GUI 精确替换验证。

## 未完成与阻碍

- 未执行 helper，未生成 manifest，未验证原生 GUI；不得据此宣称 T34 修复、Gate1 或 Packaging 完成。
- Git 写入按本轮执行令禁止；无 add、commit、rebase、stash、reset、clean、checkout、push，提交 SHA 不适用。
- 全仓只读 `git status` 因既有子模块 `lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而未完成；忽略子模块后的定向状态显示本次仅有三件新文件。未修复锁、权限或 ACL。
