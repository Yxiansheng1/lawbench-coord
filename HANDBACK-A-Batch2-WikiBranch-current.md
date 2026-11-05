# A 线 · Batch2 案件 wiki 文案 + 隐藏原生分支按钮（交回件）

执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-Batch2-WikiBranch-20261102-220340.md`
执行者：A 线（独立执行会话）
日期：2026-11-02

## 做了什么（严格四个文件，未越界）

1. **改** `dsh-ext\ui\wiki-card.tsx` — 只改 `statusLine` 的兜底文案：
   - 原来读不到生成时间一律写「生成时间读不到」。
   - 现在按 `w.exists` 分两句实话：`已有案件 wiki，未记录生成时间` / `尚未生成案件 wiki，可按需生成`。
   - 读得到生成时间时仍照旧写「生成于 …」；缺板块计数（「N 个板块还没有内容」）原样保留。
   - 这两处源码之外该文件未动。

2. **新增** `dsh-ext\ui\batch2-display-policy.ts`：
   - 导出 `BRANCH_BUTTON_STYLE`：一条 CSS，只针对
     `button[aria-label="在新对话中分支"]` 和 `button[aria-label="Branch into a new conversation"]`
     两条，`display: none !important;`。没有宽泛的 `button` 选择器，没有改内容/逻辑/SDK。
   - 导出 `installBatch2DisplayPolicy(doc: Document = document): () => void`：
     样式 id 固定 `lb-owner-hide-branch`；已存在则不重复装、直接返回空操作；
     否则把自带 style 挂到 `doc.head`；返回的清理函数只摘自己刚挂的那一个元素。
   - 无 MutationObserver、无外部 I/O。

3. **改** `dsh-ext\ui\index.tsx` — 两处：
   - 第 33 行加一行导入 `installBatch2DisplayPolicy`。
   - `registerCore` 里 `ensureFieldStyle()` 之后加
     `ctx.effect(() => installBatch2DisplayPolicy(), '律师工作台界面：隐藏原生分支按钮')`。
   - 品牌/logo 及其它任何行未动。

4. **新增** `dsh-ext\tests\owner-checklist-display-batch2.spec.ts`：
   - jsdom 注解；只用全局 `describe/it/expect`，没有 `import ... from 'vitest'`。
   - 只导入新模块和 wiki-card。覆盖：
     未生成 / 已生成但无时间戳 / 有时间戳 / 缺板块计数 四种文案；
     样式文本只含两个 locale 标签且非宽泛 button 选择器；
     装上→清理摘掉；已装过→第二次空操作且清理不摘掉别人的样式。

## 验证

- 按令**未运行**任何测试、构建、tsc、parser、GUI、HTTP、模型调用。
- 作者侧只做了定点文本核对（PowerShell 读文件确认改处落位），未做任何 git 写操作。
- 新测试文件由他人执行；本执行者未跑过，因此它的通过与否**尚无证据**。

## Git 状态

- 全程只读 Git，未执行 add/commit/rebase/stash/reset/clean/checkout/push，未暂存、未提交。
- 改动以工作区文件形式留存，提交动作留给主编排在其 `main` 流程里处理。

## 偏离之处

- 无功能性偏离。仅一处自主判断：交回件按令要求写入协调目录（非 Git 提交），路径如上。

## 遗留问题

- 新测试未由本执行者运行，无通过证据。
- 「在新对话中分支」/「Branch into a new conversation」两个 aria-label 依令按"已核实的当前 SDK 标签"直接采用，
  本次**未**重新核对 SDK 源码；若 SDK 后续改文案，需同步改 `BRANCH_BUTTON_STYLE` 与对应测试。
