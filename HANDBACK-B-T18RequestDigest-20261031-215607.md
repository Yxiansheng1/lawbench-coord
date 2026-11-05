# HANDBACK — B / T18 Request Digest / 20261031-215607

状态：`AUTHORED_NOT_RUN`

本件是 B 线按 `ORCH-B-T18RequestDigest-20261031-215607.md` 完成的源码交回，
不是产品修复结论、模型回执、业务 PASS 或 T18 验收结论。B 作者没有执行
consumer、控制脚本、service、SDK、Agent、Session、provider 或 model；没有读取
凭据、环境、配置、DPAPI 或 Keyring；没有联系其他聊天，也没有更换 API。

## 交付位置

- 新证据目录：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607`
- 修改后的 consumer：
  `native-defense-opinion.mts`
- Root-only 有限控制脚本：
  `request-digest-finite.mjs`
- 说明：
  `README.md`
- 原样伴随副本：
  `b-service-defense-opinion.py`
- 原样旧有限脚本：
  `wire-schema-finite.mjs`
- 清单：
  `literalfixed-inputs.json`

## 源码身份

- `native-defense-opinion.mts`
  - bytes: `157009`
  - SHA-256:
    `71b27f13521abf96f651d97f620438ace8156a1170ac460422daca944a858a32`
- `request-digest-finite.mjs`
  - bytes: `17610`
  - SHA-256:
    `68cf6eb4222ea1f2eb3535a289061d26180e327048b64a1d32d2db52be43c814`
- `b-service-defense-opinion.py`
  - bytes: `53696`
  - SHA-256:
    `6dee119fcb6949b2df376445bd2f8f77b28f8f04e8463d40e3546068f5a2b6fd`
  - 与原始文件逐字节一致。
- `wire-schema-finite.mjs`
  - bytes: `21756`
  - SHA-256:
    `73272d3fd8adbc9b089ad57c1e6ea6402a130d297ee224383b3d9cea572f48ea`
  - 与原始文件逐字节一致。

## 允许的改动

1. `SOURCE_PINS_PATH` 与 `SOURCE_PINS_SHA256` 改为本令
   `approved.sourcePins`；`SOURCE_PINS_BYTES` 仍为 `53548`，346 项计数与检查
   函数未改。
2. 新增 `RequestMessageDigest` / `RequestWireDigest` 接口和
   `observeRequestMessageDigest`。观察器只读字符串
   `init.body` 或 `Request` 的有界 clone，不读 headers 或原 body；溢出会 cancel
   并 release，错误固定降级为 `observer-error`，不输出原始异常、正文或 header。
3. 在既有 `isModel` / `isLocal` 放行判断之后、原始 fetch 之前，对模型请求仅
   await 一次摘要观察，并把 `requestDigest` 与既有 `askSchema` 一起附着到
   `NetworkObservation`。原 fetch 表达式、allowlist、Session、submission、R、
   task、limits、service、cleanup 均未改。
4. `literalfixed-inputs.json` 只更新 source-pin 身份、consumer 路径/大小/SHA 与
   伴随 service 路径身份；原 sample/task/Skill/deps/runtime/private compiled
   字段保持原值。

## Root-only 验证设计

`request-digest-finite.mjs` 固定使用：

`D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js`

编译器 SHA-256：

`569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39`

脚本从最终 consumer 中按声明抽取实际 helper、其 type/SHA 依赖和既有
`ASK_SCHEMA_BODY_LIMIT_BYTES`，在带进程内网络拒绝的 VM 中执行；不 import
consumer、SDK、Agent 或 model。共 11 个合成正反控制，覆盖 Unicode 字节/SHA、
text-array 原始索引、whole-body/messages SHA、Request clone 后原 body 不变、
headers 零读取、invalid JSON、missing messages、unsupported body、overflow、
参数白名单和 sentinel 泄漏拒绝；断言失败非零退出，stdout 只输出紧致 receipt。

按令，B 作者没有运行该脚本。Root 应先完整核对源码、反向条件、setup/finally
清理及静态身份，再由 Root 提供新的绝对结果路径执行。不得把本次交付表述为
产品原因已定位或业务已通过。

## Git 与阻碍

Git 全程只读；没有执行 add、commit、rebase、stash、reset、clean、checkout
或 push，因此没有提交 SHA。源码交回通过写入协调目录完成。当前无需要 B 侧
越权处理的阻碍；剩余动作是 Root 按授权自行验证和判读。
