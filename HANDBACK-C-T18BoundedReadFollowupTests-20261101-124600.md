# HANDBACK — C / T18 Bounded Read Follow-up Tests

状态：`AUTHORED_NOT_RUN`

运行时执行数：`runtime0`

## 交付

- 目标测试：
  `D:\Lawbeach\lawbench-C\docs\plan\evidence\T18\T18BoundedReadFollowupTests-20261101-124600\test_bound_followup.py`
- 字节大小：`8090`
- SHA-256：`8A67DEADD9B448709E976F6FDEEDF4F0308422CA38B538B92AC662D6C6CF394B`

目标文件是本次唯一新增的 C 树测试文件；未修改产品源码、旧测试或旧断言。未触碰 B 树。

## 覆盖范围

共 4 个 pytest 用例：

1. 参数化直接 `read_material(start=-1, end=1)`，要求抛出 `ApiError`，错误码为 `INVALID_ARGUMENT`，且 `reads.json` 与 coverage 不变。
2. 参数化直接 `read_material(start=0, end=1)`，要求同上。
3. 超长首单元分块续读正控：首段及每次续读均只停留单元 1；完成后记录实际区间 `1..1`、`has_more=true`、`next_start=2`、`next_offset=null`、coverage 为 1/3；随后 `start=2,end=2` 只读单元 2，coverage 为 2/3。
4. 三行整单元边界正控：`start=1,end=2,max_chars=500` 只返回单元 1，`next_start=2`、无 offset；随后 `start=2,end=2` 不渲染单元 3，并按实际读取记录区间 `1..1`、`2..2`，coverage 为 2/3。

两个正控均各自创建真实 `Env`，在 `finally` 中关闭。直接调用使用由真实 `lb.tasks`、`lb.materials`、`task.json` 构造的 `ToolContext`，未使用 monkeypatch。测试材料名使用无扩展名 stem；读取、解析、渲染与记账均使用未打补丁的真实产品路径。

## 执行与边界

- 未运行 Python、pytest、collect、Node、解析器、check、test、build、prepare、模型、HTTP、GUI 或运行时。
- 未运行 Git，未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 未进行旧开工、安装、调研、全量测试或目录发现。
- 当前产品预期为 RED2：`start=-1` 与 `start=0` 两个非法起点用例应失败；两个正控所依赖的响应字段须在 schema 1.7 后验证。

## 后续

请 root 先审目标文件。B 执行者完成写者锁内的落盘后，按上述字节数与 SHA-256 将目标文件字节级原样复制；本执行者到此停止。
