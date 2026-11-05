# B handback: full-regression safety credential-name guard

Status: **authored-not-run by B**.

## Fresh source path

`D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\SafetyCredentialFix-20261031-132544`

The directory contains `bootstrap.py` and `README.md`, each created as a byte
copy of its corresponding input from:

`D:\Lawbeach\lawbench-coord\FullRegressionSafetyCredentialInput-20261031-132544`

## Exact source delta

Only `_environment_has_prohibited_values` in `bootstrap.py` changed. Within its
existing loop, after the existing empty-value check and before the existing
proxy matcher, the following single guard was added:

```python
        if upper == "KEY" or upper.endswith("_KEY"):
            return True
```

`upper` is the predicate's existing `name.upper()` value. This additionally
rejects environment names equal to `KEY` or ending in `_KEY`, including
`LAWFIRM_KEY` and `EXTERNAL_LLM_KEY`. All existing `TOKEN`, `PASSWORD`,
`SECRET`, proxy, credential-word, and credential-like-name matchers remain.
No secret value or environment content was read. No credential name was
whitelisted, and no other function, guard, allowlist, source, or test was
changed.

`README.md` documents this single correction and the fresh path while retaining
the prior safety contract and known limitations.

## Evidence and execution state

- This is source for root review, not red/green test evidence.
- B ran no Python, import, AST/parser, assertion, collection, build, test,
  service, product, model, HTTP, GUI, or application command.
- B read no environment variables or credential values and started/accessed no
  service or real credentials.
- No product source or test source was executed or changed.
- No full-service pass is claimed.
- Git was used read-only in effect; B performed no add, commit, rebase, stash,
  reset, clean, checkout, or push.
- Existing dirty working-tree content was preserved; this task created only the
  fresh evidence directory and this coordination handback.

## Root handoff

The relevant prior failure is the root guard control recorded in:

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs/full-regression-service-safety-controls-current.json`

Root should fingerprint the entire fresh source files, confirm that the only
`bootstrap.py` byte delta is the guard above, review the README, and then
repeat the guard controls only in a fresh private root after the whole-byte
inverse. Do not treat this handback as runtime validation or a test result.
