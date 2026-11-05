# A 线交回：T18 人工原因观察器白名单修复

状态：作者侧有界修改完成，等待 root 逆变换核对与一次新的有限重跑。本文不把源码修改表述为工作流通过。

## 精确改动

唯一源码改动位于：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-reason-observer.spec.mts`

在既有 `safeCalls` 集合内仅新增一行：

```diff
+  'add',
```

修改前：7,377 字节，SHA-256 `ee7a89af4a3387b69177b7919911607923fe0fcf4c5b62c111855da50c672934`。

修改后：7,386 字节，SHA-256 `1455f9e3bd683b0ce10b41ce1bf3f315c304bb39d9a537ece12a89c6322da890`。

机械核验：新增内容为精确 9 字节的 `  'add',` 加换行；从当前文件仅移除这段内容后，完整文件恢复为修改前 SHA-256。`'add'` 行在目标文件中恰有一处。未删除宽过滤器，未增加通配许可或新加载器。

`README.md` 仅把该测试文件的字节数及 SHA-256 从旧值同步为上述新值；其状态和其余说明未改。

## 冻结对象

以下文件在本交回前重新以 SHA-256 核对，均与执行令给定的原始身份一致：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 107162 | `d1146fcfd9bc71e73de091e1fc578eb0faa66c71d4e562fe535016b7ffb80479` |
| `b-service.py` | 30607 | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `fixed-inputs.json` | 17162 | `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139` |

消费者、实际函数提取与唯一调用点、16 个聚焦案例、固定输入和 fixture 均未改。原正式说明、状态、失败根证据及协调目录输入未改。没有改动产品代码、B、manifest、模型、断言、提示词、预算或日志。

## 验证与运行边界

作者运行次数：0。

本次没有运行 Node、Python、TypeScript/解析器/AST、import、测试、tsc、Vitest、构建、HTTP、模型、GUI、SSH、Key、DPAPI、环境变量读取、其他凭据或产品运行时。仅使用原生 PowerShell 做文件读取、哈希与精确字节逆变换检查。期间有一次仅目录列示尝试误用不可用的 Bash 入口，被环境立即以 `E_ACCESS_DENIED` 拒绝；该调用未执行、未产生写入，之后全部使用指定原生 PowerShell。

Git 全程严格只读；没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。既有 dirty 工作树未清理、未暂存、未覆盖。根仓库只读状态查询曾因子模块 `dsh` 权限拒绝及既有长路径警告未完整枚举，该阻碍未通过改锁、扩权或修改 ACL 处理，不影响本张有界修改。

## 下一步与资格

root 可按执行令先对 `'add'` 做一次精确逆变换检查，再执行一次新的有限重跑。旧失败根证据保持不可变；新有限运行完成前，不宣称观察器通过。

Gate 1、完整 T18 和项目仍未完成；Packaging 继续 **HOLD**；`20 vs 2` 比例仍是 B 线实际修复事项。交接完成点为本文落盘，不涉及 Git 提交。
