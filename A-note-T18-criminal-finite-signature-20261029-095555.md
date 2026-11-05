# A 线 T18 criminal finite signature 修正记录

状态：`DONE_STATIC_AUTHOR_ONLY / FINITE_NOT_RUN`

执行依据：`D:\Lawbeach\lawbench-coord\A-T18-criminal-finite-signature-order-20261029-095555.md`

执行边界：本运行器只做指定源码修正、静态只读核验和协调目录交回。未运行有限验证脚本，不主张任何运行时通过。

## 唯一源码变更

文件：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\verify-criminal-template-finite.py`

修改前：

```python
    old_after_open = expect_runtime_error(
        old_module,
        run_root,
        allow_criminal_template=False,
        expected_message=OLD_EXTRA_ERROR,
    )
```

修改后：

```python
    try:
        old_module.verify_private_case(run_root)
    except RuntimeError as error:
        if str(error) != OLD_EXTRA_ERROR:
            raise AssertionError(
                f"unexpected old verifier message: expected {OLD_EXTRA_ERROR!r}, got {str(error)!r}"
            ) from error
        old_after_open = str(error)
    else:
        raise AssertionError("old verifier unexpectedly accepted the extra case after open")
```

修正原因：旧快照的 `verify_private_case` 只有一个位置参数。旧调用无条件传入 `allow_criminal_template` 关键字，会在产生预期 `RuntimeError` 前抛出 `TypeError`。新块直接调用旧验证器并只接受消息精确等于 `OLD_EXTRA_ERROR` 的 `RuntimeError`。

未加入 `TypeError` 捕获、签名内省、回退路径、辅助框架或源码改写。

## 整字节核验

- 修改前：15,467 字节，SHA-256 `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d`。
- 修改后：15,732 字节，SHA-256 `1cacba24e81a00e5c9d82fe663f664ac7618c5a2c0b471fb45a792611b713bf8`。
- 修改前进出快照：`D:\Lawbeach\lawbench-coord\T18CriminalFiniteSignatureInput-20261029-095555\source-files-before.json`。
- 当前文件中旧块计数为 0，新块计数为 1。
- 在内存中将新块替换回旧块后为 15,467 字节、SHA-256 `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d`，与冻结输入逐字节相等。
- 因而可确认除该单一代码块外，源码其余字节未变。

## 当前源码钉子

| 文件 | SHA-256 |
|---|---|
| `T18CriminalTemplateGuardInput-20261029-094640\b-service-criminal-reading.py` | `e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c` |
| `CriminalTemplateGuard-20261029-094640\b-service-criminal-reading.py` | `d216a0394488e6d6c90e0a20f373fe43b1d5d62d0e06126f0c85e0673591a9be` |
| `CriminalTemplateGuard-20261029-094640\literalfixed-inputs.json` | `0afd235aee78bd36e3160cfde7838594b1af6400a34814954bde117a9121f08a` |
| `CriminalTemplateGuard-20261029-094640\native-criminal-reading.mts` | `2401deb96f10320e80887ae09be9479bca04f6aef6c6d3dc0b74a495399c4f96` |
| `CriminalTemplateGuard-20261029-094640\registry.py` | `05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21` |
| `CriminalTemplateGuard-20261029-094640\README.md` | `2d01a2f34dc8f7a1e1d806e4f99f3b913382125913aa4e4832dc03cefe426b77` |
| `CriminalTemplateGuard-20261029-094640\verify-criminal-template-finite.py` | `1cacba24e81a00e5c9d82fe663f664ac7618c5a2c0b471fb45a792611b713bf8` |

上述 B 服务、字面固定输入、原生 MTS、registry 与 README 均与前置快照一致，未修改。

## 执行与验证记录

Shell：`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

Shell 参数：`login=false`。全程未使用 bash，未更改沙箱、审批或 ACL。

`exec_command` 共 10 次：9 次成功，1 次非零。

1. 只读正式执行令全文：成功。
2. 只读有限验证脚本全文：成功。
3. 只读既有证据目录清单：成功。
4. 初始 `git status --porcelain=v1 --untracked-files=all`：非零，退出码 1；`cannot chdir ... modules/dsh: Permission denied`。该只读检查被受保护子模块阻断，未尝试修锁或扩权。
5. 只读协调目录匹配文件：成功。
6. 指定脚本只读 `git diff`：成功；输出为空，说明不能依赖该路径的 tracked diff。
7. 只读当前脚本长度与 SHA-256：成功。
8. 只读 `source-files-before.json` 及冻结输入摘要：成功。
9. 只读源码上下文与 `git status --ignore-submodules=all`：成功；长路径产生警告，初始脏工作区保持不动。
10. PowerShell 内存整字节反演校验：成功。

运行边界：

- `finite = NOT_RUN`
- Python/Node 运行次数：0
- parser/AST/import/check/test/build 次数：0
- HTTP 请求次数：0
- 模型请求次数：0
- Key/DPAPI/环境变量读取次数：0
- GUI/SSH/root driver/process probe 次数：0
- 产品运行、服务启动、会话或 Agent 启动次数：0

静态结果不能替代主编排计划中的一次全新 `actualCaseRegistry`、私有案和 no-HTTP/no-model 有限运行。

## 写入面

本次只写三个文件：

1. 修改指定 `verify-criminal-template-finite.py`。
2. 新增本 note。
3. 新增 `A-handback-T18-criminal-finite-signature-20261029-095555.md`。

未修改 README、B 服务、原生 MTS、manifest、registry 或其他产品或 Skill 文件。

Git 严格只读：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存任何内容。交付不依赖 Git 提交。

## 既有状态保全

- 前序任务状态保持 COMPLETED：60 次实际命令、52 次成功、8 次非零、runtime 0、full root review；不是 62。
- 前序正式记录保持“2 次 formal Bash、实际 3 次执行前拒绝”；原 formal 未改写。
- B guard 钉子保持 `d216/source2401/manifest0afd`；ROOT 已接受 full byte inverse；运行状态保持 `NOT_RUN`。
- 未重演旧开工、安装、调研、全量测试或旧证据采集。
- 未联系其他聊天，未更换 API，未启动第二 writer。
- 未发生历史更正式重写。

## 遗留事项

有限脚本的运行时结果待主编排按正式边界执行并判读。Git 子模块权限拒绝仅是只读状态核验阻碍，不影响本次指定文件修改、整字节反演和文件交回。
