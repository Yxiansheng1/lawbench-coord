# T31 small GUI scope service source handoff

Status: SOURCE COMPLETE. Runtime NOT RUN. This is not a passing test or an
acceptance claim.

## Delivered sources

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 45580 | `4bcdce13b654b6bd8f4e4378b3a313057b727e1f5d0069de9ea13f5628e08b3a` |
| `scope-a.txt` | 37 | `0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8` |
| `scope-b.txt` | 37 | `3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91` |
| `scope-c.txt` | 39 | `5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439` |

The three fixtures contain only distinct ASCII software markers. They contain
no person, legal, user, credential, or case data.

## Composition

`entry.py` verifies the pinned original canonical entry's bytes and SHA, loads
its unchanged bytes in a private namespace whose `__name__` is non-main, and
sets only `EVIDENCE_ROOT` and `RUNS_ROOT` to its own directory. Canonical
safety-base loading, admission/source guards, layout, CaseRegistry helpers,
application creation, and loop helpers remain unchanged.

The adapter supplies only the new explicit behavior required by the order:

- Decimal loopback host and forward ports are captured and validated before
  the original environment scrub. The forward port must be 10000..65535,
  distinct from the API port, and outside the reserved 65001..65005/18765 set.
- `--admit` calls the original admission/registry flow first, then copies the
  three pinned fixtures with exclusive `xb` creation into `run/scope-source`
  and verifies source and copy identities.
- The approved policy file is verified at its pinned SHA and loaded without
  modification. Its returned Firewall subclass is the only base of the
  evidence subclass. The subclass calls the approved base implementation
  unchanged, then verifies the actual native material index.
- A real HTTPX sync/async transport refuses before socket creation and records
  bounded methods and paths as `EXPECTED_MODEL_BOUNDARY_REFUSALS`. Unexpected
  guard events are not suppressed.
- The original native API and original `forward_app` run on owned loopback
  listeners. The API uses `lifespan=off`; the forward app uses
  `lifespan=on`. Ready metadata appears only after both ports are verified.
- Successful imports and reads produce `scope-evidence.json` from actual
  product facts. Public material responses omit SHA, so
  `materialResponseVerified` remains false; `nativeIndexBindingVerified` is
  true only after three actual ref-backed, parsed, distinct rows match the
  pinned names and SHAs and the binder is called once.
- Final metadata records source-case, old-target-log, fixture, listener,
  cleanup, guard, transport, inventory, and actual TaskStore observations.
  It does not rewrite task or history data and does not construct request,
  session, result, UUID, callback, or JSONL records.

## A-line integration

Copy `entry.py` byte-for-byte to:

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218\entry.py`

Keep the frozen SDK, private-25, legacy-18, and canonical helpers unchanged.
The A-line integration changes only the self root, entry pin, owned forward
port, and literal-prefix expected hash. The data-only launcher should provide
a Root-owned literal port and the law-firm URL using the same port. Do not
create a new runtime build.

## Verification record

Only four read/metadata commands ran. There were zero nonzero command exits.
No Python import, AST/parser probe, test, build, preparation run, GUI, HTTP,
model, credential, Keyring, socket, or service runtime was started. The
canonical and policy source pins were read and matched the approved byte
counts and SHA-256 values. Git was read-only; status showed only this new
directory as untracked. Nothing was staged, committed, rebased, reset,
checked out, stashed, cleaned, or pushed.

Root still owns source review, actual GUI execution, OS/Windows observations,
native task/session/JSONL inspection, model-refusal review, full-packet
closure, and every T31 acceptance decision.
