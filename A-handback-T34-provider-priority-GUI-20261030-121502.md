# A 线交回：T34 provider priority GUI

状态：`SOURCE_ONLY_NOT_RUN / ROOT_FRESH_GUI_REQUIRED`。

## 交付

目标目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPriorityGUI-20261030-121502`

- `prepare.ps1`：13,562 B，SHA-256 `00adf710ff8692087194d2327841ee52c53728d93bc782a3ad3c8095c934ed64`
- `start.ps1`：83,572 B，SHA-256 `5b2833eb484ecd74e03b62ff8238fb3ed09776a2d8fbd701c6721a8036c57f77`
- `stop.ps1`：7,179 B，SHA-256 `ab9d88735d2522a5e01db79b698f178a51d4709a1ae7f5c44893100c7b62a07e`
- `entry.py`：88,653 B，SHA-256 `940d060a29504893d8e3e82d15898476276a0b11efa9550751a3ca0b3d95dbd0`
- `projection-observer.mjs`：20,058 B，SHA-256 `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`，与旧件逐字节相同
- `private-provider-binding.mjs`：2,501 B，SHA-256 `12b3b1c0f69f6bf98d5e6ff1bfb4c9eafff864ce87fd6e2213120d589224bf7d`
- `literal-inputs.json`：24,455 B，SHA-256 `7162342a69ad6a6cab2bb2a9390a60f0eec12e89f0729a31306dab89c7007443`；自身为 `SELF_NOT_REFERENCED`
- `README.md`：2,026 B，SHA-256 `7482ec2a5b68a33a41bec4c104a9c524f9a8fd84f6c241bce0e98cbf971aa29e`

目录内恰好八个文件。定向只读 `git status --short --untracked-files=all --ignore-submodules=all -- <目标目录>` 显示八件均为未跟踪新文件。

## 有界修改

`prepare.ps1`、`stop.ps1`、`entry.py` 相对旧基线各只替换自己的证据根；文本差异检查确认无其他改动。`start.ps1` 只增加私有绑定与旧/新组件钉点、启动前路径/字节/SHA 检查、固定 file URL 守卫，以及原 resolver 之后的第二个 `--import`；entry 钉点更新为实际 88,653 B / `940d060a…d95dbd0`。原 resolver 仍先加载，guard 仍随后 `--require`，profile patch、种子三块、source case、私有 25 项、legacy18 和 source pins 未改。

`private-provider-binding.mjs` 只使用 `node:module`、`node:fs`、`node:crypto`、`node:url`。注册前及每次精确命中时核验旧模块、私有组件、manifest 三者的固定规范路径、普通非链接文件属性、字节和 SHA；随后先调用 `nextResolve`，仅当结果 URL 精确等于旧 `llm-pi-ai` 编译模块 URL 时，保留结果其余字段并重定向到 81,412 B / `664859…a7c17` 私有组件。日志固定为最多八条元数据，不含 specifier、context、URL、凭据或原始错误。没有环境路径、任意 hash 接受、产品 import、网络、spawn、写或删除逻辑。

该模块钩子只可能证明实际模块解析重定向；导入成功、插件挂载、原生投影、ordinary unset、GUI 和 T34 整体仍未证明。

## 复用与未运行

已通过且源码不变的旧正向两份、correction negative、既有私有组件构建及 source closure 证据按批准蓝图复用，本轮未重演旧开工、安装、调研或全量测试。作者侧 Node、Python、target runtime script、parser、AST、import、type、check、test、build、GUI、HTTP、模型、端口和进程探测均为 0；模型调用、真实 key、真实案卷、外连与额外 395 GPU 均为 0。Git 写入为 0，无提交 SHA。

`prepare`、admit、`start`、GUI、ordinary unset action、observer capture、`stop`、磁盘 patch/current provider 检查、owned OS closure、UI/no-source-change 检查、原生投影和打包全部 `NOT_RUN`。

## 阻碍与下一步

`literal-inputs.json` 固化时记录实际 exec 调用 42 次、非零 7 次；其中 3 次误设非 PowerShell shell 均在目标命令执行前被权限层拒绝。固化后仅作静态读取时又发生一次同类拒绝。另有三次 PowerShell 空管道写法错误和一次把协调目录路径混入 A 仓 Git 查询的路径错误，均未产生目标写入；没有发生 Git 锁修复、扩权、ACL 变更或 writer 锁拆分。

根侧应先全文静态复核本目录、全部命令/写入、start 的逆操作、whole manifest 和新钩子；再在一个全新 run root 上仅执行一次 prepare/admit/start，以精确 owned 私有窗口和实际 native GUI 事件检查新钩子元数据、OS 端口、窗口与源码闭合。失败时保留失败，不做等价重跑。
