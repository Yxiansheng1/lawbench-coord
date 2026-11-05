# A 线交回：T18 合同问题门运行时材料列表 fixture

状态：有界修改与静态验证完成；等待主编排执行 actual test。未提交 Git。

## 交付

仅修改：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\contract-question-gate-runtime.spec.ts`

`makeCore.result` 的 `command === 'tool'` 分支现在仅对 `body.tool === 'case_list_materials'` 返回：

```json
{"materials": [], "total": 0}
```

`case_save_draft` 继续返回 `SAVED`；其他工具仍返回 `{}`。未修改产品源码、契约 schema、SDK、工具管线、测试断言或测试流程。

证据：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractQuestionGate-20261028-174016\fixture-list-materials-20261028-185449.md`

## 字节与哈希

| 对象 | 修改前 | 修改后 |
| --- | --- | --- |
| 测试 fixture | 15396 bytes / `3708C9D262970124E2F2776CC60A761EC9A50B32D6B3CDCC0C652E6933807050` | 15507 bytes / `C5C89D7FBC42EAA70144565D62C27FCAA2559335113C82EC106B25F5810B09EC` |
| `case_list_materials.schema.json` | 842 bytes / `106C025F947896DCF766A028D620AD8B04B02555B31F6A7B15D44BCE795F38B9` | 同前，未变 |

对修改后完整文件做内存反向复原，将新增分支换回原单行后得到 15396 bytes / `3708C9D262970124E2F2776CC60A761EC9A50B32D6B3CDCC0C652E6933807050`，与修改前一致；确认替换区之外无字节变化。

## 验证边界

按正式执行令的 `AUTHORRUNTIME0`，本轮未运行 Node、Python、Vitest、tsc、解析器、导入、AST、prepare、serve、probe、HTTP、模型、GUI、SSH 或 build。旧实测证据中产品源码未受本轮改动影响，可继续复用；新 fixture 的 `list-budget` 实际转绿结论留给主编排随后执行 actual test。

## 工作树与阻碍

- 修改前工作树已 dirty/untracked；全部既有内容原样保留，未清理或回退。
- Git 仅只读。未执行 add、commit、rebase、stash、reset、clean、checkout、push。
- 直接读取根状态时 `dsh` 子模块路径出现 `Permission denied`；随后严格使用 `--ignore-submodules=all` 做只读状态核对，未修权限、未动 index.lock。
- 首个读取执行令的调用误配为 Bash，遭 `ACCESS_DENIED` 且未执行；随后全部调用使用指定 native PowerShell，`login=false`，未切换 legacy、未启动 setup、未改审批/沙箱/ACL。
- 当前进程即本次执行者；未启动第二 writer，未拆 writer 锁。
- 合同问题门项目级里程碑未完成，打包仍为 HOLD。
