# B手交回：T18 RequestDigestResume

状态：`AUTHORED_NOT_RUN`；不宣称 `businessPASS`。

## 交付位置

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestResume-20261031-223828`

新建目录此前不存在。以下五份文件以批准的原目录为源创建：

- `native-defense-opinion.mts`
- `b-service-defense-opinion.py`
- `wire-schema-finite.mjs`
- `request-digest-finite.mjs`
- `literalfixed-inputs.json`

## 完成范围

- 四个代码文件由 `System.IO.File.Copy` 原样复制，未编译、导入、解析、自检或执行；预期字节及 SHA-256 与批准原件一致。
- 清单仅替换 `consumer.path` 和 `bService.path` 到新目录，其他字段未改。
- 原输入目录、产品、SDK、guards、旧 raw、旧 status、配置、策略、案卷、历史和 Session 均未触碰。
- 未访问凭据，未做 HTTP、模型、GUI、运行时、环境、测试、构建或实际 workflow 验证。
- Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 后续验证归属

根编排按执行令核验新文件字节、当前源码 pins、清单反向路径，并复用已有同哈希的 `original12controlproof`，随后执行唯一一次实际 workflow。
