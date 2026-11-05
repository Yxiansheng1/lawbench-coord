# A 线 Batch4 交回（current）

状态：源码与测试修改完成，按令未执行任何测试、构建、解析器、运行时、网络或 GUI 验证；未执行 Git 写操作。

执行入口：`D:\Lawbeach\lawbench-coord\ORCH-A-Batch4-UI-20261103-092534.md`

工作树：`D:\Lawbeach\lawbench-A`

## 本运行器改动

1. `dsh-ext/ui/remote-access.tsx`
   - 状态原因加入 `EXTERNAL_NOT_TUNNEL`。
   - 连接文案区分：
     - `connected`：`已连接（工作台隧道）`
     - `external`：`已连接（现有 EasyTier）`
     - `EXTERNAL_NOT_TUNNEL`：`目标可达，但不是工作台隧道`（先于通用状态文案判断）
   - 外部说明改为“所外出口已通过现有 EasyTier 验证”，并继续明确不证明两台服务器或身份认证；接入优先级说明改为优先使用已验证的现有 EasyTier。
   - 接入码规则保持长度 1..512、不 trim、无 32 位十六进制限制；字符范围限定为 `0x21..0x7E`。
   - 非法字符固定文案：`接入码只能包含字母、数字和常见符号，不能有中文、空格或不可见字符`；长度错误使用固定文案 `接入码应为 1 至 512 个字符`。
   - 非空非法输入即时显示错误；空输入不立即报错。非法时禁用保存，Enter 和程序化 click 均不发 POST。
   - 保存仍只发 `{ code }`，成功后清空输入；`type=password`、`autoComplete=off`、不回显/不存储保持不变。
   - 既有 busy、epoch、stale read 和 action gate 保持原逻辑。

2. `contracts/api/remote_access.schema.json`
   - 仅在 response value 和 `$defs/value` 两处 reason 枚举加入 `EXTERNAL_NOT_TUNNEL`。
   - 未改动请求规则或其他契约语义；进场前已存在的 `RUNTIME_MISSING` 改动原样保留。

3. `dsh-ext/tests/owner-batch4-remote.spec.ts`（新增，未执行）
   - 使用真实组件、当前仓库契约虚拟加载器和可控假 Host，不接 Electron、HTTP、GUI、核心或模型。
   - 覆盖三种真相文案、未知 reason 不回显、新 reason 响应契约。
   - 覆盖中文、空格、零宽、控制字符、其他非 ASCII、DEL 即时报错、禁用保存、Enter/程序化 click 零 POST。
   - 覆盖非十六进制短串、常见可见符号、32 位十六进制、512/513、保存后清空、服务仅回 `has_code`、不返回接入码。
   - 覆盖立即连接/断开仍分别 POST `enabled:true/false`。

4. `dsh-ext/tests/owner-remote-p05-20261102.spec.ts`
   - 仅把旧 `connected` 期望更新为 `已连接（工作台隧道）` 及对应说明。
   - 仅把原中文测试接入码改为可见 ASCII 假值，以匹配新字符规则；未削弱断言。

`dsh-ext/tests/owner-runtime-detection-batch2.spec.ts` 无需修改，本次未改。
`dsh-ext/shared/remote-methods.ts` 未改；其中已有 T49 方法改动属于进场前 dirty，本次原样保留。

## 已完成检查

- 逐文件只读核对源码、契约、既有测试及新测试。
- `git diff --check` 对本任务契约、UI、两份测试文件通过，无输出。
- 文件 SHA256：
  - `remote-access.tsx`：`16BD2AD42337F8DB57BBDB57C0038F731ECC96629573A4DFE30CB1ED43BFA492`
  - `remote_access.schema.json`：`1E2624FA5E4919A6CEE64FCB60F218302F166A54E5D09F550AD6C8BF554BF5FC`
  - `owner-batch4-remote.spec.ts`：`695F090B9BAC8697A649227889874FC26F9384D6CCC10BCDF336054055BA44E6`
  - `owner-remote-p05-20261102.spec.ts`：`2E34FD2E70EF51EF68F5B6403AA83D096A06DE5540A719C7A9FF74DA592FE688`

## 阻碍与需主编排处理

1. 根级 `git status --short` 被只读权限拒绝：`cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。按要求未修复权限、未改锁、未扩大审批，也不影响本次源码交回。
2. 未列入本次白名单的既有测试 `dsh-ext/tests/remote-access.spec.ts` 仍断言旧状态文案、空串报错和 Unicode 输入可保存。本次未修改、未执行；需要主编排决定是否另派白名单更新，否则后续全量测试预计冲突。
3. `contracts/_build/gen_schemas.py` 的 remote access reason 列表仍未包含 `EXTERNAL_NOT_TUNNEL`。按本令“schema 仅加两处枚举”的要求未改该生成器；若之后重新生成契约，需先由主编排批准同步，避免把新枚举覆盖掉。
4. 未提交、未暂存：本令明确要求 Git 只读，交回以本文件为准。
