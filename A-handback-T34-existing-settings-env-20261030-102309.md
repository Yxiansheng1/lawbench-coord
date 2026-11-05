# A 线交回：T34 existing settings 私有环境隔离

状态：`SOURCE_ONLY_CONFIG_READY / AUTHOR_RUNTIME_ZERO / TARGET_NOT_RUN`

执行令：`D:\Lawbeach\lawbench-coord\A-T34-existing-settings-env-order-20261030-102309.md`

交付目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ExistingSettingsEnv-20261030-102309`

## 1. 结论

已在既有、已冻结的有限测试配置上完成唯一有界修改：在 `root` 后连续加入
`envDir: false` 和指向本次私有路径的 `cacheDir`。前者阻止 Vite 从真实项目 root
读取 `.env`/`.env.local`，后者把可能产生的缓存限制到本交付目录下尚未创建的
`runtime\cache`。没有改动产品源码、测试正文、fixture、SDK、setup、alias、build 或
默认配置。

本交付仍只是根侧一次三测试运行的源码级前置件，不是 native GUI、native settings
write、built/installed libraries 或整条 T34 的通过声明。既有 required-unset 实际失败、
`settings.mutate -> ConfigEditor.edit` 拒绝和具体根因 `UNKNOWN` 均保持原状。

## 2. 新增文件与哈希

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `vitest.finite.config.mjs` | 1050 | `e0d1cf5767100fb30cf50805d4d792489094892c21248ba957479d611df9bb89` |
| `literal-inputs.json` | 3638 | `031a688225a4876d113c40155b8b19f69e25a400ae3e636b397f5f2bdec8d439` |
| `README.md` | 1557 | `2c62a6e1acdaf46d346f1fcd1edf40c634214d16384eace32e3b9086247e3e94` |
| 本交回件 | 当前文件自身 | `SELF_NOT_REFERENCED` |

旧配置仍为 922 字节、
`e52134909ad4fb07d8103c41f0d922dc4d7d4abb8002ac2da2b8a632b91aa81a`。新配置逐字节等于
旧配置在 `root: dshRoot,` 后插入上述两行；反向删除恰好这两行后重新得到 922 字节和同一
旧 SHA-256。两行在文件中各只出现一次，未改其他字节或顺序。

`literal-inputs.json` 仅更新令指定的三个新路径，完整保留批准输入中的 10 个 pin、
唯一测试文件、root、3 个精确测试名、失败/封存指针，并加入批准清单原样的
`vite_primary` 与新的 `private_cache` 字面值。字段名和各嵌套值与批准清单逐项一致。

## 3. 静态核验

- 批准输入 14 项（10 个源码 pin、旧三件、Vite 主类型）在修改前后均与字节数和
  SHA-256 完全一致，漂移数为 0；Vite 主类型明确提供
  `envDir?: string | false` 与 `cacheDir?: string`。
- 新 JSON 的 12 个顶层字段、顺序内容、10 pins、3 个测试名、根、测试文件、失败/封存
  指针、Vite 行和私有缓存字面值全部通过静态对账。
- 三个证据文件均为无 BOM、无 CR；目录恰三文件，`runtime` 不存在。
- README 明确要求根执行器使用只含 `HOME`、`USERPROFILE`、`APPDATA`、
  `LOCALAPPDATA`、`TEMP`、`TMP`、`DSH_HOME` 的干净私有 allowlist，未提供继承当前
  Key 或敏感环境变量的 shell 命令；根侧负责 PID、可执行文件、UTC 记录、源码封存与
  清理证明。
- 当前相关 Git 状态只显示旧、新各三份未跟踪证据。既有 dirty 全部保留；本运行未对
  Git 暂存区或历史做任何写入。

## 4. 实际命令与非零

证据定稿前共执行 23 次 `exec_command`：20 次 exit 0，3 次 exit 1；另有一次
`apply_patch` 写入令允许的三份新文件。命令覆盖：正式令、批准清单、旧三件、旧交回件
与旧执行令读取；Git 定位和两次只读状态核验；旧源码/新文件哈希；Vite 类型契约定位；
证据目录和文件元数据；配置逐字节重建与反向恢复；JSON 字段对账；相关路径 Git 状态。

三次非零均为路径或权限核验，没有改写成源码结论：

1. 首次调用假定 Git 位于 `C:\Program Files\Git\cmd\git.exe`，该路径不存在，Git 未执行；
   随后以只读命令发现本机入口 `E:\Git\cmd\git.exe`。
2. 修改前读取尚不存在的目标证据目录，列出命令返回 1；随后确认该目录未创建。
3. 全树只读 `git status` 因共享 worktree 中 `dsh` 子模块 `.git` 权限拒绝返回 1；
   未修锁、ACL、审批或权限，改用 `--ignore-submodules=all` 的只读状态查询成功。该查询
   另有仓库既有超长路径的无障碍 warning，但确认工作树本来 dirty；未清理或覆盖。

## 5. 历史口径与禁区

旧阶段实际为 66 次命令、54 次成功、12 次非零；旧正式件记录的 60 次是当时阶段口径。
本条只保留该历史事实，不重算、不覆盖、不改写。

本运行 Node、Vitest、Python、AST/parser、import、type check、test、collect、build、
GUI、HTTP、模型、SSH、DPAPI、环境 Key 与 process probe 均为 `NOT_RUN`；runtime 为 0，
三测试退出码和结果均为 `NOT_RUN`。没有安装、连网、读取 `.env`、更换 API、联系其他
会话或启动第二 writer。

Git 的 add、commit、rebase、stash、reset、clean、checkout、push 均为 0；没有提交 SHA，
没有修改锁、沙箱、审批或 ACL。交付完成方式为本协调目录文件，不是 Git 提交。

## 6. 根侧唯一下一步

根管理员执行器应先用干净 allowlist 环境、私有 HOME/APPDATA/TEMP、私有
`runtime\cache`、完整源码封存及清理证明，执行 README 指向的同一份有限配置，且只运行
批准清单中的 3 个精确测试一次。若配置解析、setup import 或测试失败，保留真实输出后
停止；不得放宽断言、安装包、构建 SDK、替换 alias 或切换到其他执行路径。
