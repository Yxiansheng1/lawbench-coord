# 致 ORCH · 线 C 交回 · OTSL 表格转 Markdown（令 1359）

- 提交 `17c677b`（一个 `T11:` 提交，基于 main `f5cc6bc`）。prep395 全量 **97 passed**。
- 没改 395，没打包。

## 做了什么
1. **`prep395\prep395\backends.py` 新增 `otsl_to_markdown`**，只对 xiaomi 模板的识别结果做，default 模板不动：
   - 连续的 `<fcel>…<nl>` 行转成 Markdown 表格，首行当表头，第二行是分隔线；
   - `<ecel>` 和合并占位 `<lcel>`、`<ucel>`、`<xcel>` 留空；
   - 单元格里的 `|` 转义成 `\|`；
   - 各行列数不齐时按最长的补空；
   - 表格前后各留一个空行；
   - 没有 OTSL 标记的文本原样返回。
2. **用例 3 条**（`tests\test_backends.py`）：
   - 10-10 探针页在 395 上的真实输出，原样经后端转成表格，其中含 `<ecel>`；
   - 无表格文本不变，default 模板下含 `<fcel>` 的文本不转；
   - 合并占位、`|` 转义、列数不齐。
3. **红绿**追加在 `evidence\T11\mutations-xiaomi.txt`：xiaomi 模板不转、default 模板也转，两处改坏都红。
4. **页眉页脚丢失记为已知限制**：
   - `模型候选.md` 第七节"三件事"第 1 条已改；第 2 条同步改成"已转 Markdown"；
   - `prep395\README.md` 新增"识别模型的已知限制"一节。
5. **操作单末尾加了"更新源码（不换模型）"一节。**

## 与执行令不同的一处（请知悉）
令里写的是"scp 覆盖源码 → `prep395.exe restart` 即可"。**这样不会生效。** 服务跑的是 `install.ps1` 用 `pip install` 装进 `C:\prep395\python` 的那一份，不是源码目录。所以操作单写成三步：
1. 覆盖源码；
2. `C:\prep395\python\python.exe -m pip install --no-warn-script-location --upgrade C:\prep395\src\prep395`，写法和 `install.ps1` 里相同；
3. `C:\prep395\services\prep395.exe restart`。

验证时查的是 `site-packages\prep395\backends.py`，看里面有没有 `otsl_to_markdown`，再加 `/health` ok。

`prep395.exe restart` 这个子命令**没在 395 上验证过**：`install.ps1` 里只用过 stop、uninstall、install。操作单写了报错时改用 `Restart-Service prep395`。

## 要用户做的
在 395 上按操作单"更新源码（不换模型）"一节做一遍，约 3 分钟。做完识别结果里的表格就是 Markdown 表格。要复核的话告诉我，我从开发机再发一次那张探针页。
