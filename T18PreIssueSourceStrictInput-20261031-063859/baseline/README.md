# T18 出稿前原文回读（只跑 GET /api/source）

状态：**源码未运行（source NOT RUN）**。本目录只有交付物，没有运行结果。
这不是整张 T18 的通过，也不代表全量回归通过；全量与封版要等主编排发信号。

## 这份东西做什么

原始那一次出稿前审查的业务结果是 FAILED，出处回读这一步**从未真正跑到**。
这份检查器补的就是这一步：拿原始真实合成案件的字节副本，对**原始服务代码**
发 13 次真实的 `GET /api/source` 请求，核对返回的原文单元与批准预期逐字一致，
并确认整个过程没有改动任何案件字节。

原始业务结论（FAILED）**保持原样**，这里不复判、不翻案、不代表法律判断正确。

## 怎么用（主编排执行，一条命令）

```powershell
cd D:\Lawbeach\lawbench-B
$env:PYTHONDONTWRITEBYTECODE = "1"
python docs\plan\evidence\T18\PreIssueSourceReadback-20261031-063015\check.py <全新输出目录>
```

- `<全新输出目录>` 必须是一个**主编排自己新建的空目录**：检查器在里面建
  `case\`（20 个文件的字节副本）和 `appdata\`（私有登记与日志）。
  里面已经有 `case\` 时检查器直接报错退出（防串到旧现场）。
- 用项目自己的 Python 环境（要能 `import httpx`、`starlette`、`jsonschema`）。
- 退出码 0 = 本阶段通过，1 = 不通过。stdout 只有元数据（计数、状态、材料编号、
  位置、文本的 SHA256），没有案卷正文、没有材料名、没有日志内容。
- stdout 里固定有 `source_only=false` 与 `whole_T18_pass=false`：即使 `passed=true`，
  也只是这一步过，不代表整张 T18 过。

## 守住的边界

- 不建默认 app、不跑 lifespan、不起服务、不开任何 TCP；请求走
  `httpx.ASGITransport`，全程在内存里。
- 不取 Key、不碰凭据、不连 6000D/395、不发任何模型请求。
- 导入产品代码之前先装守卫：`socket` 的 connect/connect_ex/bind/listen、
  `socket.create_connection`、`subprocess` 的 Popen/run/call/check_*、
  `os.system`/`os.posix_spawn`/`os.startfile`/`os.exec*` 一律拒绝。被拒即失败，
  stdout 只记尝试种类（如 `socket.connect`），不记参数。
- 守卫在产品代码导入之前装，所以产品模块里 `from subprocess import Popen`
  这类写法拿到的也是被拦的版本。
- Windows 上事件循环的内部自管道要建本地 socketpair，所以事件循环与它的工作线程
  在守卫装上**之前**备好；守卫只拦网络与子进程，不拦这个本地自管道。
- 只用原始产品代码：服务包路径、契约目录、`CaseRegistry`、`Materials`、
  `lawbench.api.ui.routes()` 里那一条 `/api/source` 的 GET 路由，
  单独挂进一个没有 lifespan 的 `Starlette`。不替换产品函数、不伪造业务接口、
  不加默认 app 的鉴权与异常处理。
- 案件只做字节复制：照批准清单复制 20 个文件，逐个核对字节数与 SHA256，
  拒绝链接与联接；案件登记只把 root 重绑到新副本，其余照抄。
- 不 `case.open`、不扫描、不新造编号、不建会话、不写历史、不写消息、不造答案、
  不做种子数据；不复制旧日志与会话。
- GET 前后各做一次快照（副本、原始来源、案件登记的 SHA256/大小/mtime），
  三者必须一字不差；副本目录里多出一个文件也算不通过。

## 判通过的条件

13 条请求全部：HTTP 200、`ok=true`、`name`/`loc`/`text` 与批准预期逐字一致、
`page_png_base64` 为 null、`source_changed=false`、`original_status=ok`；
副本 index.json 里的材料版本与原件 SHA 都等于批准版本；
守卫一次都没被触发；副本、原始来源、案件登记前后没变；
客户端、传输层、日志都关掉，守卫已还原。

## 通过也不代表什么

`passed=true` 只说明这 13 条出处回读在原始代码上逐字对得上、且没有副作用。
它不代表原始那次业务跑通，不代表出稿前审查通过，不代表法律判断正确，
更不代表 T18 整卡通过。全量回归、盲测、规范走查按五门范式另行安排。

## 文件

- `check.py` —— 检查器本体（未运行）。
- `literal-inputs.json` —— 批准输入的逐字节副本（与
  `D:\Lawbeach\lawbench-coord\T18PreIssueSourceReadbackInput-20261031-063015\approved.json`
  字节相同，SHA256 `18264c91be93f1cf7f359442683f6b437df4d7bee0d52cbbf1773aecacc05bde`）。
- `README.md` —— 本文件。

运行时产物（副本、登记、日志）落在主编排指定的输出目录里，不在本目录。
