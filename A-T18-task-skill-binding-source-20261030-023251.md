# T18 任务 Skill 绑定来源注记

## 1. 任务与边界

本注记只服务执行令：

`D:\Lawbeach\lawbench-coord\A-T18-task-skill-binding-order-20261030-023251.md`

执行令要求把任务单已有的显式 `skill` 选择传播到首次模型的上下文，让模型先通过实际 `skill` 工具加载该 Skill；不新增分类器、路由、TaskState 字段、门、框架、UI 或测试旁路。产品改动只允许：

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
- 新增 `D:\Lawbeach\lawbench-A\dsh-ext\tests\task-skill-binding-20261030-023251.spec.ts`

本次没有运行 Node、Python、测试、构建、AST、导入或模型请求。Git 全程只读，没有暂存、提交、rebase、stash、reset、clean、checkout 或 push。

## 2. 原始失败事实

来源：`T18TaskSkillBindingInput-20261030-023251\actual-failure.json`

- 真实运行中模型请求 12 次，12 次 HTTP 200；正确的 Skill 目录可见。
- 实际任务选择为 `legal-workflow`。
- 模型首次调用 Skill 工具时选择了 `litigation-docs`，随后 9 个案件读取/检索工具被拒，1 次提问回调被拒，最终走到错误的诉讼文书起草工作流。
- 这说明任务选择已经存在且可见，但没有被明确绑定到首次模型上下文；不能据此把原因改成 Skill 目录缺失或模型能力不足。

## 3. 权威语义

### Spec 9.2

原文：

> Skill 正文由 AI 通过 `skill` 工具加载。

> 输入区上方的选择管到律师改掉为止。

> **首轮注入**（`agent/pre-step` 第一步，插件向工作台服务要）

因此，产品侧传播的是“本次任务选择了哪个 Skill”，正文仍由实际 `skill` 工具加载。

### 工作台服务任务单

来源：`D:\Lawbeach\lawbench-A\service\lawbench\case\task.py`

- `begin()` 从同一会话当前待执行任务单复制出新的执行中任务。
- 复制来的 `skill` 字段保持不变。
- `/core/task/begin` 的返回值含 `"skill": task["skill"]`。
- 自由对话分支明确写 `"entry": None, "skill": None`。

因此，`LegalAgent.preStep` 中唯一可信的显式选择就是本次 `begin.value.skill`；不需要从材料、用户措辞、Skill 名模式或历史任务推断。

### 定钉源码

来源：`T18TaskSkillBindingInput-20261030-023251\agent-index.before.ts`

- 字节数：50557
- SHA-256：`d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801`
- `baseline459.json` 中同一路径的字节数和 SHA-256 与此完全一致。

原 `preStep` 已取得 `begin.value.skill`，但首次快照只放 L0、L1、可选 L1 目录和能力边界；没有把本次任务 Skill 身份告诉模型。

## 4. 采用的判断

在 `context` 成功返回后，从 `begin.value.skill` 取一次当前选择：

- 非 `null`：在同一个 `lawbench-context` 首快照末尾追加“本次任务 Skill”段。
- `null`：不追加任何段，自由对话原有快照保持不变。
- 段内只写该 Skill 的精确名称和“先通过实际 `skill` 工具加载、再按它执行任务”的通用指令。
- 不附 Skill 正文、不拼文件路径、不读取材料正文、不根据用户措辞判断，也不增加 TaskState 字段。
- `context` 失败时不生成 `enter` 或快照。
- 后续步骤不重注；同一 agent ID 新任务重新使用新的 `begin.value.skill`。

## 5. 主要源码位置

当前产品源码：

`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`

相对于定钉文件只新增以下 7 行，位置为当前 351、358–363：

```ts
      const selectedSkill = begin.value.skill
      if (selectedSkill !== null) {
        sections.push({
          name: '本次任务 Skill',
          text: `本次任务选择的是 ${selectedSkill}。执行任务动作前，必须先调用 skill 工具加载该 Skill，并按该 Skill 的要求执行任务。`,
        })
      }
```

插入点在成功的 `context` 之后、已有 L0/L1/能力边界之后、首快照生成之前。原有任务、provider/model、params、预算、必问项和 decision 消息路径未改。

## 6. 模糊处与限制

没有发现需要主编排另行裁决的 Spec 歧义。

明确保留以下限制：

- 本改动提高模型看到正确 Skill 身份的概率，不能保证模型实际遵守工具要求。
- 本次 A 线运行器按其执行令没有执行测试或构建，不能宣称运行通过。
- 真实模型行为、Native 生命周期、SDK 消费和最终业务正确性由主编排独立复验。
