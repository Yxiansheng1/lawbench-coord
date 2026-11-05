# HANDBACK A - T18 Grounding Repair Feasibility

Status: BLOCKED

Recommendation: do not patch the product for this run. The allowed Native Session public surface cannot start an independent, context-isolated claim-support review or self-check review inside the existing R without creating a new request/persisted prompt or reusing the original model context. Add/obtain a public task-scoped nested-review primitive before implementation.

## Exact source evidence

- Public client entry: `dsh/packages/api/session-controller/src/client/sessions/session.ts`
  - `beginSubmission` mints a new `requestId` and registers a user-visible submission echo: lines 229-245.
  - `prompt(content, 'queue' | 'steer', ...)` sends new prompt content to the Session remote with that request id: lines 256-305. Queue/steer changes scheduling, not request or context isolation.
  - `command` is a slash-command admission path, not a general nested model-review API: lines 384-395.
  - `cancel`, history paging, snapshots, and manager relays expose no isolated in-turn model execution: lines 351-395 and 397-615.
- Host controller: `dsh/packages/api/session-controller/src/agent.ts`
  - `resolveAgent` can return an existing live `Agent`: lines 171-183 and 401-407.
  - The controller exposes model selection (`selectionFor`, `selectForNextRequest`) but no method here that executes an isolated model call: lines 280-355.
- Existing in-turn message injection: `dsh-ext/agent/index.ts`
  - `preStep` appends notices to the same `decision.messages` array: lines 366-514, especially 506-514.
  - The public hook supplies the current Agent loop to `LegalAgent.preStep`: lines 865-866.
  - `notice()` creates another user-role message in that same conversation: lines 83-86.
  - `request()` can change provider/model/effort/max tokens but has no history or context partition: lines 537-564.
- Budget accounting: `dsh-ext/agent/task-state.ts`
  - Every admitted Agent-loop model call increments `modelCalls` and enforces the task budget: lines 204-226.
  - Tool admission increments `toolCalls`; `case_save_draft` is deliberately budget-exempt: lines 29-34 and 435-452.
  - Existing same-session continuation therefore stays under one `TaskState`, but context isolation remains unavailable.
- Draft save, question gate, and coverage path: `dsh-ext/agent/index.ts`
  - `case_save_draft` is question-gated before the core call: lines 247-248 and 636-641; the direct-execute guard is lines 685-709.
  - A successful validated save sets `draftSaved`, records citation problems, and captures coverage: lines 685-726, especially 720-725.
  - Citation feedback and delivery-review notices are queued for the next model call, not executed by an independent reviewer: lines 492-511.
  - `DRAFT_FEEDBACK_NOTICE` asks the same model to inspect citation problems: lines 224-229.
  - `DELIVERY_REVIEW_NOTICE` asks the same model to self-check: lines 230-234.
  - Coverage is explicitly not evidence of factual, dispute, or legal verification: lines 157-190, especially 162-190.
- Review state: `dsh-ext/agent/task-state.ts`
  - Question completion is only `missingQuestionIds().length === 0`: lines 276-286 and 384-386.
  - Citation feedback is one shared-context notice: lines 388-403.
  - Delivery review is one queued notice plus optional coverage snapshot, not a separate review result: lines 405-427.
- Task identity/budget boundary: `dsh-ext/agent/index.ts`
  - Step 1 of a new prompt calls `task/begin` and creates a fresh `TaskState`: lines 382-462.
  - Therefore using `Session.prompt` for review starts a new request/task and does not preserve the original 32-model/48-tool accounting.

## Smallest file/function map

No safe write face exists under the stated constraints.

- `session.ts`: `Session.prompt` is the only exposed way to add new model-directed content, but it creates a new durable request.
- `index.ts`: `LegalAgent.preStep` is the only existing same-R continuation seam; it can append a notice but cannot create an isolated reviewer.
- `task-state.ts`: `TaskState.beforeModelCall` already provides correct same-task budget tracking for any future in-turn review call.
- `LegalAgent.executeTool`/`TaskState.noteSuccessfulDraftForDeliveryReview` already provide the exact post-save trigger and finite coverage snapshot; they do not provide independent reasoning.

## Required capability before repair

A public API would need to execute a model invocation attached to the current task/R with:

- caller-supplied, isolated review context rather than the full original conversation;
- explicit tool allow-list and model/token limits;
- results returned as structured review data without appending a user prompt or durable fake history;
- accounting through the current `TaskState` budget.

An SDK upgrade or approved separate Native Session could supply this, but both are outside this order.

## Validation

Source-only feasibility inspection completed against the four capsule-listed files. No product edit, runtime, test, build, HTTP, model, probe, or Git operation was performed, as required. Runtime feasibility was not exercised because the public-path capability is absent at source level.

## Risks

- Reusing `preStep` notices as the reviewer would keep original context and model, so it is not independent and risks confirmation bias on date/source mismatch.
- Treating `citation_check.problems`, coverage, or a PASS label as self-check completion would preserve the observed false-support failure.
- Calling `Session.prompt` would create a new R/user history and reset or bypass the original task budget.

