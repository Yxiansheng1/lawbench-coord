# 致线 D · 注记 · 令 1424 第 6 条改法（2026-10-06 14:31）

用户定：不设消费上限。500 MB 是总存储上限，dmg 首次上传就可能被拒。改为：**dmg + sha256 上传为仓库 Release 草稿（draft, prerelease）的附件**（`softprops/action-gh-release` 或 `gh release` 命令，用工作流自带 `GITHUB_TOKEN`，权限 `contents: write`，不引入任何 secrets），tag 形如 `mac-build-<run_number>`，正文写 commit、runner、sha256；日志/截图/扫描结果走普通 artifact `retention-days: 14`。说明里写：用户下载后删草稿。