# T18 Grounding Main-Part Closure Handback

Status: AUTHORED_NOT_RUN

Scope:
- Updated `dsh-ext/agent/grounding-review.ts`.
- Updated `dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts`.
- Added this formal handback only.

Semantic corrections authored:
- When parts exist, the requested main material must occur exactly once.
- The top-level receipt name must exactly equal the requested main name.
- Identity absence or mismatch yields UNKNOWN (`null`), without name normalization.
- Without non-empty `more_names`, no unrequested part identity is accepted.
- With non-empty `more_names`, all required names remain required exactly once.
- An integer request end must be covered by both receipt end and the main part end.
- Existing ordered-producer, first-part, start-1, null-end, and flags checks remain.

Test corrections authored:
- Made the coherent positive case end at 1 across request, receipt, and main part.
- Added an in-group negative where receipt covers the request but the main part does not.
- Added an in-group unrelated clean-part negative expecting UNKNOWN and fragment notice.
- Kept the existing twenty blocks, seventeen neighboring tests, and old assertions intact.

Held constraints:
- Chunk cap, metadata 6000 behavior, coverage category, and identity limits are byte-held.
- No index, TaskState, SDK, Host, Skill, contracts, guard, model, temp, or budget changes.
- No semantic or legal PASS claim is made.
- No Node, Python, parser, test, build, HTTP, model, GUI, Git, metadata, hash, or discovery command ran.
- Git remained read-only; no add, commit, rebase, stash, reset, clean, checkout, or push occurred.
- Verification remains pending under the execution-order test ban.
