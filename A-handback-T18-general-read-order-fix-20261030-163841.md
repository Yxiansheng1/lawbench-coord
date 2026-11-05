# A 线 T18 通用文书先问后读修复交回

状态：`SOURCE_ONLY_GENERAL_READ_ORDER_FIX_COMPLETE`。本轮运行/测试/构建次数均为 0，未联系其它会话，未更换 API，未尝试 Bash。

## 输入核对

- 按执行令读取 `approved-inputs.json`，并以其中五个快照核对开工状态。
- 修改前，三个待改文件的字节数与 SHA-256 均匹配冻结输入。
- 新专项测试保持逐字节不变：`14107` 字节，SHA-256 `AD772E1629D2A1F4C048403A03F135E6707F355659CBA6B02D8CDBD0572979E3`。
- `task-state.ts` 保持逐字节不变：`22291` 字节，SHA-256 `82121824045EEE3E4E816CAA5C066152B7E00681C39C207D49F562B399801815`。

## 修改

1. `dsh-ext/agent/index.ts`
   - 既有 `questionsBeforeMaterialRead` 构造参数条件增加 `GENERAL_DRAFTING_SKILL`，复用原有提问、读取闸门、直接执行和生命周期逻辑。
   - 拒答前缀仅改为中性“文书起草”措辞；缺项后缀及导出助手未变。
   - 守卫注释同步写明诉讼文书与通用文书。
   - 修改后：`50958` 字节，SHA-256 `F2F8444F9CC4F83A98153F40DC81FB32DCF5E0C21C846101C60433C274896EAD`。
2. `dsh-ext/tests/litigation-question-order-20261029-192258.spec.ts`
   - 保留 GENERAL 行及其它全部控制行；仅 GENERAL 行改为启用先问后读，材料与 Wiki 均按现有 `questionsBeforeReadDenial(state!.missingQuestionIds())` 断言拒绝，其它行保持 false/allow。
   - 仅同步修正测试标题。
   - 修改后：`26334` 字节，SHA-256 `86B95FDCC521B41E8B8A802B4010A9F6ECE4B391B1056C3359756EDD2A67C551`。
3. `dsh-ext/tests/archive-workflow-gate-20261030-003021.spec.ts`
   - 既有读取拒绝分支增加 `GENERAL_DRAFTING_SKILL`，该块其它内容未变。
   - 修改后：`29674` 字节，SHA-256 `6B50FB8076BC463454454514F53583EB2F40A87939BBE2C18E34EE05EB4F4FF1`。

三个修改文件与冻结快照的只读 diff 只含上述许可内行；未删除 GENERAL 控制，未改必问 ID、回答夹具、运行接线、契约、Skill、依赖、提示词或其它源码。此前尚未提交的工作保持原样；本次仅编辑上述三个文件。

## 验证与边界

- 已复用执行令中的既有 RED 证据：主专项当前运行 `RED 3 / PASS 7`、`3.375s`、`0 forced`、`4 complete OS gone`；本轮不重跑。既有 5 项写入闸门测试此前通过，本轮不重跑。
- 已做只读源差异与 SHA-256/字节检查；按令未运行新专项、相关既有测试、类型检查、全量测试、构建或应用。
- Git 保持严格只读：未执行 add/commit/rebase/stash/reset/clean/checkout/push，未暂存、未提交。只读 `git status --short` 因 `lawbench-A/.../dsh/.git` 目录权限被拒；未修锁、未扩权、未改 ACL。
- 无提交 SHA：Git 写入不在本运行器授权内，交回以本文件为准。

根执行者待办：按令运行新专项与既有 General/诉讼/归档相关定向单元及类型检查，不跑全量，不重跑未变化绿灯。
