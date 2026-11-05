# REVIEW-C — T18 Verifiable Fact Review: source-only feasibility and minimal repair decision

Job type: source/interface feasibility only. No implementation, no model run, no test/probe/build/selfcheck
executed, no git write (git untouched), no contact with any other reviewer or session.
Author: lane C (deepseek-v4.1-flash-1017/max).

## 1. Inputs actually read (the complete allowed set)

1. `D:\Lawbeach\lawbench-coord\ORCH-C-T18VerifiableFactReview-20261101-183034.md` (this order)
2. `D:\Lawbeach\lawbench-coord\T18VerifiableFactReview-20261101-183034\requirements-and-original-failure.txt`
   - `D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md` SHA `5c6fe8ee70076e2b491adb4e4e4ed5e76ca056317ea4e8bbcf3028b56aecbc11`
     (excerpts: procedure 0034-0041, "保存前核验" 0042-0054, delivery result table 0103-0126,
     shared rules 0127-0152, "自检清单" 0153-0158)
   - Closed business review JSON (verdict `BUSINESS_FAILED_PARTIAL_WITH_SAMPLE_ONLY_RECOVERY`,
     3 remaining failures, `Packaging: HOLD`, `legal_quality_PASS: false`)
3. `D:\Lawbeach\lawbench-coord\T18VerifiableFactReview-20261101-183034\current-interface-and-delivery.txt`
   - `D:\Lawbeach\lawbench-B\contracts\tools\case_save_draft.schema.json` SHA `e3cddc97...`
   - `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` SHA `7d52fe34...`
   - `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` SHA `ce6a5ee0...`

No other file was opened. Section 9 lists every additional path/symbol the implementation phase needs.

## 2. The defect, restated from the supplied evidence only

Three failures survive the closed review, and they are of three different kinds. The plan must not treat them
as one problem.

- **D1 — omitted independent adverse fact (extraction recall gap).** 阅卷笔录 original unit 14 (自制工作证) was
  actually returned in a native read result (Native92), yet is absent from all three saved drafts, while the
  final result-table row "独立不利及争议事实的实际落点" was still written **通过**. The fact was never *declared*
  anywhere, so nothing downstream could have compared it to the draft.
- **D2 — unsupported assertion of absence (over-claim beyond read scope).** All three drafts assert
  "only victim statements / transfers, no corroboration" although bottom-level statements and chat data were
  never provided/read; a later generic limitation paragraph does not support a categorical assertion.
  Machine-side this is visible only through the coverage snapshot (partially read 30/31 and 30/42, unreadable
  materials present), and the coverage-gated selfcheck status was nevertheless written **通过**.
- **D3 — model-authored status used as proof (self-certification).** The two rows above were written by the same
  model that produced the drafts, against prose it also wrote. `citation_check.passed` is already disclaimed in
  product text ("passed=true 只表示没有必须修改项，不等于所有事实已经核验"), and the coverage notice already says the
  coverage list "不代表事实、争议点或法律问题均已核验" — yet the *answer* still asserted 通过. The defect is that the
  answer's status column has no machine-backed source at all.

## 3. What is deterministically checkable, and what is not

The order requires this split explicitly, so it is stated as a contract on the plan.

| Dimension | (a) deterministically checkable by product code | (b) not checkable without a semantic stage / human |
|---|---|---|
| Fact presence in read scope | *absence* of a row is detectable only against a declared set | whether every adverse fact in the read scope was *found* (recall) |
| Quote authenticity | verbatim substring of the retained read text at the cited locator | whether the quote supports the characterization attached to it |
| Mapping to draft | declared landing must be a verbatim substring of the saved draft of that version | whether the landing response is legally adequate |
| Citation validity | citation resolves to a unit actually read, in range, right version (already enforced machine-side) | whether the cited unit is the best evidence for the point |
| Absence/"no corroboration" claims | scope gate: while coverage shows partially_read / not_read / unreadable / omitted > 0, the *status* of any evidence-sufficiency row is blocked from 通过 | whether the draft sentence itself has been over-strengthened |
| Selfcheck truth | status string must come from a machine verdict artifact, not from prose | — |
| Legal correctness | — | entirely (b); stays 待律师核实 by design |

**Conclusion that governs everything below:** a reliable fix for D1 (the omission) needs a *distinct
semantic-review stage*. No validator can catch a fact that was never declared, so no amount of checking of
model-authored artifacts can prove completeness. What the product can do is (i) make every *declared* fact
authentically sourced and actually landed in the draft, (ii) make the *status* column machine-backed and
coverage-gated, and (iii) obtain candidate facts from a derivation that is independent of the drafting pass,
so that D1 becomes *detectable* (red) instead of silently green.

## 4. Guarantees that must be explicitly rejected

Rejected as claimed guarantees (not merely "insufficient"):

1. **"A product-owned fact-to-draft ledger proves the mapping is complete."** False for this sample: 自制工作证
   (D1) never entered any ledger, so every ledger check (quote authenticity, landing presence, citation range)
   would stay green while the exact original defect survives. A ledger can only prove *"what was declared is real
   and landed"*, never *"nothing was left out"*.
2. **"A checklist / longer prose prompt fixes it."** The prose already requires the full independent adverse-fact
   mapping (SKILL 0037, 0050, 0115, 0158) and still failed on the same sample; adding prose to the same
   self-certifying channel is prompt lottery, not a fix. The plan below changes the *claim* (narrows it) and
   *binds* it to a machine verdict — it does not add stronger prose.
3. **"Regex / NLP fact classification, per-sample names or keywords (工作证, 自制工作证) can detect the omission."**
   Forbidden by the constraints and methodologically void: it detects the sample, not the class.
4. **"Read the whole case so nothing can be hidden."** Forbidden fallback; also does not fix D1, because 工作证
   *was* inside the already-read range.
5. **"A different/temperature-tuned model will extract the facts."** Out of the current constraints
   (model `qwen38-27b`, temp 0.6, budgets held); no ablation or causal claim is authorized here.
6. **"Silent semantic PASS."** Any stage that cannot produce its artifact must leave the status at 未解决 /
   未核验 — never 通过.

## 5. PREFERRED MINIMAL PLAN (one plan, two parts, one shared artifact)

Name: **candidate→landing cross-check with a coverage-gated machine verdict**
(`候选事实—落点对照 + 覆盖门控的机器裁决`).

### Part A — machine-verifiable mapping artifact + coverage-gated status (deterministic)

**A1. New optional save argument.** `case_save_draft` args gain an optional `fact_map`:
`[{ id, quote, material, unit, category, landing }]`, where `quote` is the verbatim original short quotation of
one independent fact (the 0037 splitting granularity), and `landing` is the verbatim draft text that handles it
or the verbatim placeholder tag that defers it. One fact → one row; a sentence carrying behaviour + credential +
identity must be split into several rows (SKILL 0037/0050 requirement stays, now machine-enforceable at row level).

**A2. Save-time validator (deterministic, four checks).**

- **V1 authenticity** — `quote` must be a verbatim substring of the retained read text of the cited
  `material`/`unit`, and `material`/`unit` must be inside the actually-read set of the current coverage snapshot.
  Fail → the row is `unauthentic` (and no such row may support a 通过).
- **V2 landing** — `landing` must be a verbatim substring of the draft content *of the version being saved*.
  Fail → the row is `declared-not-landed`.
- **V3 candidate coverage** — every candidate produced by Part B must have a `fact_map` row whose `landing` is a
  verbatim substring of the draft content. Missing ⇒ `failed_candidates[]` (this is the check that turns D1 red,
  *conditional on Part B recall* — see §5.2 and §7 N1).
- **V4 coverage gate / absence scope** — if the coverage snapshot shows `partially_read`, `not_read`,
  `unreadable` or `omitted.* > 0`, then the evidence-sufficiency and source-hierarchy verdicts are forced to
  未解决 (machine-enforced), and any fact_map row that asserts an absence ("only … / no corroboration") must
  scope itself to read units only; a row whose scope reaches outside the read set is `over-scoped` ⇒ 未解决.

**A3. Machine verdict artifact, version-bound.** The save path emits
`{ status, rows_checked, failed_candidates[], unauthentic[], declared_not_landed[], over_scoped[], unverifiable[],
coverage_gate_applied }`, bound to (taskId, title, draft version). It is surfaced to the model through the
*existing* notice channel (`state.noteSuccessfulDraftForDeliveryReview` / `takeDeliveryReviewNotice` pattern in
`dsh-ext/agent\task-state.ts`), re-armed on **every** successful save (the current notice is one-shot per task and
must not be reused: re-save invalidates the previous verdict — SKILL 0121 already says so, the product must
enforce it). `case_save_draft` result contract stays as-is if the verdict rides the notice channel; if a result
field is preferred instead, `result` has `additionalProperties: false` and `required: [path, version,
citation_check, coverage, not_fully_read]` — so adding a field is an additive contract change, not a silent one.

**A4. Status column becomes machine-backed (this is the D3 fix).** The defense-opinion result table's two rows —
"独立不利及争议事实的实际落点" (0115) and "来源层级与有限阅读反证" (0114) — may state 通过 **only** when the
machine verdict says `landed-complete` and `coverage_gate_applied == false`; otherwise the row must state 未解决
and quote the machine-reported failed items. The claim wording is also narrowed to what is actually provable:
"每一条被抽取出的不利事实候选均有可见落点" instead of "全部独立不利事实均已处理" (the current wording is the
over-claim that produced the false 通过).

### Part B — independent semantic extraction (the only mechanism that can turn D1 red)

**B1. One isolated extraction request, before drafting.** When the read scope is established and before the
draft is written, the runtime issues **one** model request whose context contains *only* the read text of the
units actually read (server-side assembled by the product) — no draft, no fact_map, no drafting transcript, no
prior selfcheck text — with a single instruction: enumerate every independent fact in that text that is adverse
to the client, disputed, or an assertion of absence of corroboration, one item per fact, each with verbatim
quote + material + unit locator + category, JSON only.

**B2. Independence is the whole point.** If the extraction sees the drafting transcript (or is the same
answer that drafted), it can omit the very same detail and the comparison stays green — this is exactly the
self-certification the plan is meant to remove. Isolation is therefore a hard requirement, not a nicety.

**B3. Fail-closed.** Unparsable output, empty output while units were read, extraction not run, or read text
not retrievable ⇒ verdict `status = 未核验 (unverified)`; the completeness rows must read 未解决. Never 通过.

**B4. Honest limit.** Part B is a *recall* mechanism, not a proof. It raises the floor (and it is falsifiable:
§7 N1) but it cannot certify "no adverse fact exists beyond the extracted set". This is why Part A4 narrows the
claim and why the residual limit must stay visible in the answer.

### Data flow (end to end)

`case_search`/`case_read_material` (unchanged) → product keeps the actually-read unit set and text →
**Part B isolated extraction** (1 model call) → candidate set stored as a task artifact →
drafting (unchanged procedure; model also receives the candidate set so it can land them) → model submits
`fact_map` with `case_save_draft` → **Part A validator** runs in the save path → verdict artifact (version-bound)
→ notice to the model → model fixes real gaps and re-saves (bounded by the existing budget) → the answer's two
critical rows quote the verdict verbatim and disclose the residual limit.

### Ownership

| Artifact / state | Owner | Scope | Lifetime |
|---|---|---|---|
| read-scope set + read text | product runtime (`dsh-ext/agent`, existing coverage path) | per task | task |
| candidate set (Part B) | product runtime, new artifact under `工作区/任务/<任务ID>/…` | per task (never cross-task, never cross-case) | task + version history |
| `fact_map` rows | model-authored, submitted with the save, validated by product | per (task, title, draft version) | invalidated by the next save |
| verdict | product runtime (machine) | per (task, title, version) | version |
| coverage gate facts | existing `DeliveryCoverageSnapshot` | per save | save |
| skill text (row wording + bound) | `skills/defense-opinion/SKILL.md` via `build_skills.py` pipeline | repo | release |
| contracts (`fact_map` arg) | `contracts/tools/case_save_draft.schema.json` | repo | release |

Cross-line note: contracts + runtime live in other lanes' trees (`lawbench-B` contracts / skills,
`lawbench-A` `dsh-ext`), so implementation needs owner routing; lane C does not assume it.

### Failure behavior

- Extraction fails / empty / unparsable → verdict 未核验, completeness rows 未解决, draft still saved
  (lawyers must still get output; the answer states the limit).
- Validator cannot retrieve read text → V1 `unverifiable` (not "pass"); the affected row may not support 通过.
- Declared-but-not-landed or failed candidate → draft save still succeeds, verdict RED, model is expected to
  correct and re-save under the same title; re-save ⇒ new version ⇒ previous verdict invalidated and recomputed.
- Budget: Part B adds one model call. The skill's "本次任务最多 32 次模型调用" rule and the runtime's
  `case_*` tool budget (index.ts pre-execute) must be reconciled explicitly (recommend: Part B runs *before*
  drafting, is exempt from the `case_*` count, and consumes 1 of the 32 model calls, so a partial draft can still
  be saved if the budget runs out — T14 pattern).

### Rollback

Additive only: remove the optional `fact_map` arg, the Part-B request, and the V1–V4 calls; drafts on disk are
unaffected, artifacts are deletable, no schema of existing drafts changes. Important: a plain rollback re-enables
the known false-PASS defect. The preferred kill-switch therefore keeps the gate and disables extraction, which
degrades the verdict to 未核验/未解决 (fail-closed), instead of degrading to permissive 通过.

## 6. Required negative and positive proof

Seed = the original T18 evidence, reused as-is (no new model run for the deterministic checks): 阅卷笔录 unit 14
(自制工作证) as returned in the native read result; the three saved drafts that omit it; the coverage figures
(30/31 interrogation, 30/42 prosecution, unreadable/unprovided bottom-level statements and chat data); the
recorded result-table rows.

| # | Proof | Expected |
|---|---|---|
| N1 | Replay the seeded read scope through Part B | Part B **must** emit the 自制工作证 candidate; then V3 ⇒ RED, `failed_candidates` non-empty. Decisive falsification: if Part B does not emit it on the seed, the plan is falsified and must not ship as "fixed" |
| N2 | `fact_map` row whose `quote` is absent from the read text | V1 RED (unauthentic) |
| N3 | row whose `landing` is absent from the draft content | V2 RED (declared-not-landed) |
| N4 | ledger of v1 submitted with the v2 draft | verdict stale ⇒ no 通过 on that draft version |
| N5 | extraction malformed / empty while units were read | verdict 未核验 (fail closed), never 通过 |
| N6 | coverage incomplete (as in the seed) + source-hierarchy row claiming 通过 | coverage gate forces 未解决 and lists the actual coverage gaps |
| N7 | absence-asserting row scoped outside the read set | V4 RED (over-scoped) |
| P1 | same seed, draft that lands every extracted candidate incl. 自制工作证, coverage complete | GREEN, and the answer's claim is bounded to "every extracted candidate landed" |
| P2 | a scope whose extraction returns zero candidates | GREEN only with an explicit "extraction returned no candidates" — not PASS by silence |
| P3 | scope with an unreadable material | landing checks GREEN, source-hierarchy row 未解决, both disclosed |
| P4 | adjacent flows: non-drafting skills (阅卷/审查) | no new tool, no extra model call, no artifact, no user-visible change |
| P5 | multi-task isolation | task A's candidates/verdict never visible to task B; artifacts stay under the task directory |
| P6 | re-save loop | failed-candidate list shrinks monotonically, converges within the existing budget, final verdict binds to the final version |
| P7 | hygiene | `contracts\check_examples.py --skills skills` and `skills\_scripts\build_skills.py --root skills` pass; no new dependency; no model/temperature/budget change; egress rules untouched; ledger/artifacts contain no keys and never leave the workspace |

## 7. Residual limits that this plan does NOT remove (state them to the owner, do not hide them)

1. **Recall ceiling.** Part B can still miss an adverse fact. After the fix, the truthful claim is "every
   *extracted* candidate landed", never "all adverse facts are handled". Legal quality still needs the lawyer.
2. **Chat prose is not machine-checkable.** The selfcheck table lives in the model-authored answer; the product
   cannot mechanically block a wrong "通过" *sentence*. What the fix guarantees is that the machine verdict and
   the real coverage are injected as the source of truth, and the skill forbids 通过 without them. A hard
   guarantee would require a product-generated (templated) status column — larger change, not proposed here.
3. **Over-strong draft sentences.** V4 can block the *status*, not rewrite a categorical sentence already inside
   the draft (detecting that would be the forbidden lexical classifier). A semantic reviewer can flag it; only a
   human can be certain.
4. **Adverse-fact granularity.** Row splitting (behaviour / credential / identity / time / amount use / source
   status) is enforced at row level only for facts that are *declared*; the granularity of the split itself is
   still model judgement.

## 8. Smallest concrete decision required from the owner (do not assume any of it)

**D1 — Part B (isolated adversarial extraction, 1 extra model call per drafting task, same local model,
isolated context, JSON output, budget rule updated).** Options:
  - (recommended) authorize ⇒ D1 becomes detectable/red on the seed and the mapping becomes machine-checkable;
  - do not authorize ⇒ only Part A ships; the defense-opinion completeness rows can never state 通过 (fail-closed)
    and **the omission defect itself is not fixed**, only the false PASS is removed — this must then be recorded
    as an accepted, documented limit, not as a fix;
  - use a different/stronger model for the extraction pass ⇒ outside the current constraints; requires an
    explicit constraint change (not assumed here).
**D2 — contract change:** optional `fact_map` on `case_save_draft` args (and, if preferred, an additive verdict
  field on `result`); cross-line, needs routing to the contracts owner.
**D3 — fail-closed default:** accept that, without the new artifact, the two critical rows of the defense-opinion
  result table must read 未解决 (user-visible change on every drafting answer).
**D4 — skill wording:** narrow the two rows to the provable claim and bind them to the machine verdict; edits must
  go through the skill build pipeline (the "共用规则" block is injected by `build_skills.py` and must not be
  hand-edited inside a single skill).

## 9. Exact source paths / symbols the implementation phase needs (not read here; no exploration performed)

1. The `case_save_draft` implementation module in the runtime tree (argument validation, draft write, `version`
   determination, `citation_check` and `coverage` computation) — needed to place `fact_map` and V1–V4. Locate by
   the tool id string; not browsed in this job.
2. `contracts/common.schema.json` → `$defs/citation_check` and `$defs/coverage`: exact field shapes, whether
   coverage can carry per-unit locators (needed for V1/V4), and the additive-compatibility of a new optional arg.
3. The reader side: whether the runtime retains the raw text of each read unit outside the model context
   (tool-result cache / transcript) — needed both for V1 and for assembling Part B's isolated context. If it does
   not, Part B must re-read through `case_read_material` (extra calls, budget impact) and V1 degrades to
   citation-only.
4. The module defining `DeliveryCoverageSnapshot` (the type behind `deliveryReviewNoticeText`) — to know whether
   per-material unit locators exist or only counts.
5. The tool whitelist / registry exercised by the pre-execute path in `dsh-ext/agent\index.ts` — only if Part B is
   implemented as a tool call rather than as an internal isolated model request.
6. `skills/defense-opinion/SKILL.md` at the recorded SHA (full text; only excerpts were supplied) plus the
   shared-rules source injected by `build_skills.py`.
7. The workspace layout rule for `工作区/任务/<任务ID>/…` artifacts — to place the candidate set and the verdict
   without breaking the product's file conventions.

## 10. Statement of limits of this job

No product/test/schema/skill file was modified; no Python/Node/parser/test/collect/build/preparer/probe/HTTP/
model/GUI/app/runtime call and no selfcheck was executed; no other reviewer was supplied or contacted; git was
not touched (read-only expectation, no add/commit/rebase/stash/reset/clean/checkout/push attempted); all old REDs
and the dirty worktree are preserved. This file is the only artifact written.

