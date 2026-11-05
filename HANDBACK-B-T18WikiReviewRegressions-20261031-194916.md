# HANDBACK — T18 Wiki 更新与证据预算回归测试

状态：`SOURCE_ONLY_NOT_RUN`。请 Root 用当前旧产品快照 `054441` 与当前 B 源码先跑目标测试，保留原始红灯；本作者未自测。

工单：T18 Wiki Review Regressions

测试文件：`D:\Lawbeach\lawbench-B\service\tests\test_t18_wiki_date_source_retention_20261031-173317.py`

证据 README：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\WikiReviewRegressions-20261031-194916\README.md`

测试文件身份：14953 bytes，SHA-256 `7c2e738367390d3b71fa4da49797ec14f6d77161278e97c0fa169c36211402ff`。原 6189 bytes 区段仍为 `aa6d12d725a74d2566f1bb53dd3f499d9f22da9022239928e3c50a9dd225bf6d`。

产品源码：`service/lawbench/pipeline/steps/wiki.py` 未改，35555 bytes，SHA-256 `054441464e1fb78fab955ffb51613bfbdcfde2e481df6da13b6db533448f7abb`。

验证边界：未执行测试、pytest、import、Python、解析器、AST、构建、应用、GUI、HTTP、模型或凭据读取；没有任何 PASS、红灯或 Native/OS gate 运行证据。

对令的读数差异：令写“原始 8 cases”，既有基线实际是 5 个测试函数、参数化后 7 个用例。原区段逐字节未动，请 Root 判读口径。

已知阻碍：Git 递归状态被只读子模块 `dsh` 权限拒绝；随后用忽略子模块的只读状态核对。一次只读命令误填 `bash`，被环境拒绝且未执行。未修锁、改权限、拆 writer 锁或请求扩权。

Git：严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout、push。

删减轮: 读者 1 / 槽位 1 / 半句 0 / 重复 1 / 过程 1 / 黑名单 0

Response ID: chat reply

Response log path: chat reply
