# T18 Grounding Receipt/Title/Metadata Closure Handback

Status: SOURCE_CHANGE_COMPLETE__PENDING_ROOT_FINITE_TESTS

## Scope

Only the existing grounding-review helper and its existing native-grounding test file were
changed. The current index integration, TaskState, SDK, Skill, Host, and public contracts were
not changed. Existing source files and old red/qualified evidence were left untouched.

## Changed functions and behavior

- `captureRead` now retains receipt read scope separately from text-copy completeness and
  parts-shape completeness.
- `read_complete` is a tri-state signal (`true`, `false`, or `null` for unavailable scope).
  It accounts for top-level `start`, `end`, `has_more`, `next_start`, and `next_offset`, plus
  every returned part's `read`, `start`, `end`, `has_more`, `next_start`, and `error`.
- `reviewPayload` includes explicit `read_complete`, `metadata_complete`, and `path_complete`
  fields. Its scope note distinguishes a bounded receipt from whole-case coverage.
- `noticeFor` reports returned-fragment limitations without changing the separate saved
  coverage judgment. Partial bounded receipts therefore do not falsely downgrade complete
  saved coverage.
- `draftAnchorIsAuthentic` accepts a `draft_quote` only when it is an exact substring of the
  saved title or the saved content. It never joins those fields with a synthetic separator.
- `requestCopy`, `materialReceipt`, `wikiReceipt`, and `materialParts` now use small explicit
  mappings for the actual validated read schemas instead of unbounded structured cloning.
- Request strings, receipt identities, material-part strings, and the saved path have
  per-field caps. Retained source metadata has per-receipt and aggregate caps.
- When a metadata cap is exceeded, the affected metadata is omitted as unavailable and marked
  incomplete; identity strings are never silently truncated or presented as complete.
- `reviewPayload` enforces a finite total payload cap before any reviewer call. A cap failure
  returns an explicit unavailable notice rather than escaping the Agent workflow.
- The exact source-text cap, anchor binding, two-call model flow, model, temperature, budget,
  first-save rule, task/source isolation, and old assertions remain in place.

## Added tests

- A successful top-level continuation plus an unread part is marked `read_complete:false`,
  while a bounded `start > 1` receipt with no later `has_more` is also marked as a fragment.
- A title-only `draft_quote` is accepted; a quote made by joining title and content with a
  newline is rejected even though both source fields separately exist.
- Oversized request, receipt, part, and path metadata are omitted and explicitly marked
  incomplete without entering the payload.
- Eight individually bounded receipts trigger the aggregate metadata cap and the explicit
  read-scope-unavailable limitation without throwing from the Agent workflow.

The original thirteen test blocks remain present. Only three additional test blocks were added.

## Verification limits

No Node, Python, parser, checker, test, build, prepare, server, HTTP, model, GUI, Key, runtime,
or Git command was run for this handback. No test-pass claim is made.

The private build-preparation/source evidence is now stale after this repair and was not edited
or run here. Root must refresh literal pins and run the finite tests and independent cumulative
acceptance through a separate source job.
