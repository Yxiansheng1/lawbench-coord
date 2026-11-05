# A线交回：T34 existing live consumer 精确副本

日期：2026-10-25

## 交付

- 新文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-native-core-http.spec.ts`
- 输入原件：`D:\Lawbeach\lawbench-coord\ORCH-T34LiveConsumerInput-20261025-164225\consumer-before.ts`
- 输入 SHA-256：`3cf0e9bc19d38c1b8853b95d1ea698ec5cfc924bcefc94fbf6e47b3cc1d2bea6`
- 输出 SHA-256：`3e4f334e368c8e2a80da474eb7879c8f8e1238e4a0234d962504ac7d8fbde892`
- 输入字节数：8333
- 输出字节数：8328

## 唯一变更

仅将以下一行替换一次：

```diff
- const REPO_ROOT = resolve(TEST_DIR, '..', '..')
+ const REPO_ROOT = 'D:/Lawbeach/lawbench-B'
```

其余内容按原始字节保留，包括 `const TEST_DIR = dirname(fileURLToPath(import.meta.url))`、`import { CoreClient } from '../shared/core-client.ts'`、未使用导入、断言、超时及环境变量逻辑。生成后的实际消费者来自 A 线 `../shared/core-client.ts`，而测试数据根目录指向 B 线已准备的 `D:/Lawbeach/lawbench-B/docs/plan/evidence/T34/CoreHttpEntry-20261025-163357/runs` 下指定运行目录。

## 验证

- 写入后按字节重新读取并与预期输出逐字节比对：通过。
- 预期输出 SHA-256 与实际输出 SHA-256 一致：通过。
- 旧行写入后出现次数：0。
- 新行写入后出现次数：1。
- 按执行令未运行作者侧服务器、Vitest、测试、解析、类型检查、构建或打包；没有作者侧运行结果。
- 按执行令未进行任何安装、依赖或配置变更。

## Git 与遗留

本次仅对仓库源文件作了上述一处新建，未执行任何 Git 写操作。只读 `git status --short --untracked-files=all` 在 `dsh` 子模块的 worktree 元数据处因权限拒绝退出 128；未尝试修复、改写或绕过该权限状态。该查询阻碍不影响本副本的事实：输入摘要、唯一替换点和输出逐字节核对均已固定记录。

无作者侧执行证据；打包状态保持 HOLD。
