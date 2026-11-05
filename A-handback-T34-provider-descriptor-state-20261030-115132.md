# A 线交回：T34 provider descriptor state

状态：`SOURCE_ONLY_DESCRIPTOR_STATE_CONTRACT_READY / ROOT_NEGATIVE_PENDING`

## 交付

- 新测试：`D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\tests\t34-provider-descriptor-state-20261030-115132.spec.ts`，7458 B，SHA-256 `0856ec8bc83919f6e929288298a480f9674e84429fb5779a344b198467abd69d`。由旧 7221 B 文件逐字节复制，唯一目标行出现一次并精确替换为指定五行；其余字节一致，LF 保持。
- 契约：只排除易变的 `schema` 图；`revision`、`ns`、`value`、`base`、`user`、`autoGenerate`、`applies` 及未来非 `schema` 字段全部留在状态比较中，并分别确认前后 `schema` 已定义。不宣称整个 descriptor 或 schema 图不变。
- 证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderDescriptorState-20261030-115132\`。config 1113 B，SHA-256 `0f6af4d20d653f35d328fa679f1efce46a12bde30dbe3cd42c22bbf96ad50638`；相对旧 config 仅替换 `cacheDir` 与 `include`，其余字节一致。literal 7686 B，SHA-256 `f44167b8c98ca16b22c5b7d23959e1cfb2426c46eefbd8229750f0718d951d14`，与旧基线逐字节相同，仅作基线而非当前目标清单。

## 冻结与核验

- 输入冻结：`D:\Lawbeach\lawbench-coord\T34ProviderDescriptorStateInput-20261030-115132\approved-inputs.json`，34694 B，SHA-256 `f6fe2721d51b710bd851b85b7de0a90885ac3e88f8470fa24645fd8aa48ccb5c`。
- 冻结清单中的 110 个 pin 全部字节数与 SHA-256 相符，偏差 0；候选 12 文件、原始 SDK/lib、旧四项和 primary 三文件身份均保持。
- 原始 FAILED 保留未改：`root-result.json` 2402 B / `67693e0d260b49671204733a0c88c15b4cddaf486ec562f801d12a53e4884ce4`，`results.json` 2087 B / `dc142e4e23d435b7f11e503a36ecc3dd84a0b6e67da2acc8ec9dee11f3df24e8`。

## 运行边界与下一步

本线 Node/Python/测试/构建/import/check/GUI/HTTP/model/process-probe 执行均为 0，运行期非零退出为 0，`runtime` 目录为 0，Git 写入为 0。旧用例前两项及其源码未重跑；根环境应仅通过既有 90 秒身份核验 wrapper 复跑第三项，并复用前两项源码不变的原绿灯。不得宣称三次全过、native GUI 或 SDK 已激活。

阻碍记录：只读 `git status` 因共享 worktree 的子模块权限被拒；未改锁、未扩权。一次按 `config.json` 的只读探针不存在，精确目录核对后确认实名为 `vitest.finite.config.mjs`。
