# HANDBACK-B-T18BoundedReadContextClosure

Status: AUTHORED_NOT_RUN

Runtime checks: runtimeZERO

## Scope completed

Modified only:

`D:\Lawbeach\lawbench-B\service\tests\test_read_bound_20261101_114236.py`

The bounded test now:

- removes the invalid `MaterialStore` and `TaskStore` imports;
- reads coverage through `env.client.app.state.lb.tasks.coverage(str(env.root), env.case_id, task_id)`;
- deep-copies that existing coverage result;
- verifies the selected material is not in `coverage["fully_read"]`, requires exactly one matching partial row, and returns its real `read_units`;
- passes the exact existing `LONG_FILE` and `RANGE_FILE` names to the corresponding partial-count assertions;
- binds the direct-read test to `txt_env.client.app.state.lb.tasks` and `.materials`, loads the task through `txt_env.read_json(task_id, "task.json", "files/task.schema.json")`, passes `root=str(txt_env.root)`, and calls coverage with the existing case/task arguments.

All behavior assertions and public calls were preserved.

## Root rejection disclosed

Before runtime, Root statically rejected the original test's invented `MaterialStore`/`TaskStore(root)` construction, `tasks.get` call, and `coverage(task_id)` signature. No attempt was made to run code using those incorrect bindings.

## Verification boundary

Per the execution order, Python, Node, parser, pytest, checks, builds, prepare-execution, model calls, HTTP, GUI, self-tests, discovery, and all other verification were not run. This handback makes no runtime-pass claim.

No Git mutation, staging, commit, rebase, stash, reset, clean, checkout, or push was performed.

## Final target identity

- Size: 8790 bytes
- SHA-256: `AF0C24F636BC50248B22B87EECD854A110C8BD9A26DEA58A342D50B744F23088`
