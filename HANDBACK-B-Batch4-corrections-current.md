# B 线 Batch4 有限修正交回

日期：2026-11-03

## 结论

已按正式执行令完成 5 个白名单文件的有限修正。仅修改下列文件，没有执行 Git 写入、测试、解析器、构建、运行态、HTTP、GUI、系统查询或自检；没有生成 schema，也没有尝试修复或绕过 Git 锁/权限。

## 精确改动

1. `service/tests/test_owner_batch4_remote.py`
   - `test_set_secret_invalid_values_do_not_mutate_log_or_restart` 仍覆盖空串及全部原无效值，并保留 `INVALID_ARGUMENT`、`remote_code_invalid`、不写凭据、不记日志、不重启的结果断言。
   - 错误详情断言改为安全固定文案 `REMOTE_CODE_INVALID_DETAIL`，同时断言 `message` 为该固定文案。
   - 输入值泄漏检查只在 `value` 非空时执行，避免空串天然属于任意错误文本造成的假失败。
   - 新增 `test_windows_route_helper_rejects_scoped_ipv6_without_subprocess`：向 `_windows_route_identity` 传入 `fe80::1%25synthetic-zone`，mock `subprocess.run`，断言返回 `None` 且子进程未被调用。

2. `service/tests/test_owner_runtime_detection_batch2.py`
   - 仅将 setter 中的 `"synthetic access code"` 改为 `"synthetic-access-code"`；后续读取状态断言及文件其他断言未改。

3. `contracts/_build/gen_schemas.py`
   - 仅在 `remote_access_value.reason` 的枚举中，于 `NO_REMOTE_ADDRESS` 后追加 `EXTERNAL_NOT_TUNNEL`。
   - 未执行生成器，未修改生成的 `.schema.json`，未改版本或其他枚举。

4. `service/lawbench/remote.py`
   - 新增固定安全文案 `REMOTE_CODE_INVALID_DETAIL = "接入码只能包含字母、数字和常见符号，不能有中文、空格或不可见字符"`。
   - `set_secret` 的无效输入仍在任何 mutation 之前抛出 `ApiError("INVALID_ARGUMENT", "remote_code_invalid", REMOTE_CODE_INVALID_DETAIL)`。
   - 原有 `1..512` 与 `0x21..0x7E` 校验条件未改，详情和日志不含用户输入。

5. `service/lawbench/net.py`
   - `_windows_route_identity` 在 `ipaddress.ip_address` 与 PowerShell 命令构造之前增加 `%` 前置拒绝；scoped IPv6 不再可能把作用域文本插入脚本。
   - `Net.easytier_route` 在 IP 解析和路由身份查询之前同样拒绝含 `%` 的主机。
   - 其他路由命令、参数、对象身份、timeout 和 fail-closed 分支未改。

## 验证状态

按执行令特别禁区，本轮未运行 `pytest` 或任何动态验证，只做了修改后的静态文本复核。请主编排只重跑受影响用例及有限生成器审查，不以此交回件替代测试结果。

## 遗留

`EXTERNAL_NOT_TUNNEL` 只写入了生成器源；按令未运行 `gen_schemas.py`，因此生成 schema 的更新与审查留给主编排。
