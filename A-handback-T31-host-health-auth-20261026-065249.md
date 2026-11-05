# A-handback · T31 Host health current-generation auth

- 工单号：T31
- 交回时间：2026-10-26 06:57:13 +08:00
- 执行线：A
- 分支：`line-A`
- Git HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 提交 SHA：无。按本次执行令，Git 严格只读；未执行 add、commit、rebase、stash、reset、clean、
  checkout 或 push，也未尝试扩权、改锁、改 ACL/审批/沙箱。
- 结论：有界源码、回归源文件、构建说明和 Host 树字面 pin 已准备；**没有运行测试、tsc、构建、HTTP、
  launcher 或 GUI，因此没有运行 PASS，T31 整体仍未验收。**

## 1. 目标与既有事实

既有严格 GUI 失败证据：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31HealthAuth-20261026-065249\failure.json`

该证据记录 53 次 `GET /health 401 auth_denied`，业务导入和任务均未到达。根因边界为 A 的生产 Host
健康探测未携带身份，而 B 的严格 BatchGuiEntry 对包括 `/health` 在内的全部路由使用同一鉴权。
本次没有修改或弱化 B 的鉴权、原生 resolver/guard/旧库、服务端 `/health`、业务路由或 public schema。

## 2. 改动清单与 before / after

以下文件 SHA-256 是文件字节哈希；before 来自执行令所列 `before` 快照的逐字节复核。

| 文件 | 状态 | before SHA-256 | after SHA-256 | after bytes |
| --- | --- | --- | --- | ---: |
| `dsh-ext/host/index.ts` | 已跟踪 dirty，任务修改 | `0324e4ba270e5d6a1e2725ad05b9a08d3ca6e3b0b4ea351632b06d0852961995` | `4a12f0e0176c05596a6620b6877f2a8e6d12f4c61081683fc70ffd4302a3d6b8` | 59,779 |
| `dsh-ext/host/supervisor.ts` | 已跟踪 dirty，任务修改 | `523506101bd56140c3c3a7c94f9dcce595a007817af26699822d4a831e52f3ef` | `3cc9a30ff53bff82d57b6f881767c89218d77d519a8f7d4d6fe6953f828ce599` | 17,523 |
| `dsh-ext/tests/t31-health-auth.spec.ts` | 新增，untracked | 无 | `7fccfb10d9784447a42dffa696b319db401c3a74d3db34843bfafbd53ef49258` | 6,921 |
| `docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/build-config.mjs` | 既有 untracked，任务修改 | `0ac79a990da674d4eefe35cf5862118c645943a38be16202e02ba41b99bc53ac` | `de35f2a805024ad79f0dddae7e1dbb7420630387f34a6afcab0391f3b2182394` | 20,075 |
| `docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/README.md` | 既有 untracked，任务修改 | `b3f88ec124a1671702bd6c4be7edafa4a6abe92490a63709eca79715c0e7ba19` | `3e1ef76ae8fe6c4beefc43bf1303fff9a9f950874d6e7c1f1c1b1c507589bc7b` | 22,232 |

`dsh-ext/tests/supervisor.spec.ts` 未改。其他既有 dirty/untracked 文件均保留，没有清理、撤销或暂存。

### 2.1 `dsh-ext/host/index.ts`

- before：`probeHealth(port)` 直接对 `/health` 发出无身份 fetch。
- after：现有函数改为可供源码回归直接调用的 named internal export，
  签名 `probeHealth(port, token)`；固定设置恰一个 header：
  `Authorization: Bearer <当前代次 token>`。
- 保持：`redirect: 'error'`、`AbortSignal.timeout(2000)`、HTTP `ok` 判断、
  `status === 'ok'` 判断和 `contract_version` 返回值语义。没有无鉴权重试或 fallback。
- token 未写入日志、文件或回传对象；新增测试只用虚构 token。

### 2.2 `dsh-ext/host/supervisor.ts`

- before：依赖签名 `probe(port)`；首次和周期探测只读公共 port 状态，不带身份。
- after：依赖签名 `probe(port, token)`。每代在 spawn 前生成并保存新的 local token；
  首次探测、周期 timer 和 ping 均绑定同一 `gen + port + token`。重启生成新 token，
  旧 timer 若晚到会因 gen/port/token 不匹配直接退出，不会以旧代次冒充当前成功。
- 未改：启动/周期频率、连续三次 miss、重启限额、版本比对、超时、退出码和状态文案。

### 2.3 `dsh-ext/tests/t31-health-auth.spec.ts`

新增回归只使用 ephemeral `127.0.0.1` HTTP server 和 fake ChildHandle，不 spawn 产品进程、模型或
工作台 lifespan。覆盖：

1. 真实生产 `probeHealth` 对严格鉴权 server 发送恰一个当前 Bearer header；正确 token 返回版本，
   wrong token 不就绪，裸缺失 Authorization 请求由 server 返回 401。
2. `/health` 返回 302 时 probe 拒绝，请求数保持 1，证明没有跟随重定向。
3. 真实 `probeHealth + Supervisor` 的首次、周期、重启后首次、重启后周期四个请求分别使用当前代次 token；
   server 在重启前切换为只接受新 token，旧 token 会被 401，不能用 fake success 绕过。
4. 每个本地 server 在 `finally` 关闭；Supervisor timer 显式 clear，测试结束后无遗留 timer。

### 2.4 私有构建配置

`build-config.mjs` 只改一处源码树字面身份：

| 状态 | 文件数 | 字节 | tree SHA-256 |
| --- | ---: | ---: | --- |
| before | 20 | 183,881 | `c123ccce803c62278b3a7e99e8cbe3292b0c095b2d12b3d23b6a5c9cf042b044` |
| after | 20 | 184,127 | `33bb54cc2cca639080747e0985bdf83740ad806aac8740fc1ff9ae31cb2619f6` |

按现有规范算法递归普通文件、拒绝 reparse、POSIX 相对路径 ordinal 排序、UTF-8
`path<TAB>bytes<TAB>sha256` 加 LF 复算：

- 以当前 20 文件树为基础，只把 `index.ts`、`supervisor.ts` 换回 `before` 两文件，精确得到旧 pin
  `c123…b044`，避免把只有两文件的快照误当成完整树。
- 当前实际 20 文件树精确得到新 pin `33bb…19f6`。
- 只替换 `lawbench-host-source` 的 bytes/sha256；没有动态哈希，没有改其他 tree/file/output/assertion pin。

`README.md` 第 2 节表和第 12 节记录同一前后身份、严格 401 起因、源码边界及“作者未运行”的限制。

## 3. 实际命令与结果

所有成功执行均使用执行令指定的原生 PowerShell：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

且 `login=false`。以下按实际顺序归纳：

1. 唯一首个工具只读正式执行令：

   ```powershell
   Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-host-health-auth-order-20261026-065249.md'
   ```

   成功；按要求先读完整令。

2. 读项目事实索引、PROJECT-PROFILE 和工单集 T31 相关文本：

   ```powershell
   Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\lawbench-关键事实索引-20260928.md'
   Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\PROJECT-PROFILE.md'
   rg -n -C 8 "T31|Host current-generation|health" 'D:\Lawbeach\lawbench-A\docs\plan\lawbench-工单集-第一版开发-20260928.md'
   ```

   成功；工单集中没有 T31 新块，精确修法以本次正式执行令和 failure 证据为准。

3. 只读 status 与 dirty 保全：

   ```powershell
   git status --short --branch
   git status --short --branch --ignore-submodules=all
   ```

   第一次被既有 `dsh` 子模块权限阻断；第二次成功，保留全部已有 dirty/untracked。

4. 只读目标源码、既有测试、构建说明、failure 和 `before`：

   ```powershell
   Get-Content -Raw -LiteralPath <上述目标文件>
   Get-ChildItem -LiteralPath <上述目标目录> ...
   ```

   成功；确认 `probeHealth` 无鉴权、B 失败证据为 53 个 401、未发现已有
   `t31-health-auth.spec.ts`。

5. 修改前哈希和快照一致性：

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath <目标文件>...
   ```

   成功；当前 `index.ts`、`supervisor.ts`、`supervisor.spec.ts` 与 `before` 快照逐 hash 相同。

6. 用 `apply_patch` 做第 2 节列出的五文件有界修改；没有用 shell 写产品、测试或证据文件。

7. 源码回归静态复核：

   ```powershell
   rg -n "probeHealth|\.probe\(|\bprobe\(" 'D:\Lawbeach\lawbench-A\dsh-ext\host' 'D:\Lawbeach\lawbench-A\dsh-ext\tests'
   git diff --no-index --no-color -- <before-file> <after-file>
   git diff --check -- 'dsh-ext/host/index.ts' 'dsh-ext/host/supervisor.ts'
   git diff --no-index --check -- <before-config/readme> <after-config/readme>
   ```

   结果：生产调用点只有 Host 注入和 Supervisor 两处探测；源码/文档 diff 只含第 2 节内容；
   已跟踪源码 whitespace check 退出 0；pair check 退 1 仅表示存在预期 diff，无 whitespace 诊断。

8. 用只读 PowerShell/.NET 代码按现有规范算法计算完整 Host 树身份，并用 `before` 两文件做内存替换复算旧树。
   结果精确复现旧 pin，并由当前树得到新 pin；没有执行 builder。

9. 最终只读核对：

   ```powershell
   git rev-parse --abbrev-ref HEAD
   git rev-parse HEAD
   git status --short --ignore-submodules=all -- <五个目标文件>
   Get-FileHash -Algorithm SHA256 -LiteralPath <五个目标文件>
   rg -n 'lawbench-host-source|184127|33bb54cc|## 12\.' <build-config.mjs> <README.md>
   ```

   成功：branch `line-A`、HEAD `a23271ab…`；目标状态为两个 tracked modified、三个 untracked；
   最终 Host tree 为 `files=20 bytes=184127 sha256=33bb…19f6`，与 config literal 一致。

10. 运行器壳阻碍准确记录：

    三次只读辅助调用被误配置为 `shell=bash`，运行器均在命令执行前以
    `Bash/E_ACCESSDENIED` 拒绝；没有产生文件读写，也没有改变任何状态。发现后所有实际执行均恢复为指定的完整
    `pwsh.exe` 路径和 `login=false`。没有启动 setup、legacy shell 或 bash wrapper，也没有改沙箱/审批/ACL。

## 4. 红绿验证与禁区

- 绿灯：仅限上述静态事实——修改前 hash 对表、精确 diff、生产 call-site 检查、
  tracked whitespace check、完整 tree pin 复算及 final pin 对齐。
- 无运行绿灯：按执行令 AUTHOR 禁区，作者没有运行 parser、test、Vitest、tsc、pytest、collect、prepare、
  start、serve、probe、build、GUI、HTTP、model、network 或 selftest。
- 因此新增 `t31-health-auth.spec.ts` **尚未执行**，生产源码也**尚未由作者类型检查或构建**。
- 没有启动任何服务或进程，没有第二 writer，没有拆 writer lock，没有尝试修 Git index 或 submodule 权限。

## 5. 证据与交回路径

- failure：见第 1 节绝对路径。
- 源码：`D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts`
- Supervisor：`D:\Lawbeach\lawbench-A\dsh-ext\host\supervisor.ts`
- 回归：`D:\Lawbeach\lawbench-A\dsh-ext\tests\t31-health-auth.spec.ts`
- 构建配置：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs`
- 构建说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md`
- 本交回：`D:\Lawbeach\lawbench-coord\A-handback-T31-host-health-auth-20261026-065249.md`

## 6. 遗留、模糊条款与 root 下一步

- 未发现需要自行拍板的业务或协议歧义。严格测试入口全员鉴权与“原 public health”的描述不冲突：
  本次只让 Host 的 request identity 携带当前 token，不改变服务端 public route 语义。
- `git status` 默认模式仍会因既有 `dsh` 子模块
  `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 权限而失败；
  本次令明确这不是交付阻碍，未修复。
- root 仍需独立做累计复核、目标回归与类型检查；通过后再做修改后源码的一次私有 fresh build 准入，
  更新新输出的 launcher pin，并完成独立真实 GUI。作者阶段没有这些运行证据。
- 在独立真实 GUI 跑通前，不得把 T31 标记为整体通过；Packaging 继续 HOLD，不安装、不打包、不合并、不推送、
  不部署、不触发 Actions。
