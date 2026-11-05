# T31 空 wiki 旧生成提示移除：A 线交回

状态：有界修改完成，未提交、未验收。本次产品改动不等于验收通过。

## 最终标识

- Git HEAD（完整 SHA）：`a23271abee333a9a256fd46a3141da16975c2380`
- 本次没有新建提交；上述 SHA 是未提交工作树所基于的完整 HEAD，不是本次改动的提交 SHA。
- `dsh-ext/ui/wiki-card.tsx` SHA256：`AA3080AFF89E12CAF173E838EF6635203ED51858A64C5E93AB58521DE5DB5E5A`
- `dsh-ext/tests/wiki-card.spec.ts` SHA256：`AE7089E08404237F57010F07C395F6870AC90E51E42A749D38D50801D34EC984`

## 精确改动文件

1. `D:\Lawbeach\lawbench-A\dsh-ext\ui\wiki-card.tsx`
2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\wiki-card.spec.ts`

除以上两个产品文件外，仅写本正式交回件。

## 最终行为

- wiki 数据成功加载且 `wiki.exists === false` 时，`WikiCard` 返回 `null`，不再渲染旧“还没有生成。点上面……生成 / 更新 wiki”卡片。
- 缺失 wiki 时不渲染“案件 wiki”区段、待复核/已核对控件或“打开 wiki 文件夹”按钮，也不调用 `postWikiReview`。
- `loading`、`fail`、已生成 wiki 的案件卡片、板块正文、出处打开、复核状态/标记、文件夹和文件操作均未改写。
- 生成入口仍由首页 Skill 胶囊负责；未移动按钮、未新增提示或架构。
- 同文件内原空 wiki 测试改为断言：无 wiki 区段、无旧提示、无核对按钮、无文件夹按钮、无写完调用。
- 已生成 wiki 的现有实质性断言和其他测试未改。

## 实际只读检查与结果

- 完整读取正式执行令：成功。
- `git --ignore-submodules=all status --short`：退出 1，客户端报告 `unknown option: --ignore-submodules=all`，属命令参数位置不兼容；未做写操作。
- `git status --short --ignore-submodules=all`：成功，确认工作树原先已有大量 dirty/untracked 内容。
- `git diff --ignore-submodules=all -- dsh-ext/ui/wiki-card.tsx dsh-ext/tests/wiki-card.spec.ts`：成功，diff 仅含上述最小源码行与同一回归测试。
- `git diff --check --ignore-submodules=all -- dsh-ext/ui/wiki-card.tsx dsh-ext/tests/wiki-card.spec.ts`：退出 0，无输出。
- `git status --short --ignore-submodules=all -- dsh-ext/ui/wiki-card.tsx dsh-ext/tests/wiki-card.spec.ts`：仅显示这两个文件为 `M`。
- `git rev-parse HEAD`：取得上述完整 SHA。
- `Get-FileHash -Algorithm SHA256`：取得上述两个最终文件哈希。

所有 exec 均显式使用指定的原生 PowerShell pwsh、`login=false`；未使用 Bash。

## 验证禁区与保全

- **没有**运行 Vitest、tsc、pytest、collect/test/build/prepare、服务、GUI、RPC 或 native app imports，也没有任何自测。
- 没有读取真实案卷、Key、网络或模型；没有改 TEMP、权限、ACL、UAC、沙箱、审批或锁。
- 没有执行 add、commit、rebase、stash、reset、clean、checkout、push 或任何其他 Git 写操作。
- 原有 dirty/untracked 内容未 reset、revert、format 或覆盖；目标两文件改动前为 clean。

## 根端待办

- 根端针对该空 wiki 场景执行独立有限测试。
- 根端随后在固定构建上做真实 GUI 复核，确认无旧提示/卡片且首页 Skill 胶囊生成流程不变。
- 在根端验收前，本交回只证明完成有界源码与回归改动，不证明测试或真实 GUI 已通过。
