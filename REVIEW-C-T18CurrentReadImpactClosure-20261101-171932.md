# T18 Current Read-Impact Closure Review

## Verdict

PASS

The cumulative source change is coherent with the stated read-authorization requirement. No concrete source or test defect requiring AMEND was found. Packaging remains HOLD because the separate long-path, model, GUI, OCR, and Excel-cell claims are not closed.

## Concrete Findings

- No defect found in the authorization helper at `current-product-numbered.txt:324-382`. It reads the current task's ledger, groups by exact material ID, material version, and unit, and merges inclusive ascending intervals correctly. A ledger gap at lines `348-358` rejects authorization; an inverted range at lines `345-346` rejects; current scoped metadata lookup and fail-closed handling at lines `361-381` reject absent or not-ready current material. Pending OCR units are excluded at lines `369-380`.
- No defect found in the defense-only integration at `current-product-numbered.txt:385-421`. The gate runs before `_save_locked`, so a denial cannot create a draft or mutate `result.json`; the cached citation result avoids a second citation pass. The actionable error at lines `408-415` exposes a public material ID and location only, gives the `case_list_materials` -> name -> `case_read_material` recovery order, and does not expose the material name, draft content, or quoted private text.
- Existing behavior outside the AI defense-save path is preserved. Non-defense saves continue through the same `_save_locked` behavior at lines `416-421`; the UI save path at lines `458-473` still calls `_save_locked` directly, so manual saves are not newly gated. The cumulative diff otherwise changes only the import of `texts`, the helper, and citation caching.
- The fourteen public tests cover unread search hits and interval gaps at `same-fourteen-tests-numbered.txt:70-102`; other-task and old-version reads at lines `105-148`; positive current-version reads at lines `151-202`; unchanged non-defense behavior at lines `205-218`; DOCX paragraph and PDF page paths at lines `290-365`; budget carry versus completed/error non-carry at lines `368-446`; failed/inverted and pending-OCR boundaries at lines `452-583`; and public ID-to-name recovery at lines `586-679`. No missing test within this bounded scope is severe enough to require AMEND.

## Evidence Limits

- `actual-evidence.json` reports 14/14 passes on the fresh short owned root, after the earlier same-thirteen pass. The full-suite record remains 1351 passed, 18 failed, 8 errors, and 42 skipped, with no new failure keys and no full-pass claim.
- The Windows long-path temporary-path failure remains OPEN and is not waived. Excel-cell provenance, actual OCR/model/default-lifespan, GUI, Native write-denial recovery, factual/legal quality, and whole-service behavior remain separately unproven.
- The earlier source-job deadline/no-formal record is not converted into a process PASS. This review uses only the five supplied artifacts and does not expand that evidence.

## runtime0

No product, test, parser, model, HTTP, GUI, build, collection, or runtime command was run. No Git write or coordination-directory write other than this formal review file was performed.
