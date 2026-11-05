# A 线交回：T34 样例生成源最小对齐

- 执行者：独立 A 线 DeepSeek（`deepseek-v4.1-flash-1017` / effort max）
- 任务令：`ORCH-ToA-T34ExampleGenerator-20261025-160738.md`
- 状态：有界编辑完成；按令处于验证 HOLD，capture 未运行

## 交付 SHA256

| 文件 | SHA256 |
|---|---|
| 修改前 `contracts\_build\gen_examples.py` | `189de53c34a53eb8ae3bf690b5552b4666b35e4ad93754a51327e368954920a2` |
| 修改后 `contracts\_build\gen_examples.py` | `6e7d786c983386f846326db019d4515693bf413d0db0bed4775f73688d648fde` |
| B 参考 `B-reference.py` | `e935565d19a1192491cc7ddea804183a0f17bc8a2e07e646cb3072def11c7672` |
| 新 `docs\plan\evidence\T34\ExampleGenerator-20261025-160738\capture.py` | `c23599f3f07d69a63ded57df5b6d0e25c9a4a1a42b70e3e608c04c622707bb63` |

开工前核对：当前生成源 SHA 等于事实件 `expected_source_before`，B 参考 SHA 等于事实件
`B_reference_sha`。`capture.py` 内固定的生成源 SHA 为当前值
`6e7d786c983386f846326db019d4515693bf413d0db0bed4775f73688d648fde`。

## `gen_examples.py` before/current 差异全集

1. 在未改动的原 `ex` 函数后新增 B 原 `ex_one_space`，只按 `indent=1` 写入并追加 manifest。
2. `core_task_begin.res.json` 的 `value` 在 `budget` 后增加 `"route":"external"`。
3. `file_task.json` 在 `skill` 后增加 `"route":"external"`。
4. `api_task_current.res.json` 的 `selection` 在 `params` 后增加 `"route":"external"`。
5. 在 `api_documents_save.fail.json` 之后、`file_settings.ports.json` 之前，按 B 语义追加：
   - `api_remote_access.req_enabled.json`：`{"enabled":true}`
   - `api_remote_access.req_code_null.json`：`{"code":null}`
   - `api_remote_access.req_code_spaces.json`：`{"code":" 测试用单行值 "}`
   - `api_remote_access.res_failed.json`：`enabled=true`、`has_code=true`、`state="failed"`、`reason="PROCESS_EXITED"`

   四个均使用新增的 `ex_one_space`，保持 `indent=1` 原字节排版。
6. 在 `file_settings.ports.json` 之后、最终 manifest 写出之前，按当前 A manifest 末尾顺序追加：
   - `file_task.legacy.json`：B 原 legacy 任务对象，100 条 manifest 尾部附近原有样例不变。
   - `api_task_create.req.json`：B 原请求对象，含 `"route":"external"`。
   - `api_task_create.req_legacy.json`：B 原无 route 的兼容请求。
   - `file_settings.external.json`：B 原外部模型设置对象。

除上述定义和三个 route 字段外，EX/init 清空、常量、原 `ex`、其余样例、expect、schema、
pointer、manifest 写出流程及 `print` 均未改写。没有照抄整个 B 生成器，没有新增 main 或批量缩进。

## 只读核验

- 当前 `contracts\examples\`：105 个 JSON 文件 = 104 个样例 + 1 个 manifest。
- 开工前 105 件逐文件 SHA 与事实件 `current_corpus_sha256` 全部一致，无缺失、无额外文件。
- 两处代码修改完成后再次逐件 SHA 核验：105 件仍全部一致，`mismatch=[]`。
- 未新增、删除、改名或重写任何现有样例；既有 dirty 和既有 untracked 内容未触碰。
- `capture.py` 仅创建在指定新目录，没有创建临时生成目录或其它证据文件。

首次直接运行 `git status --short` 时，受管沙箱无法读取
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh`，返回子模块 permission denied。
该只读障碍未修复、未扩权；随后仅用
`git status --short --ignore-submodules=all` 和只读 `git diff --name-only` 清点工作树。
没有执行任何 Git 写操作，没有改 index、lock、ACL 或权限。

## `capture.py` 边界

- 固定生成源、EX、facts 的绝对路径及修改后生成源 SHA。
- 在 patch 前按事实 pins 检查 EX 恰为 105 件且逐件 SHA 一致，并只在内存收集当前对象和原始 bytes。
- 仅在一个 `unittest.mock` 受控上下文中临时替换 `pathlib.Path.mkdir/glob/unlink/write_text`：
  `mkdir` 只放行精确 EX 且 no-op；`glob` 只放行精确 EX 的 `*.json` 并返回空；
  `unlink` 一概拒绝；`write_text` 只接受 EX 直接子 JSON、禁止重复、上限 105 件并仅收集字符串。
- `runpy.run_path(SOURCE_PATH, run_name="T34_memory_capture")` 只在上面的抑制上下文内运行；
  生成器的 `print` 被转入内存，不混入正式 JSON 报告。
- 退出上下文后检查四个 `Path` 方法已恢复，再检查生成对象、manifest 104 条顺序/expect、
  原始 105 件 SHA 和生成源 SHA。成功输出字段为
  `generated`、`manifest`、`semantic_diffs`、`manifest_equal`、`actual_files_unchanged`、
  `blocked_real_writes`；缩进/换行原始 byte 预测差异单列在 `byte_prediction_diffs`，
  不让格式差异改变语义判定。
- 未 patch `open`、`os`、`subprocess`、权限或 guard，没有网络、服务、Key、产品导入或第三方包。

## 未执行事项与下一步

按本令，作者没有运行 `capture.py`、parser、test、Vitest、tsc、pytest、collect、build、
prepare、serve、GUI 或请求，也没有运行原始 generator，因此本条不宣称语义全等验证通过。

只允许 root 先完整审阅 `capture.py`，确认固定 SHA、四个方法拦截、内存对象比较和前后 hash
检查均无绕过后再执行；任何情况下都不要直接运行原始 `gen_examples.py`，因为其顶层代码会清空并重写 EX。

没有 Git add/commit/rebase/stash/reset/clean/checkout/push；交回以本文件落盘为准。
Packaging HOLD：未执行 package、install、merge、push、deploy，未产生费用。
