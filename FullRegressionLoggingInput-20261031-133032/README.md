# Full-regression safety credential-name guard source correction

Status: **source correction authored by B, not executed or source-validated by
B**. This directory contains source for root review; it is not a red or green
test result. The root operator must fingerprint the sources, review this
safety contract, and monitor the exact child PID before running it.

## Files

- `bootstrap.py` — corrected root-only source and runtime safety boundary.
- `README.md` — this contract and known limitations.

No product source, test source, `conftest.py`, SDK, old served/sealed evidence,
or Git content was changed.

## Correction delta

This artifact preserves every byte outside the existing
`_environment_has_prohibited_values` predicate of the input baseline in
`D:\Lawbeach\lawbench-coord\FullRegressionSafetyCredentialInput-20261031-132544\bootstrap.py`.
The one source change is that an environment variable name equal to `KEY` or
ending in `_KEY`, case-insensitive through the predicate's existing `upper`
normalization, now returns `True`. This includes `LAWFIRM_KEY` and
`EXTERNAL_LLM_KEY`.

All existing `TOKEN`, `PASSWORD`, `SECRET`, proxy, credential-word, and
credential-like-name matchers remain in place. No secret value was added or
read, and no credential name was whitelisted. The original
input and existing evidence directories remain untouched; the
`SafetyCredentialFix-20261031-132544` directory is new.

No other safety contract, test selection, budget, cleanup rule, or source block
was intentionally changed.

## Invocation

The private root must already exist and be empty. The JUnit path must be an
absolute child that does not yet exist.

```powershell
python .\docs\plan\evidence\FullRegression\SafetyCredentialFix-20261031-132544\bootstrap.py `
  --private-root 'C:\lb-fullreg-20261031-130847' `
  --junit 'C:\lb-fullreg-20261031-130847\junit.xml'
```

The runner fixes the source to `D:\Lawbeach\lawbench-B\service`, changes to
that directory, and invokes the original `pytest.main` against the complete
`tests` directory. It does not use a test-pattern or file glob. It passes:

```text
--ignore=D:\Lawbeach\lawbench-B\service\tests\test_t37_refs.py
-p no:cacheprovider
--basetemp=<private-root>\pytest-basetemp
--junitxml=<absolute-junit-child>
```

Plugin autoload is disabled with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`. All other
pytest defaults and configuration remain original.

`test_t37_refs.py` is the one explicit original exclusion. Both runtime and
collection are forbidden by the dispatch order; its separately accepted
standalone evidence remains authoritative. Therefore the result must never be
called a full-service PASS, even if every non-excluded test passes.

## Boundary order

Before pytest imports a product module, the bootstrap:

1. Requires the private root to be an existing, empty absolute directory.
2. Rebuilds a minimal environment with no proxy or credential values.
3. Places `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`, and
   `TMPDIR` under the private root.
4. Installs a fail-closed filesystem audit and file-descriptor guard.
5. Restricts socket connect, bind, send, connection helpers, and host-name
   lookup to numeric loopback or `localhost`.
6. Replaces keyring read/write/delete with denial functions and records only
   aggregate denial counts.
7. Replaces the Python subprocess entry point with a narrow allowlist.
8. Disables `os.system`, `os.popen`, spawn/exec APIs, and `os.startfile`.

The root summary is written even when pytest returns a failing or interrupting
exit code. It records the pytest exit, elapsed time, effective arguments,
excluded original file, denial totals/categories, and the fact that B did not
claim a full-service pass. It records no material, query, request, credential,
or environment values.

## Filesystem contract

Python's audit API is used before write, create, delete, rename, link, truncate,
and metadata mutation. A path is accepted only when it is absolute, resolves
strictly below the private root, and does not escape by symlink or junction.
Source and dependency files remain read-only. `open`/`os.open` integer flags
and ordinary file descriptors are checked; unknown regular-file descriptors
are denied. Guard failures raise `SafetyBlocked`; they are never returned as
success.

The sole device exception remains the exact OS null device. It is a character
device rather than a private-root regular file, so writable opens and
descriptor tracking recognize that exact target without weakening the path
rule for any other device or filename.

The private root and its children are intentionally retained for root review.
The runner performs no broad cleanup.

## Network and keyring contract

Only numeric loopback addresses and `localhost` are accepted. Non-loopback DNS
lookup is denied before resolution. Loopback fake HTTP servers used by the
original tests remain functional. Keyring `get_password`, `set_password`,
`delete_password`, and credential-backend access fail closed; tests must inject
their own fake getter.

This is an environment boundary, not a claim that the product has zero real
backends. Denied tests remain denied/red in JUnit.

## Subprocess allowlist

The allowlist is intentionally narrower than the product's capabilities:

- the current Python interpreter with exact synthetic inline snippets used by
  original tests;
- `tests/fake_com_worker.py`;
- private-root synthetic scripts named exactly `invoke.py` (inside a `scripts`
  directory), `kill.py`, or `peak.py`, with all absolute file arguments under
  the private root or the fixed service source;
- two exact private-root batch fixtures: `fake_soffice.cmd` and `crash.cmd`;
- fixed Program Files LibreOffice `soffice.exe`, only headless conversion with
  private profile/input/output and no print options;
- fixed Program Files `pandoc.exe`, stdin/stdout conversion only;
- read-only `tasklist` PID query;
- tree termination with the exact four-argument shape enforced by this source,
  only for a live PID launched by this bootstrap;
- read-only `git check-ignore service/lawbench/llm/tokenizer.json` from the
  repository root.

Production `python -m lawbench`, source-engine executables under `engines\`,
Retainer/OCR engine launches, invoice engine launches, arbitrary shells, RunAs
style options, untracked `taskkill`, and arbitrary executables are rejected
before process creation. Child environments containing proxy or credential
variables are rejected.

Expected environment-blocked surfaces therefore include the full service
startup tests, real Retainer driver tests, real invoice-engine scenarios, and
other source-engine launch paths. They are not relabeled green and their
assertions are not weakened.

## Known limitations requiring root judgment

- Python audit hooks do not mediate writes performed directly by native
  libraries (for example SQLite's C implementation) or by an allowed child
  process. The private environment, private test inputs, fixed tool allowlist,
  and the native managed sandbox remain additional containment layers; the
  bootstrap does not claim complete native-write mediation.
- Allowed child processes do not inherit Python audit hooks. Synthetic worker
  code and LibreOffice/Pandoc execution are therefore trusted under the narrow
  command and argument checks above.
- APIs implemented only through `ctypes` or COM cannot be comprehensively
  intercepted at the Python layer. No test outside the allowlist is silently
  converted to a skip or pass.
- Source fingerprinting and exact PID/exe/birth/port monitoring belong to the
  root operator and are not performed by this bootstrap.
- If any required invariant above is judged insufficient, do not run this
  artifact; return it for source revision.
- B did not run the corrected source or any self-check. Without root's
  independent source review and isolated controls, this artifact establishes
  neither runtime safety nor green tests and must not be described as a
  full-service PASS.
