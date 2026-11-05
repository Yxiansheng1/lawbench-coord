# A 线交回：T18 编译产物 16 用例派生测试

状态：`AUTHORED_NOT_RUN`

## 交付

- 新测试：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-search-compiled-20261101-030741.spec.ts`
- SHA-256：`9aad64a95d92aea06c5f66b2aa8a65af95144c62f3cd7ce197a5cf0c00fca4a0`
- 字节数：`13718`
- 原始 source16：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-search-read-order-20261101-024639.spec.ts`
- 原始 source16 SHA-256：`6a6c63fc8833693a04e61b25e38085506b498811745b9c1272fbe097144c4ea2`，与批准值一致

## 差异边界

新测试从原始 source16 复制。只把原 3 个运行时符号的静态导入替换为：

- 类型为 `string` 的 `COMPILED_AGENT_URI`
- 从 `await import(COMPILED_AGENT_URI)` 解构 `CONTRACT_REVIEW_SKILL`、`DEFENSE_OPINION_SKILL`、`LegalAgent`
- 以 `typeof import('../agent/index.ts')` 保留原始类型检查

字面 URI 使用批准清单中的编译产物路径。`describe`、断言、`MemoryCore`、记忆夹具、问题生产、Host 元数据、16 个用例和 `__dirname` 相对路径均未改动；新测试仍在原 `tests` 目录。未使用静态 `.js` 导入、TS7016 抑制、`ts-ignore` 或 compiledAgent mock。

只读核验结果：源件哈希匹配批准值；新测试与“原件仅替换指定导入块”的预期按 ordinal 比较完全一致；16 个用例保持不变。

## 未运行与禁区

按要求未运行 Node、Node parser、Python、测试、类型检查、构建、prepare、应用、HTTP、模型、GUI、Git、环境变量、凭据或运行时。未读取、复制或修改 compiled JS、产品、SDK、guards 或 source16；未进行任何 Git 写操作；未改沙箱、审批、ACL、锁或 API。

根队列可执行预先批准的 compiled16 + 类型检查各一次，正式验证时限 `120s`；之后按既定顺序完成全量 source inverse/raw、setup 清理复核。无需再次申请模型权限。

## 工具说明

首次最终核验命令在用例数正则转义处提前失败，未产生核验输出，也未写入文件；随后以字面量计数重跑只读核验成功。交付文件本身未受该失败影响。
