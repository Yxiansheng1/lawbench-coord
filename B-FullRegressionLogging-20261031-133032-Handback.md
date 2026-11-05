# B handback: full-regression pytest log path correction

Status: **SOURCE_CORRECTION_AUTHORED; RUNTIME_NOT_RUN_BY_B**.

Dispatch:

`D:\Lawbeach\lawbench-coord\ORCH-B-FullRegressionLogging-20261031-133032.md`

Deliverable directory:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\SafetyLoggingFix-20261031-133032\`

Files:

- `bootstrap.py`
- `README.md`

The two files were created as byte copies of the dispatched input baseline,
then changed only where the dispatch required.

## Source changes

1. In the existing `pytest_args` list, added exactly:

   `f"--log-file={root / 'pytest.log'}"`

2. In the root summary, renamed `logs_opened` to the narrower
   `bootstrap_owned_log_handles`, retained its empty value without claiming
   that pytest/product handles are absent, and added
   `pytest_log_path=str(root / "pytest.log")`.

3. `README.md` now explains the actual initialization failure, the fresh
   private-root requirements, the explicit pytest log output, the narrowed
   summary fields, and the unchanged limits.

No test filter, assertion, test lifecycle, function, guard, allowlist, exact
tests-directory selection, T37 exclusion, JUnit path, or failure-preservation
behavior was changed. No product, test, `conftest.py`, SDK, dependency, or
existing evidence file was changed.

## Failure context

The earlier real pytest launch was stopped during initialization before
collection or test execution. pytest created a default `_FileHandler` for
`os.devnull`; stdlib normalization turned it into the absolute source-device
alias `D:\Lawbeach\lawbench-B\service\nul`. The guard correctly rejected that
path because its null-device exception remains limited to the exact bare
device name. The launch exited 3, no JUnit report was produced, and no tests
ran. The fix redirects pytest's own log to
`<fresh-private-root>\pytest.log`; it does not weaken the null-device or path
guards.

## Verification boundary

B did not run Python, import or parse source, collect tests, execute pytest, or
perform a source self-check. No model, service, credential, network, GUI, or
HTTP call was made. The only verification available from this handback is the
source review described above; this is not a red or green test result and must
not be called a full-service PASS.

Root should independently verify the whole-file byte inverse and frozen
functions, then perform the one authorized real pytest launch in a new, empty
private root. Prior private roots and runtime evidence must not be reused.

## Git

No Git write operation was performed. This handback is a coordination-file
return, not a commit.
