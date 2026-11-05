# A 线交回：T32 取消计数对齐

状态：有界修改与静态证据完成；实际运行 NOT_RUN；包装 HOLD；全项目不完整。

执行依据：`D:\Lawbeach\lawbench-coord\T32-cancel-counter-align-order-20261027-161120.md`

## 结果

已仅替换允许 fixture 中一个精确元数据块：

`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t32-invalid-scope-cancel-http.finite.ts`

- 修改前：40314 bytes，SHA-256 `8C351B43B1A98E0F924A006564D09E6DAB455CA6E87C4CD83A0E63287DFADFE9`
- 修改后：40849 bytes，SHA-256 `70F262887FD338D9356BC65D23CF207FA647A2CB3A7259F210561DA55EB747FE`
- 旧块：273B，唯一命中于偏移 36530
- 新块：808B，唯一命中于偏移 36530
- 精确反向替换后：40314 bytes，SHA-256 `8C351B43B1A98E0F924A006564D09E6DAB455CA6E87C4CD83A0E63287DFADFE9`
- selector 哈希：`D366B49C91D0C91EF5D60409975C067D227FB0553247BFC17818F7B6D0D79F64`，`d366b` 冻结事实一致
- LF：1120；CRLF：0；末字节：`0x0A`

正反哈希一致，证明指定块外字节未变；14 次 HTTP 序列与原有业务、claim、R、source、error、finally、ledger 断言未因本次编辑改变。新块拆分了初始/重放 begin 与 before/after context 计数，并补上 explicit denial、terminal、repeat 断言。

## 写面

- 修改：上述唯一 fixture。
- 新增证据：`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t32-cancel-counter-align-20261027-161120.md`
- 新增交回：本文件。

没有修改产品、B 线、schema、旧测试、README、历史材料、pins、legacy scripts、runtime、guard、插件、loader、config、alias、import、timeout 或 skip。

## Git 与阻碍

只读执行：

```powershell
git status --short --untracked-files=all
```

唯一非零结果：退出码 1，`cannot chdir ... Permission denied`，随后 `git status --porcelain=2 failed in submodule dsh`。未修改权限、审批、ACL 或锁，未尝试 Git 写修复。全程没有 add、commit、rebase、stash、reset、clean、checkout 或 push，因此无 commit SHA。

## NOT_RUN

未运行 Python、Node、parser、AST、import、collect、fixture、Vitest、tsc、pytest、build、prepare、serve、probe、HTTP、GUI、model、selftest 或后台 watchdog；未重演旧开工、安装、调研或全量测试；未宣称 semantic green。真实运行时 metadata shape 请在 B 线 final review 完成后由主编排使用精确 peer fields 验证。

详细实际命令和证据见 fixture 同目录证据文件。到此停止。
