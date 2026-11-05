# A 线交回：T32 native citation GUI launcher

状态：`DELIVERED_NOT_RUN`。只完成三份启动器与 README 的有界适配，没有执行交付脚本或 GUI，不宣称运行时、GUI、Host/RPC、模型、OCR、安装或发布验收。

## 交付

交付目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDocumentCitationGui-20261027-194505\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 17850 | `c631549f877f4856e8cbd36348a08386db45e538d6e2bb7557bcae77fb0b8d4e` |
| `start.ps1` | 77186 | `3dbff8acb475a86e61bb8f7381e9e178c9c15ed9d85f4aec6df7250b0915f395` |
| `stop.ps1` | 7154 | `33cc1ea557e75c24733f8dada20f72ade0fa76d5e7d93aad00eeb7dc348d983d` |
| `README.md` | 6576 | `6344aa9bb3789a0f90aa100a94f5fff49e9bf5d884a7f591b489be83bca4f74f` |

Git 严格只读：未 add、commit、rebase、stash、reset、clean、checkout、merge 或 push，未改 index/锁/权限/ACL。当前分支 `line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`；本次文件仍是未跟踪交付，故没有 Git commit SHA。原有 dirty 全部保留，目标外未产生新 dirty。

## 冻结输入与实现核验

- 旧三启动器逐字节复制后定点修改；原文件仍为 blueprint 固定的 17117/`2f8f1393…`、75677/`b2b6905f…`、7131/`c21f6abb…`。
- native entry 固定为 B `T32\NativeDocumentCitationEntry-20261027-190830\server.py`，67862 字节、`ec4e15f047f3ae6264dc25ad582cb2191ce085e9bc7c5add4bb5df0212ba0dd8`。
- source pins 固定为 53547 字节、`5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`；source 形状为 347 项 pins 加 `entry/server.py`。
- safety base 固定为 151304 字节、`a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`；launcher 显式验证实际文件，并验证 manifest 中 `sha256`、`frozen_sha256`、`bytes`、路径与 canonical 身份。
- prepared format 为 `T32-native-document-citation-entry-prepared-v1`。ready 只允许 `转账截图.jpg` 与 `引用材料.txt` 两个普通文件；引用源固定 50 字节、`410a87a9c0853f886fe526ce940ba396d09929d1304b3f9c146f5612e7e1954f`，同时验证精确文本。额外项、目录、reparse 和身份变化均拒绝。
- 8 项 path map、空 case、根目录四项 inventory、runtime artifact 缺席、settings 内容/哈希、daily marker 精确字节及 `host_shape.root` 继续严格验证。顶层 `not_service_registration: true`、`not_case_id_or_session: true`、`initial_case_empty: true` 同时保留。
- runtime 固定在 `private-output-20261027-194112`，manifest 58195 字节、`5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f`。24 项 output pins 只把 `profile-node_modules/lawbench-dsh/lib/client.js` 从 536112/`572f2d5a…` 更新为 537185/`fcf4210f78ffedce8b25e99301003ab3c0aadcbb2468b1212e68909a526991ed`；runtime manifest 与 literal pins 均为 24 行，legacy pins 为 18 行。
- run root 固定为 native entry 的 `runs` 直属子目录，名称 `T32-citation-YYYYMMDD-HHMMSS`。stop 只接受该 runs root 下的精确名称，没有宽泛回退。

## diff 边界

- `prepare.ps1`：只改固定输入、原有输入验证、prepared manifest 身份验证和最终 `readyInputFiles: 2` 报告；private Desktop 准备尾段原样保留。
- `start.ps1`：只改固定输入/runtime 常量、单个 client output pin、`Assert-PreparedInputs` 和 run-root 字面 regex；未改 relay stdout 脱敏、托管依赖、24 文件 staging、profile overlay、guard/resolver、fake sidecars、phase/auth/lifecycle/once 停止逻辑。
- `stop.ps1`：只改新 runs root 和 T32 精确名称校验。
- 三份 diff 没有其他 hunk。产品源码、B entry、source pins、safety base、settings、PDF/OCR、E50 guard/resolver/sidecars、私有 profile suffix、权限、API/Keyring/凭据均未触碰。

## 验证状态与限制

作者只做了文本读取、哈希、目录核验和 `git diff --no-index`；没有运行 prepare/start/stop、GUI、HTTP、Python、Node、import、编译、测试、build、serve、probe、模型、Office、安装、打包或部署。因此本交回只支持“启动器已按固定契约完成静态适配”，不支持任何运行时或验收结论，也不沿用此前 B main 因 runtime violation 被拒的灰色运行作为接受证据。

README 已完整记录 root 后续使用的 prepare/start/stop 命令、预期关键输出、所有静态工具类别和非零记录。原始 `git status --short --branch` 在 `modules/dsh` 的 worktree 元数据权限处失败，随后用 `--ignore-submodules=all` 只读取得根树状态；未修锁或扩权。十次误填 bash 的只读请求均被运行器拒绝，未启动 Bash、未执行其中文本、未写文件；一次不存在 shell 目标与两次临时呈现命令 ParserError 也无交付副作用。所有成功的实现与核验命令均使用正式执行令指定的原生 pwsh、`login=false`。

交回后停止；等待 root 执行完整审计与 GUI。
