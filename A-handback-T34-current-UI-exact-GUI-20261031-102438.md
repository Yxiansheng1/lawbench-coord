# A 线 T34 当前 UI 精确 GUI 交付回执

状态：`SOURCE_NOT_RUN`。已按正式执行令完成 11 个字面输入文件的有界复制/字面替换和元数据记账；未运行 prepare、admit、start、GUI 或 stop。

## 边界

- 产品代码、SDK、全局配置、凭据/SystemStore、模型、HTTP/GUI/进程探测变更：0。
- Git：未执行任何读写命令；未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 旧失败来源保留未动；未复用旧 served root。
- `README.md`、五个 helper 文件按基线逐字节复制；`prepare.ps1`、`stop.ps1`、`entry.py` 仅替换基线名称；`start.ps1` 仅执行批准的字面替换。

## 命令与非零计数

- 记录 `exec_command` 调用：3；成功：3；非零：0；执行前被拒的 bash 尝试：0。
- 命令 1：只读正式执行令。
- 命令 2：只读并解析 `approved-inputs.json` 与 `root-approved-manifest-blueprint.json`。
- 命令 3：文件复制、批准的字面替换、`literal-inputs.json` 与正式回执写入。
- 目标运行时脚本/Node/Python 调用、解析器/AST/导入/检查/测试/构建、GUI/HTTP/模型/进程探测、Git 读取、凭据读取：均为 0。

## 实际哈希

| name | bytes | sha256 |
|---|---:|---|
| README.md | 3665 | $(@{name=README.md; bytes=3665; sha256=964d6a30c28c58cfad666bf3aed6eb1d20443675c46d48bfbad684b44a3263c3}.sha256) |
| entry.py | 88651 | $(@{name=entry.py; bytes=88651; sha256=5cc5412f1901023ac62345b91e974cc953a2ca619e46efefdb3282312e46c830}.sha256) |
| literal-inputs.json | null | $(@{name=literal-inputs.json; bytes=; sha256=SELF_NOT_REFERENCED}.sha256) |
| observer-finite.mjs | 6845 | $(@{name=observer-finite.mjs; bytes=6845; sha256=80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb}.sha256) |
| prepare.ps1 | 13560 | $(@{name=prepare.ps1; bytes=13560; sha256=fb67771b2e01b1461b1544b0db22f01c0a264fd3e4c0159398fe64bb9616ef60}.sha256) |
| private-provider-binding.mjs | 2499 | $(@{name=private-provider-binding.mjs; bytes=2499; sha256=376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e}.sha256) |
| projection-observer.mjs | 20058 | $(@{name=projection-observer.mjs; bytes=20058; sha256=2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac}.sha256) |
| settings-read-observer.mjs | 11513 | $(@{name=settings-read-observer.mjs; bytes=11513; sha256=4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107}.sha256) |
| signature-finite.mjs | 5381 | $(@{name=signature-finite.mjs; bytes=5381; sha256=d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed}.sha256) |
| start.ps1 | 95721 | $(@{name=start.ps1; bytes=95721; sha256=8e750a0decefa6e4755eea2c116c1a74f5b301f86c602295985effde4b1e8d8a}.sha256) |
| stop.ps1 | 7177 | $(@{name=stop.ps1; bytes=7177; sha256=a614b88ad43477379ed8e6b4e22c7023165b16617571d0b024c072385f79d9a5}.sha256) |

## 未运行

- prepare
- admit
- start
- GUI
- stop

实际证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CurrentUIExactGUI-20261031-102438`

结果：`HANDOFF_READY_SOURCE_NOT_RUN`
