# A 线 T34 provider priority 值断言回交

状态：`SOURCE_ONLY_VALUE_ASSERTION_FIX / ROOT_FINAL_PENDING`

新测试 `dsh/packages/settings/settings/tests/t34-provider-priority-value-20261030-113809.spec.ts`
仅把旧测试的一次 `toBe` 改为 `toEqual`；逆变换逐字节恢复旧 7218 B，
SHA-256 `160617c6041635ae0acfe8b411f84df6216893cf4ace99c59cd1f07299b90fbd`。新文件
7221 B，SHA-256 `437ea11efc459b5e27d345c1f5bb7359325abfcdffcbd80b7175215dc81faa45`。

证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPriorityValue-20261030-113809`
。配置 1109 B，SHA-256
`4df06451d472ac0aa9d6152716f0d4b0227edaf9bd87c5a2f564da19f3724b8f`；字面量为旧 7686 B
精确副本，SHA-256 `f44167b8c98ca16b22c5b7d23959e1cfb2426c46eefbd8229750f0718d951d14`。

候选 12、原始钉 17、既有 dirty 57、旧 4 项前后均匹配。无 `runtime`，运行次数 0；Git
仅限路径只读，未暂存或提交。
