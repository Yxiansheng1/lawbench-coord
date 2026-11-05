# ORCH-A T31 private overlay row fix return

Status: bounded correction complete; no GUI acceptance claimed.
Order: `D:\Lawbeach\lawbench-coord\T31WikiRowFixOrder-20261025-113656.md`.
Prior actual root run `T33-host-20261025-113305` still showed the old-wiki hint despite exact private-client C551; the corrected artifact's real GUI remains pending.

Bounded change. Before: `- id: legal-ui` and `  name: <canonical private file URL>`.
After (the sole suffix, with no other settings):

```yaml
- id: legal-ui
  disabled: true
- insert:
    - id: legal-ui-wiki-private
      name: <same canonical private file URL>
```

Reason: overlay `name` is match-only for a non-insert patch; it is not an assignment and a mismatch skips. The old row is disabled by id and the private row is indexed through `insert`.

Full artifact SHA-256 after modification:

- `start.ps1`: `a268c51e5df0754edbbcd6ebb154591c48f766948bdb5dfdfafd9a591bdfd232`
- `README.md`: `6544f8de8e47aa00561bca794845a293a9abf3bdc656845fa1df91824e73d2e2`

Unchanged invariants: `prepare.ps1` remains `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37`; `stop.ps1` remains `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647`.
All six source pins still match the order's agent/client/credentials/host/index/session-store hashes. The package remains `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`; client C551 is 508,590 bytes, with `if (!w.exists) return null;` at line 5716.
The retained start script still checks runtime client E26 and new source C551, preserves the exact-prefix/sole-suffix byte assertion, and retains all other fixed inputs, environment, lifecycle, and cleanup behavior.

Actual read-only commands used: `Get-Content` on the exact order and named files; `rg -n -C` on the named source/overlay snippets; `Get-FileHash` on the two artifacts, preserved scripts, six sources, and package; `Get-Item` for sizes; and `git status --short --ignore-submodules=all`. No shell wrapper or escalation was used.
Read-only blocker: plain `git status --short` failed because Git could not chdir to `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh`: `Permission denied`. Nothing was repaired or widened; no Git write occurred.
Not executed: prepare/start/stop, build, install, tests, static parser, GUI, RPC, services, product imports, network, TEMP/ACL/approval/isolation/lock operations, or Git writes.

Root next: use a brand-new `T33-host-YYYYMMDD-HHMMSS` root and run `start.ps1`; do not reuse `T33-host-20261025-113305`. After the real GUI journey, run `stop.ps1` and require zero exact recorded PIDs and zero listeners on the recorded native port.
