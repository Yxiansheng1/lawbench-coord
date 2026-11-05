# T18 Read Actionability Discipline Closure — Independent Review (Lane A)

- Reviewer: exactdeepseek-v4.1-flash-1017 / max / lane A, independent of the B author role.
- Artifacts read (exactly the five ordered files): this order; `REVIEW-A-T18BoundaryCurrentIndependent-20261101-164639-Discipline.md`; `T18ReadActionabilityDisciplineClosure-20261101-172705\copy-only-diff.txt`; `...\primary-code-contract.json`; `...\actual-new-public-flow-test.py`; `...\actual-evidence.json`.
- Method: static reading of those five fact files only. No Git command, no Python/Node/pytest/parser/collect/build/prepare/HTTP/model/GUI/runtime, no product/test/doc edit, no extra source or skill read. Runtime count = **0**.
- Verdict: **PASS** — scope is the copy-fix closure of my prior AMEND only.

## 1. Prior AMEND status and how it closes

My prior formal (`...164639-Discipline.md`) ended at **AMEND** with exactly one concrete defect: the `defense_citation_not_read` rejection told the model to read material `{material_id}` through `case_read_material`, whose public schema (`primary-code-contract.json` → `public_read_args_schema`: `required:["name"]`, `additionalProperties:false`, no id argument) accepts a material NAME only. Passing the id returns `MATERIAL_NOT_FOUND`, so the prescribed recovery was not executable. Requested minimal fix: keep the privacy design (no name/body in the error), route the model through the public ID→name mapping, and add a prompt assertion.

The current source copy closes exactly that and nothing else. Prior AMEND → **CLOSED** by the copy change. No prior finding is reopened, and no closed audit item is refilled (see §5).

## 2. Current changed lines

Product: `D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py`, 24627 B / `1eb572b5…`, hunk `@@ -409,9 +409,9 @@`, 3 lines removed / 3 added, error-string block only:

```diff
-                    f"请先核对起止为第{low}至第{high}{unit_name}，"
-                    f"用 case_read_material 完整读取材料 {material_id}，再保存辩护意见。"
-                    "若该范围仍是待识别占位文本，请待识别文本生成后再读取并保存。",
+                    f"请先调用 case_list_materials，找到 material_id={material_id} 的材料，取其 name；"
+                    f"再用 case_read_material 的 name 参数传该名称，按升序区间第{low}至第{high}{unit_name}完整读取后重新保存。"
+                    "区间起止倒置请改为升序；若该范围仍是待识别占位文本，请待识别文本生成后再读取并保存。",
```

`low`/`high` remain produced by `low, high = sorted((loc["from"], loc.get("to", loc["from"])))` at the same site, so the printed bounds are ascending by construction.

## 3. Checks against the ordered criteria

- **Actionability — PASS.** Instruction chain is now public-tool executable and ordered: `case_list_materials` → locate `material_id=…` → take its `name` → call `case_read_material` with that name → read ascending 第{low}至第{high} → save again. Both tool names and the literal `name` parameter appear in the message; `case_list_materials` exposes material_id/name and RED1 records the live mapping. The non-executable id-to-read instruction is gone.
- **Privacy — PASS.** Message carries only internal material_id, unit label, position bounds, and tool/parameter names. No material name, no body text, no path. The generic category word "材料" is a wording token, not a name value. Disclosure surface is unchanged from the previously accepted v1 message (id + position) → no privacy regression.
- **Length — PASS.** Assert `len(message) <= 500`; composed message is ~170 chars for the fixture (32-hex id, single-unit bounds), leaving wide headroom for longer ids/unit labels. No truncation risk.
- **Ascending range — PASS.** Displayed bounds are ascending by construction (`sorted()`), the message instructs ascending reading, and the added clause "区间起止倒置请改为升序" is conditional and cannot contradict the printed bounds.
- **PENDING guidance — PASS.** Placeholder clause retained verbatim ("待识别占位文本…待识别文本生成后再读取并保存"), consistent with the Spec T18 paragraph (占位单元不算已读、不构成授权) and the `_defense_unread_numeric_citation` placeholder rejection.
- **Public name-only contract — PASS.** The read tool accepts `name` only; the new copy never asks for an id argument to it, and never suggests a non-contract argument.
- **Test actual recovery — PASS (artifact-admitted run).** `actual-new-public-flow-test.py` uses public tools only: denial-message assertions (contains id + 第2行 + 读取; contains no name, no content, no line bodies; ≤500), snapshot unchanged, reads empty, task still `running`; then proves `case_read_material {"name": material_id}` → `MATERIAL_NOT_FOUND` with no reads/result change (confirming the old copy's dead end was real, not hypothetical); then `case_list_materials` → id→name → `case_read_material {"name": resolved_name, "start":2,"end":2}` → read returns `unit=line`, `(2,2)`, private line present; read ledger records `(material_id, material_version = sha256(source bytes), line 2..2)`; finally `case_save_draft` succeeds with `version == 1`, exact content bytes on disk, source bytes unchanged. RED1 = 1 failed / 0 passed / 13 deselected, sole failure "Final publictool order/name mapping instruction absent" (all preceding flow/privacy/state/fixture checks already passing) → GREEN14 = 14 passed / 0 failed / 0 errors, `source_pins_held 541`, `guard_denials 0`, `forced false`, original RED1 and long-root 9 failures preserved.

## 4. Byte inverse — old cumulative helper unchanged

Artifact-admitted: old 24502 B / `28011ed8…` → current 24627 B / `1eb572b5…`, differing only in three existing error strings, with helper logic, single check, locks, UI save path, TaskStore, SDK, guards and schemas held. The supplied copy-only diff is consistent with that claim: exactly one hunk inside the error-string block, no helper/lock/UI/TaskStore/SDK/guard line touched. Consistency between the diff and the inverse claim is what was checked here; the inverse was not independently recomputed in this run (the order forbids extra source reads and any runtime). Packaging nit: the diff carries no file headers, so its scope rests on `primary-code-contract.json`, not on the diff itself — not a code defect.

## 5. Evidence limits (carried forward, not closed by this review)

- Runtime in this review = 0. All numbers are artifact-admitted: red1 1F/0P/13 deselected (1.23 s), green14 14P/0F/0E (7.88 s), on a fresh shorter owned root; source pins held, guard denials 0, `forced false`.
- Whole-service regression was **not** re-run at the new SHA. The 1419-result suite (1351 PASS / 18 FAIL / 8 ERROR / 42 SKIP) belongs to 24502 B / `28011ed8…`. No derived current-whole PASS is claimed or implied.
- Pre-existing OPEN items untouched: Windows long-path atomic temp (260 / FileNotFoundError) under the longer root; Excel cell version and read attribution unproven; GUI/OCR/default-lifespan/native-R recovery; model-loop causality NOT_PROVEN; business quality FAILED_PARTIAL; packaging HOLD.
- Source-process qualification (artifact): that author exceeded capsule-only scope via repeated target/test-source reads and prohibited readonly Git diff/stat; source state `deadline_exceeded`, no formal handback, index refresh not proven absent; 23/23 commands zero exit; no APP/parser/test/model runtime. Root admitted finite authorized test only. This review does not upgrade that process record.
- Scope: PASS covers the copy closure of the prior AMEND. It is not a whole-service, business-quality, packaging, or model-behaviour pass.

## 6. Residual observations (non-blocking)

- The message does not literally name the read tool's `start`/`end` parameters (only "第{low}至第{high} unit"); positions must be mapped via the tool schema. Recoverable and consistent with the previously accepted message, so not raised as a defect.
- "区间起止倒置请改为升序" is always-safe advice because the printed range is already normalised ascending.
- The test's name-absence assertion is fixture-specific ("事实材料"); a material literally named "材料" would collide with the generic wording token. Wording-token collision, not disclosure of any name value; leak surface stays id + position.

## 7. Verdict

**PASS.** The single concrete remaining issue from my prior review — the non-executable "read material by id" instruction — is closed in the current source copy, demonstrated RED→GREEN on a public-flow test covering denial text, privacy, state/ledger invariance, and successful re-save with exact bytes. No new concrete defect was found in the changed lines; the old cumulative helper is asserted byte-unchanged outside the three error strings, consistent with the supplied diff. Runtime count for this review: **0**.
