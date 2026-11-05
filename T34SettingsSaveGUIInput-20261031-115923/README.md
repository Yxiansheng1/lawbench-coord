# T34 enabled SETTINGS GUI source bundle

Status: `SOURCE_ONLY_PREPARED_NOT_RUN`. This bundle is not a T34 PASS.

## Scope

This scenario checks one narrow behavior: the current Settings page reads an
already-enabled synthetic B setting through the genuine service GET, then the
current UI projects that setting through the original native Settings SET and
renders the enabled state, model, and context window.

The synthetic values are:

- `enabled=true`
- `base_url=http://127.0.0.1:65005/v1`
- `model=t34-enabled-ui-synthetic`
- `context_window=32768`
- `supports_tools=true`

The original required-unset seed is only the stale initial private-native
route. The enabled UI is required to overwrite it with
`t34-enabled-ui-synthetic`; this bundle does not claim that the old seed prefix
remains unchanged after that projection. The source labels and
`literal-inputs.json` retain inherited metadata and are not observations from
this scenario.

This does not exercise a real Key save, privacy consent, a switch of the task
route to an external service, model execution, or Send. The task route remains
local by default. No credential, production profile, external service, or
model request is introduced.

## Source boundary

`prepare.ps1`, `entry.py`, `start.ps1`, and `stop.ps1` contain only the approved
literal scenario substitutions, self-relocation, exact synthetic settings
guards, and the relocated `entry.py` SHA-256 pin. The five observer and binding
helpers remain byte-identical to the accepted source baseline. Existing
watchdogs, cleanup, outbound controls, fixture/case roots, current-25 inventory,
and SDK pins remain otherwise unchanged.

No build is required. The current compiled client `8d9cea` and current
`settings.tsx` source `00cb7` remain the runtime/source pair under observation.
The original helper counts and `acceptanceProof=false` remain diagnostic only;
this bundle adds no observer or classifier and does not turn them into a PASS
signal.

## Execution status

The author ran no prepare, admission, start, GUI, stop, Node, Python, parser,
test, build, HTTP, model, or credential operation. Actual settings rendering is
`NOT RUN`; `realKey`, `privacyConsent`, `SystemStore`, model, and all-T34 are
not claimed as PASS.

The approved literal rules leave the original `start.ps1`
`$NativeEntryBytes = 88651` pin unchanged while requiring the relocated
`entry.py` SHA-256 to be replaced. Because the enabled-settings literals change
`entry.py`, ROOT must review this static preflight inconsistency before any
fresh GUI run; it is not repaired by this source-only author.
