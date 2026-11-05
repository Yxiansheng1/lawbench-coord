# B 线交回：T18 圆括号出处格式

状态：`SOURCE_READY_FOR_ROOT_REVIEW`

结论：按正式执行令完成了圆括号出处的有界源码修复和有限验证源码。本轮没有运行 Python、测试、导入检查、构建或模型；没有执行任何 Git 写入；没有改动冻结快照、旧运行产物、旧报告或工单集。

## 1. 接续事实与冻结基线

- 输入快照：`D:\Lawbeach\lawbench-coord\T18RoundCitationInput-20261029-103639\`
- 冻结 `parse.py`：SHA-256 `3FD25B61A965ABE5432B8D301448517DEA003D77739F45A0331BBBF07FA123BC`
- 冻结 `citations.py`：SHA-256 `6171F0DD8C564CB9FE092A1C3D222217ACAEDAB6BF500BAF04AFEAFECA19B412`
- 实际正文证据：该快照下 `actual-final-v3.md`，仅作测试证据，未当作模型输入。
- 既有 dirty 基线：`B-dirty-before.txt` 共 `5873` 行，`B-tracked-dirty-pins.json` 已存在；本轮未改写这两个文件。

只读 `git status` 尝试失败，准确阻碍为：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

按令未尝试改锁、扩权、ACL、审批或子模块权限；此阻碍不作为交付修复目标。

## 2. 写入面

| 路径 | 状态 |
|---|---|
| `service/lawbench/checks/parse.py` | 修改，唯一产品源码变更 |
| `service/lawbench/checks/citations.py` | 未修改，哈希仍为 `6171F0DD…B412` |
| `docs/plan/evidence/T18/RoundCitationFormat-20261029-103639/verify-round-citation-finite.py` | 新增有限验证源码 |
| `docs/plan/evidence/T18/RoundCitationFormat-20261029-103639/README.md` | 新增说明 |
| `D:\Lawbeach\lawbench-coord\B-handback-T18-round-citation-format-20261029-103639.md` | 本正式交回件 |

产品写入面为 `1` 个，不是 `2` 个：现有 `citations.py` 已会把 `Cite(ok=False)` 转成 `must_fix` E，不需要也不应重复改写；`citations.py` 保持字节不变。

## 3. 源码增量

- `parse.py` 相对冻结快照：`+63/-0`。
- 变更后大小：`14321` 字节。
- 变更后 SHA-256：`68456CD588A983E83362CB5C3799CB20AC505698B384FED4BAFA78F266A3C62F`。
- 有限验证脚本：`6986` 字节，SHA-256 `FE74FE89F49B24887B4774DE1ECBEF6630F253040539DB4162DD2FFFD4C49A67`。
- README：`2813` 字节，SHA-256 `DE05D998342F85D26461AF5018D309BE43EF5EF9CA1959AC0A280D4E2515C661`。

实现边界：

- 只扫描最外层 ASCII `()` 与全角 `（）` 匹配对，允许材料名内部再套同类或异类圆括号。
- 完整候选只把最外层换成六角括号，再交给现有 `citation_re()` 分类；不复制或放宽契约语法。
- “首项完整、次项仅位置”的组只用首个最外层顿号项证明出处形状；不补材料名，不生成 items。
- 所有圆括号命中均返回原正文子串和 `ok=False`，由现有检查器输出 `must_fix` E。
- 圆括号候选不进入结构化 citations，不改变正文，不改变合法〔〕的解析。
- 引语 span、Markdown 链接目标/标题、合法或已有〔〕范围均跳过；标题和代码围栏继续沿用 `check_text` 的原有跳过逻辑。
- 未新增材料别名、文件名分类器、语义判断、NLP、角色判断、golden facts 或通用框架。

## 4. 有限验证设计

脚本路径：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RoundCitationFormat-20261029-103639\verify-round-citation-finite.py
```

根复核通过后由根执行者运行：

```powershell
python .\docs\plan\evidence\T18\RoundCitationFormat-20261029-103639\verify-round-citation-finite.py
```

覆盖范围：

1. 用固定旧快照隔离装载旧 parse/citations，对实际正文复现旧版 `E=0`。
2. 对同一实际正文验证新版新增正好 `8` 个原样圆括号 E，结构化出处仍为 `16`，旧新版结构化出处与非 E 问题一致。
3. 实际正文覆盖嵌套材料名长组和“首项完整、次项仅位置”简写组。
4. ASCII、全角、嵌套材料名、同组多处完整项、多组并存。
5. 合法〔〕中的嵌套材料名圆括号与 `〔2024〕` 年份括注，保持结构化计数且零问题。
6. 引语原文、日期、年份、法院案号、图注、待补占位、Markdown 链接目标/标题、标题、代码围栏不报 E。
7. 既有【】出处继续报 E。

静态声明的非零预期，不是已观测结果：

| 项目 | 数量 |
|---|---:|
| 实际正文旧版 E | 0 |
| 实际正文新版 E | 8 |
| 实际正文结构化出处 | 16 |
| 边界场景数 | 7 |
| 边界场景预期 E | 5 |

## 5. 验证与运行状态

| 项目 | 状态/数量 |
|---|---|
| Python/Node/parser/import/check/test/build/HTTP/model/GUI/SSH/process probe | `0` |
| 产品运行命令 | `0` |
| API、Session、Agent、Key、真实案件调用 | `0` |
| Git 写入（add/commit/rebase/stash/reset/clean/checkout/push） | `0` |
| 有限验证源码 | 已写，`NOT_RUN` |
| pytest | `NOT_RUN` |
| 全模型运行 | `NOT_RUN` |
| 人工主检查 | `仍为 FAILED` |

没有把静态预期写成测试通过，也没有沿用旧测试为本次新源码背书。

## 6. 偏离、遗留与根复核点

- 无产品范围偏离；未修改契约、Spec、Skill、schema、runtime、配置或全局权限。
- `git status` 的 `dsh` 权限阻碍未修复；实际脏文件保全依赖既有 5873 行 dirty 基线与 pins。
- 根需按令审阅 `find_cites` 全函数和新增 helper，再在独立运行边界执行有限脚本。
- 根需确认新版对实际正文只增加 E，结构化 citations/count 不变，并决定是否接受新源码字面。
- 本轮未重新定义数字位置、未标注推断、未改写人工主检查的失败结论。
