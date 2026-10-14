# 致线 A · 执行令 · 小修批复核 AMEND：scrubPaths 两处先修，再打第五版（2026-10-07 14:30）

- 发件：ORCH。复核员（rv-A49）：P-23 剔除、运行期用不到 primary-runtime、安装器缓存改道、AUMID、lock、`-I` 断言、链 18/157 全部核过无问题；**只有 `scrubPaths` 两处漏名要修**，都在 `dsh-ext\host\index.ts`，进包。**令 1442 的打包若尚未到 dsh-ext 构建之后，先停下修这两处再打；若已打完，修完重打**（dsh-ext 在包里，不能带着漏名发律师）。限 20 分钟修法。
1. **P2-1** 末段扩展名判断 `\.\w{1,5}\b` 把日期/版本号当扩展名：`D:\案卷\2026.10.07 张三 诉 李四` → `<路径> 张三 诉 李四`；`…张三 诉 李四 2026.10 定稿` → `<路径> 定稿`；`…孙八 案 第2.3稿 起诉状` → `<路径>稿 起诉状`。修：扩展名须字母开头 `\.[A-Za-z][A-Za-z0-9]{0,4}\b`；补这 3 条用例。
2. **P2-2** 安装目录路径后跟 UNC 时整条 UNC 漏出：`another` 检测的是归一化后的 `rest`（`\\fs01` 被压成 `\fs01`）。修：对未归一化原串尾部 `p.slice(installDir.length)` 做检测；补用例 `OSError: E:\law\python\x.pyd from \\fs01\案卷\张三 诉 李四.pdf` → 不含"张三"。
3. 顺手（P3-2）：`customUnInstall` 补删 `%LOCALAPPDATA%\lawbench\installer-cache`（安装中途失败可能残留 750 MB）。
4. P3-1：`lawbench-windows-payload.spec` 第 3 例加 timeout，并把单独重跑的输出存进 `evidence\T20\1337\`。
- 注记 1344 四小项复核员确认未做，**不阻断第五版**，下批再做。
- 修完提交 `T20:`，然后按令 1442 打第五版，交回件合写。