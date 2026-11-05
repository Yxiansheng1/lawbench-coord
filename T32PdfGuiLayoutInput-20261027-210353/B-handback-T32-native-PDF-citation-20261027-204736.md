# B 线交回：T32 native PDF citation

状态：`AUTHORED_NOT_RUN / PREPARED_FOR_ROOT_AUDIT_ONLY / PACKAGING_HOLD`

## 结论

已按执行令从两份固定 TXT 快照出发，在尚不存在的目标目录新增并完成有界
PDF 适配。作者未运行 Python、Node、import、parser/AST、compile、测试、
build、prepare、serve、probe、HTTP、GUI、trace、Office、模型、OCR 或
selftest，因此不声明任何运行态 PASS。

交付目录：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736`

仅新增以下三个文件：

- `server.py`：76,898 bytes，SHA-256
  `bada298eb3e018f36ca0c4bf3ddb4d15da61a0e9aed399f2919e2f65a6a85e0e`
- `probe.mjs`：32,525 bytes，SHA-256
  `766c0e1a3c1a81f0569efc429eda0d983030341a72cacadffa185697641ddf6f`
- `README.md`：12,105 bytes，SHA-256
  `ab417cf87e364661ba0d624eae79ec128988b6ca0a48c2983fdee256cb379aa6`

本交回件：
`D:\Lawbeach\lawbench-coord\B-handback-T32-native-PDF-citation-20261027-204736.md`

## 实现范围

- prepare 现在复制一份固定 JPEG 控制件和一份固定
  `起诉意见书.pdf`（57,132 bytes / `761224…f191`），不再写 TXT。
- 根、private、input、ready 清单精确；“ready”必须恰好是 JPEG 和一个 PDF；
  PDF 的 source/copy 分别记录并前后复核 `sha256/bytes/mtime_ns`。
- native ref import 必须产生预期虚拟路径
  `工作区/引用/R01/起诉意见书.pdf`，案件根和该虚拟路径都不得出现 PDF
  原件副本；派生文本必须实际有五页，`pages_need_ocr=[]`。
- `case_read_material` 用 `start=2,max_chars=500` 读取页 2；真实读记录和
  出处均为 `{"unit":"page","from":2}`。期望覆盖是 1 份材料、已读 1/5 页，
  即 `not_fully_read=["起诉意见书"]`，不把“未读全”误判为出处失败。
- 唯一 source 响应必须含页 2 固定片段 `经依法侦查查明`、`126,500`，
  不含首页标记 `虚构市公安局虚构区分局`，并含 canonical base64 的真实
  非 1x1 PNG；IHDR 宽高为正且长边不超过 2480，响应上限仍为 1 MiB。
- 探针必须把实际 source base64 直接解码、以独占创建写入本次 run 根的
  `probe-page2.png`，供 root 目检；不能替换或复用旧图。
- 认证、13 条精确路由、一次性 source、最多四次同案 open、有限 20 秒、
  五参数 `platform.uname` 修复、内存占位凭据、零 OCR/Lifespan/Retainer/
  Office 和自然关闭均沿用固定基座。

## 静态对拍

- `server.py` 对 `00-server.py`：+301/-60 行，函数/行界见 README
  348-2101 区间。
- `probe.mjs` 对 `01-probe.mjs`：+213/-42 行，函数/行界见 README
  91-1047 区间。
- 产品、旧入口、旧探针、helper、来源 pins、schema、25 runtime、E50、
  18 legacy、guard、resolver、PDF browser origin/5 assets、启动器、打包
  与旧历史证据均未修改。

## 文件与权限边界

Git 严格只读：没有 add/commit/rebase/stash/reset/clean/checkout/merge/
push，没有暂存、提交或提交 SHA。路径级只读状态只有本交付目录为未跟踪；
普通全树 `git status --short` 在
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh`
因权限拒绝而 exit 1。该阻碍未修复、未扩权、未绕过，也不作为交付阻碍。

作者只写本目录三个文件与本交回件。当前 PID 是本次唯一执行者，不是第二
writer；未改沙箱、审批、ACL、锁或权限。未读取真实案卷、`.env`、Keyring、
凭据、发票、历史、缓存或 rollout；未联系其他聊天，未更换 API。

## 已知限制与通道偏差

- 本交回没有语法或运行证据；请 root 先审计完整新源码、probe、setup、
  fixed-input 哈希和冻结 diff，再执行一次全新的 20 秒有限事件。
- `max_chars=500` 是按静态页长把读取限定到页 2 的作者选择，尚未由作者
  运行验证；若真实页 2 渲染超过 500 字，产品会返回分段读取且不会写读记录，
  root 应按原始失败证据处理，不得本文手写补记录或放宽断言。
- 六次只读 `Get-Content`/`rg`/`Get-FileHash` 请求误填 `shell=bash`，均在
  启动层被 `Bash/E_ACCESSDENIED` 拒绝，没有执行、读取或写入。
- 一次只读 `Get-Content` 误写长 PowerShell 依赖目录，退出 0 且仍只读；
  四次只读查询使用短名 `pwsh`，退出 0。后续恢复执行令指定的完整原生
  PowerShell 绝对路径；未启动 setup、未切 legacy。
- 四次 `git diff --no-index` 因存在预期差异 exit 1；一次普通
  `git status --short` 因上述 `dsh` 权限 exit 1。全部命令与处理见 README
  “作者命令、静态检查与非零”。
- 交回前只读核验使用了 `Get-Item`、`Get-FileHash`、`Get-ChildItem`；在 B
  仓工作目录对协调目录绝对路径调用 `git status` 又因 `outside repository`
  exit 1，未改文件或 Git 状态；该事件也已补入 README。

## Root 下一步

1. 审计新 `server.py`、`probe.mjs`、README、全部固定身份与冻结 diff。
2. 在一个全新 `runs\T32-pdf-citation-YYYYMMDD-HHMMSS` 根执行一次 prepare
   + 20 秒 serve + 一次 probe；不得复用旧根。
3. 查看 `bootstrap-report.json`、`requests.ndjson`、`final-metadata.json`
   和实际 `probe-page2.png`，确认页 2 文本及图像。
4. 此有限事件完成后，再另起 fresh root、在 `<=600s` 内做真实 GUI 的
   citation open/view page 2 image/close tab；不能用 prepare 或 TCP 结果
   代替 GUI。

在 root 独立收货前，本件不主张 PDF 解析、页 2 PNG、HTTP、GUI 或产品通过，
Packaging 保持 `HOLD`。
