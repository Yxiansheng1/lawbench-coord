# A 线交回：T31 PiAI 模块形状修正

状态：`CHANGE_DONE_STATIC_VERIFIED / ROOT_FRESH_PREFLIGHT_REQUIRED`

## 结果

已只修改
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts`
的一处表达式：

```diff
- const PiAiModuleDefault = PiAiModule.default
+ const PiAiModuleDefault = PiAiModule
```

别名名称和第 1217 行
`await live.plugin(PiAiModuleDefault, {`
未变；其余配置、断言、固定输入针、256 token 上限、两次 POST 限制、fork、恢复、复制、摘要、checkpoint、TTY/stdin、清理和 `finally` 均未变。

## 精确证据

- 修改前：72,543 字节，SHA-256 `CD7E1A4E3AC19574FA99FB002501A8AB63A43F319F35812C8F5FA26B4F940B51`
- 修改后：72,535 字节，SHA-256 `4A6E9E7943FA9DB0289FE14C4A663B00AF008ACBF9602D1314DC4314D6087EBA`
- 将修改后的唯一新表达式按字节逆向还原后：72,543 字节，SHA-256 精确回到 `CD7E1A4E3AC19574FA99FB002501A8AB63A43F319F35812C8F5FA26B4F940B51`
- 结论：除指定表达式外，整个文件其余字节完全一致。
- 已接受消费者 `native-real-conversation.mts` 为 58,057 字节，SHA-256 `80C603F94C42F19CE635D245FC0520559AA9BB72FED55D2EF91685AE4D3C2343`；其第 1147 行直接使用 `live.plugin(PiAiModule, {`。

详细记录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\root-piai-module-shape-20261028-123044.md`

## 验证边界

实际运行次数为 0。未执行 Node、Python、TSX、import、parser、AST、测试、构建、prepare、probe、GUI、HTTP、模型、Key 读取或 SSH。未运行 preflight 或完整验证，不宣称产品、T31 或项目通过。打包保持 HOLD。

## 阻碍与 Git 状态

- 执行令所称生产者索引
  `D:\Lawbeach\lawbench-coord\T31PiAiModuleShape-20261028-123044.md`
  不存在，`Get-Content` 退出码 1；只做了同名前缀的协调目录窄查，零命中。
- 初始只读 `git status` 因 `dsh` 子模块路径权限拒绝而失败；未修锁、未扩权、未运行任何 Git 写命令。
- 目标文件在 A 仓库中为未跟踪文件，限定 `git diff` 为空；精确整文件逆向哈希是本次差异证据。

## 下一步

root 审计精确差异及备注中全部实际命令后，使用已保存的 Key 重新执行一次无模型 preflight；只有 preflight 通过后，才运行完整预定验证。

