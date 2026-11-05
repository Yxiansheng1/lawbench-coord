# 原生 preflight 收尾修订说明

状态：`STATIC_AMENDED_NOT_RUN`。本阶段只改了消费器的控制流，没有运行 Node、tsx、TypeScript、解析器、测试、tsc、产品导入、HTTP、模型或 GUI，也没有读取 6000D Key。

## 结论

消费器的 preflight 分支原先在 `try` 内直接 `return`。JavaScript 会先执行 `finally`，随后退出 `main()`，因此 finally 之后的清理不变量判定、最终固定输入校验、`report.json` 写入、stdout 结果和退出码都被跳过。这正是 preflight 路径可能退出 0 却未写最终报告、也未证明承诺不变量的原因。

本次只把 preflight 与其后的完整对话路径改成同一个 `if/else` 的互斥分支。preflight 仍执行生产装配、生产 Session/Agent 创建和 Browser Session 创建，但不读 Key、不提交提示、不进入完整对话或 fork 路径；退出 `else` 后继续进入同一个 finally 和同一段 finally 之后收尾逻辑。完整模式的原流程仍位于 `else` 内。

## 目标与边界

只修改：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts`

新增：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-preflight-finalize-20261028-010748.md`

新增协调交回件：

- `D:\Lawbeach\lawbench-coord\A-handback-native-preflight-finalize-20261028-010748.md`

其余 dirty、源码、测试、配置、运行时、guard、18 个旧材料、B/C 线材料、旧 README、旧说明、旧交回件和旧状态全部保留。未执行任何 Git 写入、权限修改、锁修改、审批修改、全局配置修改或凭据访问。

## 实际修改

第一处删除了 preflight 分支的提前返回，并把完整路径放到同级 `else`：

```diff
-      return
-    }
+    } else {
```

第二处在完整路径结束后关闭新增的 `else`：

```diff
     report.status = 'PASS'
+    }
   } catch (error: unknown) {
```

修改后的关键位置：

- 第 1160 行：`if (mode === 'preflight-only') {`
- 第 1170 行：`} else {`
- 第 1420 行：`report.admission.final = await verifyFixedInputs()`
- 第 1436 行：`await writeFile(reportPath, serialized, { encoding: 'utf8', flag: 'wx' })`

文件中不再存在从 preflight 状态设置直接离开 `main()` 的 `return`。未新增状态机、框架、加载器、合成输出或假凭据。

## 静态核对

冻结输入 `fixed-inputs.json` 在协调输入目录和证据目录中均为 14,284 字节，SHA-256 均为：

```text
ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522
```

消费器修订前为 51,654 字节，SHA-256 为：

```text
efb4c295f081c03bd39b396012c812c2810e15c69336d0cc23c0b41b81c0ef65
```

修订后仍为 51,654 字节、1,452 行、1,452 个 LF、0 个 CRLF、无 BOM，SHA-256 为：

```text
7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93
```

使用修订前字节、上述两个精确片段和修订后字节做内存内重建，结果与原文件全文本严格相等。该检查证明：除两个片段外，其余字节均未变化。

三个冻结区段在修订前后的 SHA-256 均相同：

| 区段 | 修订前后共同 SHA-256 |
|---|---|
| `PROMPTS` 至 `NativeEvent` 定义前 | `961dab52f2baf89f2b466d59922342f766b253d26dc2fd6a32f847d6e2d98460` |
| `assertTurn` 至 `readPersistedEvents` 前 | `884122a6d45c28aa193fb02848b42868a99dcb63aa56ad52d0d50388d0f8495c` |
| 生产 fork 调用至 `PASS` 状态设置 | `99ab9d3acede3a0933c0825b16d233c6de91b4974987ec81249c46f5d0bee1a7` |

开工前 dirty 清单为 195 行。开工后使用只读 `git status --short --branch --ignore-submodules=all` 重取，仍为 195 行，逐行比较完全一致。

历史原始消费器为 39,711 字节，正确 SHA-256 为：

```text
24d9458aa87f07f35bf9c7851bc0104e01be4b05372d12a66b0df5c4ccc8c73
```

旧 004315 说明和交回件中的该值多写了一个 `c`。旧文件按令保留，本说明只记录正确值，不回写历史文件。

## 未验证与交回

本阶段没有运行修订后的 preflight，也没有运行完整对话。真实 no-Key 生产装配、`report.json`、initial/final 两次准入、自然清理和 stdout/退出码必须由 root 独立执行。静态修订不是模型、GUI 或完整 T31 验收。

全部实际 Shell 命令、成功与失败返回值见协调交回件。

