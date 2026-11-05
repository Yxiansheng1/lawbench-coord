# C 线交回：T32 真实合成启动器格式修正

交回时间：2026-10-27 23:38:10（Asia/Taipei）

状态：**AUTHORED_NOT_RUN / READY_FOR_ROOT_INDEPENDENT_REVIEW**

## 完成内容

已按正式执行令只修改指定的 `launch.ps1`，在四个精确 AST 位置为完整格式化表达式各
增加一层括号，使 PowerShell 将整个 `-f` 表达式作为 `WriteLine` 的单一实参。没有
新增其他逻辑、错误处理、格式化框架或秘密日志。

## 文件与证据

- 修改文件：
  `D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\launch.ps1`
- 修改前：18,381 字节；SHA-256
  `2E61BC17534DF1218244CBCC06032368B09ED209AD0E38786FE6308C7AB446D2`
- 修改后：18,389 字节；SHA-256
  `A9C4521CA3AED9B5C27E72D41130C296A148AEE8C821472EE5BD8E9803E7764E`
- 正式修正说明：
  `D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\root-format-correction-20261027-233810.md`

只读内存逆操作已从修改后文件精确移除四处新增的 8 个括号字节，恢复到 18,381 字节，
SHA-256 精确回到修改前值。该操作不解析或执行目标脚本，并支持目标文件没有其他字节
变化。精确位置、未执行项、完整命令形状、非零退出设计和运行限制见修正说明。

## 特别验证边界

遵照指令，作者未运行任何 parser、静态解析、目标脚本、格式表达式、合成验证、自测、
consumer、Python、Node、HTTP、网络、Key、GUI、模型或真实运行。没有读取或写入 Key，
没有访问真实案卷，没有修改 B 线、其他产品源码或运行器。

Root 仍需独立反推四处字节并核验整文件，再做 parser 和纯合成格式调用验证。全部通过
后必须新开可见用户窗口；原运行不可复用，旧父进程已不存在，用户必须重新输入 Key。
旧 Key 清理只能记录为父进程已尽力执行，不作取证级零残留声明。

## Git 与阻碍

Git 全程只读。普通 `git status` 因受管环境无法进入 `dsh` 子模块而返回权限错误；忽略
子模块的只读状态检查显示现场原有 dirty/untracked 内容，均已保全。未执行 add、commit、
rebase、stash、reset、clean、checkout 或 push，未尝试修锁、扩权、改 ACL 或安全设置。
该权限拒绝不需要 C 线修复，也不构成本次交付阻碍。

本次交回通过协调目录文件完成，不是 Git 提交。C 线到此停止，等待 Root 独立复核。
