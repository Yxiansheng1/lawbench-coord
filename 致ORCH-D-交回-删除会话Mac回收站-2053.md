# 致 ORCH · 线 D · 交回 · 删除会话的 Mac 回收站分支（2026-10-16 20:53；令 1943）

`line-D` `d85825b`（已 rebase 到 main `b1caf64`，两个提交：`8e99a3e` 用例与工作流、`d85825b` 交付说明第 8 节）。没改 A 的代码，也没改 Windows 行为。

## 结论（逐条对照 A `525a3ea` trash.ts 第 67–79 行 / 服务 trash.py）
- **`~/.Trash` 取法：对。** 第 68 行 `homedir()` 读 `$HOME`；DSH 宿主是 `ELECTRON_RUN_AS_NODE` 子进程，P-22/P-23 只改 `DSH_HOME`、不改 `HOME`，取到的是真废纸篓。与 trash.py 一致。
- **重名序号：规则一致，差一处 P3。** 第 74 行 `existsSync` 跟随链接，而且把 stat 出错（包括没有完全磁盘访问权限时被拒）都当成"不存在"。trash.py 用的是 `lexists`。撞上同名悬空链接或读不到的同名旧件时会被覆盖。会话编号做名字，实际风险低。
- **权限不足：对。** rename 抛错 → `TRASH_FAILED`，原处不动。
- **跨卷（外接盘、另一 APFS 卷、网络盘）：A 现在是拒绝，trash.py 是复制进 `~/.Trash` 再删原件。对 Mac，拒绝更合理。** 理由：
  - 访达自己从不跨卷复制进家目录废纸篓，而是放进该卷自己的 `.Trashes/<uid>`。
  - 复制再删不是一步完成，中途失败会留下一半删了的会话目录，正是 AMEND 要防的残局。
  - 网络盘本来就没有废纸篓，拒绝与 Windows"非本机固定盘不移"口径一致。
- **iCloud：可接受。** 同卷，rename 能成；该文件会从 iCloud 删除，内容留在本机废纸篓。案件夹放 iCloud 云盘本来就被案件门拦下。
- **"原位置可还原"只对 Windows。** Mac 上两份实现都不写访达的"放回原处"信息，只能从废纸篓手动拖回。界面"需要时可以从回收站找回"仍成立；交回、说明里 Mac 不要写"原位置可还原"。

## 建议 A 改（我不改）
1. **配合 AMEND 预检（建议做）**：Mac 的"有没有回收站"按"与家目录同卷"判断，即 `statSync(path).dev === statSync(homedir()).dev`。跨卷在 stop 之前以 `stage:'delete'` 拒绝。
2. **P3**：trash.ts 第 74 行的 `existsSync(dst)` 改成 `lstatSync(dst, { throwIfNoEntry: false }) !== undefined`；lstat 抛出（不是"不存在"）就报 `TRASH_FAILED`。
3. **P3**：第 75 行 catch 里错误码为 `EXDEV` 时报 `NO_RECYCLE_BIN`，其余仍报 `TRASH_FAILED`。这样律师看到的原因才是"所在位置没有回收站"。
4. **可选二期（请定）**：要支持外接盘上的案件，Mac 分支改调 Foundation `trashItemAtURL`：
   - 经 `osascript -l JavaScript` 的 ObjC 桥在进程内调用，不发 Apple 事件、不弹授权；路径走环境变量。
   - 宿主是 Node 子进程，用不了 Electron 的 `shell.trashItem`。
   - 届时 trash.py 宜同步改，免得"移除材料"复制、"删除会话"拒绝两样口径。

## 用例与云上取证
- `dsh-ext\tests\trash-macos.spec.ts`：4 例，只在 macOS 上跑；Windows 上实跑 4 例跳过，类型检查无新错。trash.ts 用动态 import，合并先后不受影响。4 例内容：
  - 同卷进 `~/.Trash`、重名加" 2"；
  - 上级只读时拒绝；
  - 外接卷（`hdiutil` 建 APFS 镜像挂上）跨卷拒绝，原处不动；
  - 取证：`trashItemAtURL` 把外接卷上的放进该卷 `.Trashes/<uid>`。
- 工作流 `.github\workflows\mac-trash-probe.yml`：macos-15、只读令牌、无 secrets、单装 vitest 4.1.8；手动触发，或推送 `line-D-trash-probe` 时触发。
- trash.ts 还没进 main，所以推了一次性取证分支 **`line-D-trash-probe` `e31c3d2`**（= line-D 加 A `525a3ea` 的 trash.ts 原样，**不合并**，用完可删）。**推送已成功，应已自动起跑；我这边没有 gh、浏览器也没登录 GitHub，看不到运行结果。** 请把运行链接和制品 `trash-macos`（一个 `trash-macos.txt`）放进协调目录附件，我补进 `evidence\T28\` 并据结果修正第 8 节；若有红，先看是不是取证用例本身的问题。
- **跑不到的**：
  - TCC：runner 有完全磁盘访问权限，测不出律师机上读废纸篓被拒的情形，第 2 条按代码推断；
  - iCloud 同步；
  - 真 U 盘：用磁盘镜像代替。
