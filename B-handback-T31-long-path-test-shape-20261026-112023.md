# B 线交回：T31 长路径测试形状补正

执行令：`T31-long-path-test-shape-order-20261026-112023.md`

## 状态

`EDITED / NOT_RUN / PACKAGING_HOLD`

允许范围内的两个文件已修改。作者侧仅做了文本 diff 复核，没有运行 checker；
等待 root 累计复核后执行一次最终 checker run。当前不得宣称 checker、GUI、完整
T31 或打包通过。

## 精确改动

- `check_long_path.py` 新增恰好两个断言：
  - 从短祖先 `temporary / "case-negative"` 扫描已创建的
    `case-negative` 长文件夹具，要求同大小不同 SHA-256 返回 `False`；
  - 从短祖先 `temporary / "case-positive"` 扫描已创建的
    `case-positive` 长文件夹具，要求同大小同 SHA-256 返回 `True`。
- 两个新增断言都显式要求扫描根长度 `< 248`；原有叶文件长度 `> 260` 的断言、
  原有两个深根调用及全部其他用例、helper、严格清理和 no-network 边界均保留。
- `README.md` 只追加了对应的短祖先到长叶节点覆盖说明。

## 文件 SHA-256

| 文件 | 修改前 | 修改后 |
| --- | --- | --- |
| `docs\plan\evidence\T31\BatchLongPathCheck-20261026-110943\check_long_path.py` | `906EA8C65FBE4BF823585E2A855DD0D52E2FFF942956F9F1C952EB273C53963D` | `ADAD63ABD7E2F040F3820578E212013356D22A1A3142E25AD733B86277AADA03` |
| `docs\plan\evidence\T31\BatchLongPathCheck-20261026-110943\README.md` | `C0AD5A65ECF2691979B8064AE9F51E47A788B955ADE6DBE9EA34FA6CEA8E755E` | `017E7F1D9921F7B2585266A71AAE105C0DE78B734DBF8789757DD639D22F4596` |

冻结的被测源未改动：

`docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`

`10C3A8FB366D340624ACCDB8313742A3219230DDA98DF0A902C955D0CAEF8EE4`

## 验证与边界

- `NOT_RUN`：按执行令作者禁区，未执行 Python、AST、解析器、编译、测试、自检、
  pytest、collect、prepare、serve、probe、build、GUI、HTTP、模型或网络操作。
- 修改前快照与当前文件的只读 diff 显示：脚本只有上述两个新增断言，README 只有
  上述追加段；原有深根调用和其余用例未改。
- 未修改产品源码、冻结 server、schema、probe、入口 README、启动器或构建文件；
  未新增 framework、mock、skip 或弱化断言。
- Git 全程只读；未使用 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`，既有 dirty 状态已保留。
