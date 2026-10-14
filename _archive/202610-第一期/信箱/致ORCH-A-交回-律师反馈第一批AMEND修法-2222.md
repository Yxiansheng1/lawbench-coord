# 线 A 交回 · 律师反馈第一批复核 AMEND 修法（令 2203）＋ 估算阈值（注记 2156）· 2026-10-06 22:22 (+08:00)

## 提交

line-A 在 `23f5573` 之上新增两个提交：

| 提交 | 内容 |
|---|---|
| `ae8fe02 T13:` | dsh-ext、`.gitattributes`、证据 |
| `7f3c777 T20:` | 补丁 |

交付说明在 `evidence\T13\交付说明.md` 末节。

## 修法

1. **P1 补丁链**：
   - **原因**：P-4 的 `lawbench-isolation.ts` 一节有 50 个 `\r`，是在 `autocrlf=true` 的临时仓库里生成的；我原来核链的克隆也是 `autocrlf=true` 加 `--whitespace=nowarn`，所以没查出来。
   - **修法**：这一节按 LF 重生成；提交里 17 个补丁 `\r` 个数全为 0。`.gitattributes` 加 `*.patch -text`。
2. **P2 openFolder**：
   - 按 `caseRecent` 核对 case_id 与案件根，用登记的根；根也要求普通绝对路径，空 rel 同样检查（UNC 不开）。
   - 打开前解析联接，实际位置须仍在根内。
   - 用例（真文件系统）：未登记根、UNC 根、出根、联接指到外面，四种都拒；界面调用加 case_id。
3. **P2 materialRemove**：开关挪到 `shared\feature-flags.ts`，界面和 Host 共用；关着时 Host 直接回 `NOT_AVAILABLE`，不问服务、不删。用例。
4. **P2 本机建文件夹递归**：
   - 名字含同步软件名时不提议，直接说明改名（"文件夹名字里有同步软件的名字"）。
   - 本机建好的文件夹仍被拒时只说明、不再提议（"没能打开案件"）；两种说法分开。
   - 用例两条：只建一次、只确认一次。
5. **估算**：100 页或 11 份，先到者触发；N 封顶 11；弹窗写明"按案件全部材料估"（注记 2156 第 1、2 条）。
6. **P3**：
   - `safeFolderName` 先截再去首尾空格和点；保留名带扩展名也换掉。
   - `toolExe` 用 `Object.hasOwn`。
   - 卸载按中英文两个名字都删快捷方式；用打包同版本的 makensis 编译通过。

## 检查

- dsh-ext 656 → 659 通过、6 跳过；typecheck 通过；`check_ui_words` 零命中。
- 第一次全量跑时 `supervisor.spec` 的真实进程用例偶发失败一次（本轮没改那里）；单跑和第二次全量都过。
- DSH 安装器、隔离测试 18 例通过。

## 补丁链（不加 ignore-whitespace）

干净克隆 477b4f4205，`core.autocrlf=false`，`git apply` 不带任何空白选项；有警告会单独列出，本次一条也没有。原样输出（`evidence\T13\补丁链-严格核对-2203.txt`）：

```
ok P-10-profile-lawbench-dsh
ok P-12-desktop-no-office
ok P-13-desktop-no-open-config
ok P-3-first-run-page
ok P-5-conversation-file-intake
ok P-9-default-session-request-whitelist
ok P-14-fail-closed-without-lawbench-bundle
ok P-15-api-file-allowed-roots
ok P-16-citation-inline-marks
ok P-17-links-never-open
ok P-18-no-mention-hint-no-developer-switch
ok P-11-retainer-window
ok P-4-brand
ok P-19-awaiting-user-answer
ok P-20-no-workspace-word
ok P-21-home-above-new-session
ok P-22-macos
paths=154 differing=0 (strict: plain git apply, autocrlf=false)
```
