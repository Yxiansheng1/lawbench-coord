# A-T18 质证意见答案路径交回

## 结论

- 状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`
- 有界修正：完成；未声称有限测试、514 准入、实际模型或 T18 已通过。
- 作者本轮 Node/Python/测试/构建/HTTP/模型运行：`0`
- Git 写入、暂存、提交：`0`

本次只改有限测试器顶层的
`authorizedAnswersPath` 初始化行，把正斜杠预期改为与产品
`AUTHORIZED_SYNTHETIC_ANSWERS_PATH` 运行时值完全相等的 Windows 字面量：

```ts
String.raw`D:\Lawbeach\lawbench-coord\T18CrossExamNativeInput-20261029-113906\authorized-synthetic-answers.json`
```

两处 `assert.equal(path, authorizedAnswersPath)` 严格断言保持原样，分别位于
第 721、918 行；未加入运行时归一化，未改读取器、VM 工厂、回调、
`args`/`raw` 哈希、10 个非法控制、重复控制、并发控制或读取失败控制。

## 文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `verify-callback-finite.mts` | 35380 | `25709059ebafb461609417abbf4cfbaf17f564beba1ae2cdd0f9ee9a1cca6510` |
| `README.md` | 10920 | `32077880f4d6fc1f203721c7f5038e32a5edaea00820285e49639f77df0c10cf` |

冻结输入：

- `verify-callback-finite.mts`：35370 字节，
  `4d9a7da607ab7906b80eaf4ce3fad2fedd3d723255ea9964ae30d9ad0904decc`
- `original-finite-path-failure.json`：1262 字节，
  `dd83cebd107f5f11f45589bb812f54a91f4dc6078c31f973a63efb1ccf0ba903`

逐行比较冻结测试器与新测试器只有一对删除/新增，即上述路径初始化文本；
没有其他差异行。

以下关键 pin 的实测字节与 SHA 均未变化：

- `native-cross-exam.mts`：129399，
  `6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454`
- `b-service-cross-exam.py`：48345，
  `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d`
- `literalfixed-inputs.json`：12276，
  `b802114960025acbd28a567289c6ff066524fd6953142b622e972ab732acc03c`
- `dsh-ext\agent\index.ts`：46684，
  `5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c`
- 授权合成答案：453，
  `4784dfc3d345ec2010c1443f7f803bc39fdfd5ca19754b2d4bc6b96a0ae2c9ce`

## 既有失败与保留事实

根接续记录显示原有限测试在 `0.9598135s` 退出 1，
`CoreAgentSessionCreated=false`、`NativeResourceClaimed=false`、`forced=false`、
`source_unchanged=true`；实际模型、Native 和产品 main 未执行，三个完整 OS
身份均记录为 gone。既有旧回调 `bad -> valid` RED、实际 bad 参数本地拒绝及
授权三答案读取事实继续沿用，不重演。

作者没有运行修正后的有限测试。根的一轮只读复核顺序仍为：

1. 对单常量差异做 FULL 反演/字节保全审计，并复核既有全部命令边界；
2. 只运行一次受影响的 `verify-callback-finite.mts`；
3. 通过既有 514 准入；
4. 使用同一 canonical 输入运行一次实际模型链路并走完记录闭环。

本交回件后停止；不新增框架文档，不自行构建、复跑或扩权。

## 阻碍与 Git

既有 dirty 全部保留。默认 `git status` 仍在只读
`modules\dsh` gitdir 处遇到 `Permission denied`；关闭子模块递归后可见大量既有
dirty，但长路径文件产生只读扫描警告。未修改权限、ACL、沙箱、审批或 writer
锁，未执行任何 Git 写操作。因本次运行器禁止 Git 写入，没有提交 SHA。
