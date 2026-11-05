# C线 T18 Current17 Root Binding 封闭复核交回

结论：**QUALIFIED SUPPORT（仅限夹具路径常量重绑）**。

证据：执行令指定的 frozen_pin_paths 共 18 项，未包含两份测试目标；两份测试目标完整路径与胶囊一致。只读前 45 行确认，T34 的 `PREP_DIR`/`RUNS_DIR` 与 T32 的 `RUNS_DIR` 都是指向旧准备目录的字面夹具常量；`requiredRoot` 仍分别执行 runs 内相对路径或直接子目录检查。胶囊中的 current17 目标是新的同类型 preparer 输出，路径映射仅涉及契约版本 1.6→1.7。

判定：将上述夹具常量精确改指 current17 私有准备目录，属于测试夹具数据更新，不是 frozen origin 改写，也不是 guard bypass。不得改 `requiredRoot`、`requiredPort`、protection、HTTP 断言函数或任何验证逻辑；不得扩展允许根、增加 fallback/env 放行、接受 symlink 或改线路由。运行前须完成 Root 相关区域的全字节逆变换核对：除精确路径常量外，验证函数与保护逻辑必须与胶囊哈希所代表的原文逐字节相同；接受根必须严格为新 preparer 自己创建的全新 synthetic root，且不得豁免保护。满足这些条件后仅可进行有界运行验证；本次未运行模型、运行时、HTTP、测试、parser、Node、Python 或 GUI。

运行证据：0；运行阻碍：无，本令明确禁止运行。未探测任何 O 路径或目录，未执行 Git，未改产品代码。
