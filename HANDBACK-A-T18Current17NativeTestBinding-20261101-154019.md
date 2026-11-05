# T18 Current17 Native Test Binding — A 线交回

状态：`AUTHORED_NOT_RUN`  
运行次数：`0`

## 范围

仅修改以下两个测试文件中的夹具准备身份，各完成一处精确 ASCII 字面量替换。未修改任何函数、断言、requiredRoot/requiredPort 或允许根目录保护逻辑，也未修改源码、preparer、生产代码、frozen18、E50、defaultlib 或 SDK。

| 测试 | 原标识 | 新标识 |
|---|---|---|
| T34 `dsh-ext/tests/t34-native-core-http.spec.ts` | `CoreHttpEntry-20261025-163357` | `CoreHttpEntryCurrent17-20261101-142727` |
| T32 `dsh-ext/tests/t32-native-draft-http.spec.ts` | `NativeDraftEntry-20261025-165327` | `NativeDraftEntryCurrent17-20261101-142727` |

## 字节校验

修改前两文件均与正式绑定中的原始字节数和 SHA-256 完全一致。

| 测试 | 修改后字节数 | 修改后 SHA-256 | 旧标识计数 | 新标识计数 |
|---|---:|---|---:|---:|
| T34 | 8,337 | `dc96b528e52fd0cfe26281ba3fe433838be492c76777c4a866e907ceec086028` | 0 | 1 |
| T32 | 15,240 | `1c672fe8d1da0e2b7f7db55e3840d2f389729b3cc3892653d0c93903e33d1fac` | 0 | 1 |

两个修改后哈希与绑定中的期望值逐一相符。

## 未执行项与边界

- 本交回件按令为 `AUTHORED_NOT_RUN`；未运行 Node、Python、解析器、测试、构建、服务、HTTP、模型或 GUI。
- 未执行或尝试任何 Git 写入；未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 未读取或写入其他项目文件，未联系其他聊天，未更换 API，未改沙箱、审批或 ACL，未拆分 writer 锁。
- 旧 T34 的原始 RED 证据保持不变；新的受限测试与全目录逆向验证由 Root 在收到本交回后执行。
