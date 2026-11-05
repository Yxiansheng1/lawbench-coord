# T18 Cited-Unread Source Review Handback

## Verdict

The supported cause is a deterministic provenance gap, not a transport, parser, or citation-semantic bug. `Spec 9.4` intentionally limits `citation_check` to A-G physical/value checks; `PRD F-CITE-03` separately requires actual-read coverage. The save path never joins those results by material identity, version, and location. There is no evidence of deliberate evasion, but the final "facts checked" assertion is unsupported and must not be retained as a quality claim.

## First OLD RED Counterexample

In closed root case 3, the task searched and made five primary reads: interrogation 14-20 and prosecution 12-15, 21-24, 28-31, 24-27. Search is not a primary read. Search 87 queried "willingrepayment"; hit 88 cited interrogation 24. Drafts 2-7 relied on interrogation 24 for the attitude conclusion, but the task never primary-read page 24, while the final self-check claimed the facts were checked. The existing checker can resolve and validate that citation physically, so it can pass despite the unread source. This is the first reproducible RED.

## Safe Minimal Testable Design

For `task.skill == "defense-opinion"` only, reuse the non-fixed `Item` objects already produced by `check_text`; do not re-parse names or perform semantic classification.

1. Form each reference as `(material_id, material_version, loc)`.
2. Under the original task lock, load its `reads.json`; require exact `material_id` and `material_version`.
3. Require every unit in a page/paragraph/line range, and every row in a cell range, to be completely covered. Multi-item citations are checked individually.
4. Emit only factual states: `source_read`, `unread_or_version_mismatch`, `unverifiable`, or `no_structured_source`.
5. Treat `〔推断〕` and `〔未找到依据〕` as non-sources, not as provenance passes.
6. `save_document_ui` must use the source task's original history. Missing/corrupt legacy reads means `unverifiable`, never a default pass.

Future tests need no runtime work now: cited-but-unread => red; exact version plus full cited item => green; changed SHA, incomplete unit, partially covered range => red; spreadsheet or missing legacy history => `unverifiable`.

## Contract Boundaries

Page, paragraph, and line provenance can be implemented safely. Spreadsheet citations cannot be fully proven from the current contract: the citation contains `sheet`, but `reads.schema.json` records only `unit/from/to`, so the workbook sheet is lost. Under the current contract, all spreadsheet provenance must be `unverifiable`; exact sheet/unit identity requires an approved contract change.

Leaving a unit partially read never counts. Source re-import makes the old SHA unread and requires a fresh read. Malformed citations remain E-class failures. Legal-content caveats remain separate; no provenance state authorizes a new legal-quality PASS, assertion waiver, hardgate, or changed UI behavior.

The recommended bounded audit signal is safe for page/paragraph/line only. A claim of all-format validation is explicitly rejected pending contract approval. Result-field and hardgate changes are not approved. No Node/Python/parser/check/test/build/HTTP/model/GUI or Git write was run; only the listed source review was performed.
