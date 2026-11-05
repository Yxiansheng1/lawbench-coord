#!/usr/bin/env bash
# 换电脑（2026-10-19）：把写死的 D:\lawbench… 改成 D:\Lawbeach\lawbench…（保留反斜杠个数，JSON 里的 \ 也对）。
# 用法：bash 迁移-改路径-20261019.sh <仓库目录> [协调目录]
# 从 GitHub 重新 clone 之后，对 clone 出来的仓库目录再跑一次，然后提交。
# 正则里用 \x5c 表示反斜杠，避免各种 shell/工具层对反斜杠再转义。
set -e
REPO="${1:?仓库目录}"; COORD="${2:-}"
files=(
  "$REPO/CLAUDE.md" "$REPO/PROJECT-PROFILE.md"
  "$REPO/docs/src/Spec.md" "$REPO/docs/src/业务编排.md" "$REPO/docs/src/环境事实.md" "$REPO/docs/Spec.html"
  "$REPO/prep395/README.md" "$REPO/prep395/deploy/README.md"
  "$REPO/packaging/brand/README.md" "$REPO/acceptance/report-template.md"
  "$REPO/scripts/check_6000d.py" "$REPO/skills/_scripts/install.py"
  "$REPO/docs/plan/lawbench-关键事实索引-20260928.md" "$REPO/docs/plan/lawbench-工单集-第一版开发-20260928.md"
  "$REPO/docs/plan/lawbench-第一期收尾-20261012.md" "$REPO/docs/plan/lawbench-编排计划-第一版开发-20260928.html"
)
if [ -n "$COORD" ]; then
  files+=( "$COORD"/ORCH-*.md "$COORD/lawbench-lane-registry.json" )
fi
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "跳过（不存在）: $f"; continue; }
  if grep -qP 'D:\x5c+lawbench' "$f"; then
    perl -pi -e 's/D:(\x5c+)lawbench/D:$1Lawbeach$1lawbench/g' "$f"
    echo "已改: $f"
  fi
done
