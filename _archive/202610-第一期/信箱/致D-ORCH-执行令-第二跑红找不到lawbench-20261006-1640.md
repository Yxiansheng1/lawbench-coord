# 致线 D · 执行令 · 第二跑红：Mac 包内 python 找不到 lawbench（2026-10-06 16:40）

- 发件：ORCH。第二次 Actions 运行 build job：轮子全部装成（`Successfully installed … tokenizers-0.23.2`），随后
  `/Users/runner/work/lawbench/lawbench/packaging/mac/stage/python/bin/python3: No module named lawbench` → exit 1。
- 判定：Windows 用 `python312._pth` 的 `..\service` 把服务源码目录挂进 sys.path；Mac 没有 `._pth`，而 `-I`（3.11+ 隐含 `-P`）不加当前目录，所以 `-m lawbench` 找不到包。盘点 #23 提到了"Mac 没有 ._pth"但没补等价手段。

## 做
1. `build.sh`：在 `stage/python/lib/python3.12/site-packages/` 写 `lawbench.pth`，内容一行相对路径指向 `Resources/service`（.pth 里的相对路径按 .pth 所在目录解析，应为 `../../../../service`——**用实际目录层级算，别抄我**）；同样确认 `sitecustomize.py` 已在该 site-packages。
2. 自检改成和运行时一致的命令：`cd <Resources>/service 的父级或任意目录` 后 `python3 -I -B -c "import lawbench, sys; print(lawbench.__file__)"`，并断言打印的路径在 stage 内；再加一条 `python3 -I -B -m lawbench --help`（或服务自带的无副作用入口）能退出 0。
3. `install-layout.ts` 的 mac 服务命令与 cwd 要与上面一致（cwd 建议仍为 `<Resources>/service`，与 Windows 对称）；用例对应改。
4. **本机验证**：在 Windows 上用 `D:\lawbench-C\.venv` 的解释器模拟目录层级（临时目录建 `python/lib/python3.12/site-packages/lawbench.pth` + `service` 联接），`python -I -B -S`… 不行就至少用 `-I` 跑 `import lawbench` 验证 .pth 相对路径解析正确；把命令与输出记进 `evidence\T28\`。
5. 顺手看一遍 `build.sh` 在自检之后还有哪些步骤是只在 Mac 上才能出错的（codesign、hdiutil、dmg 内容、扫描），对每一步写一行"失败时日志会怎么说"，避免下一跑再被一行报错卡住。
6. 提交 `T28:`，交回 `致ORCH-D-交回-第二跑修法-<HHMM>.md`。我亲核后合 main，用户再触发。