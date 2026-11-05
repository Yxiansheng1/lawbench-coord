# A 线交回：P8 G1 inject-only

执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-P8-G1-inject-only-20261102-124100.md`

状态：完成指定两处声明修改，未运行测试、构建、采集或其他验证程序。`STRICT_NOT_RUN`

## 实际修改

| 文件 | 行号 | 替换次数 | 修改后字节数 | 修改后 SHA-256 |
|---|---:|---:|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\live-writer.spec.ts` | 125 | 1 | 32796 | `c86a740d03b2a3728acd3308106bb56f602143449a4ca9d1745f0060071ef5f9` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-tools-capability.spec.ts` | 346 | 1 | 36716 | `c11c1f94d8d9d3c11b3699bebabb7d0a80ff999f96c222b4d33bc33ff7a03023` |

每处均将唯一字面量：

```text
inject: ['tools', 'lawbenchCore']
```

替换为：

```text
inject: ['tools', 'lawbenchCore', 'llm']
```

修改采用 .NET 字节级拼接，每文件仅增加 7 字节。修改后两个文件中旧字面量计数均为 0，新字面量计数均为 1，目标行位与执行令一致。

## 原字节保全核验

| 文件 | 逆向恢复后字节数 | 逆向恢复后 SHA-256 | 原钉定 SHA-256 | 完全一致 |
|---|---:|---|---|---|
| `live-writer.spec.ts` | 32789 | `efb51dfccd4f9c8ec3b3213fd8a38086b4cd148d403e06013da2fe66c8a2f1c5` | `efb51dfccd4f9c8ec3b3213fd8a38086b4cd148d403e06013da2fe66c8a2f1c5` | 是 |
| `t34-tools-capability.spec.ts` | 36709 | `1546450b88ccfab03ad47bd87b50ae85c3420b5816c026a186516cdb18e1fcfd` | `1546450b88ccfab03ad47bd87b50ae85c3420b5816c026a186516cdb18e1fcfd` | 是 |

## 命令与边界记录

- `exec_command` 实际执行 7 次，其中 5 次成功、2 次非零。
- 2 次非零均为修改前只读核验中的 PowerShell `ParserError`，没有发生文件写入；随后以只读等价写法成功复核。
- 唯一产品树写入为上述两个文件的目标字面量；没有其他产品树或配置改动。
- 未执行 Git 命令，未进行暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 未运行 Node、Python、AST、parser、import、Vitest、tsc、pytest、collect、prepare、serve、probe、HTTP、GUI、模型、build 或 self-test。
- 未读取或修改凭据、环境、Keyring、`.env.local`、案卷、发票或全局策略。
- 未联系其他聊天，未更换 API，未启动 setup，未更改沙箱、审批或 ACL，未拆 writer 锁。
