# C-line source review handback

**Decision:** ACCEPT the proposed source binding as justified parameter synchronization for the original unclosed NativeHTTP resource.

The capsule identifies only two expected source substitutions in each native server: the contract check changes from `"1.6"` to `"1.7"`, and the diagnostic label changes from `contract_version_not_1_6` to `contract_version_not_1_7`. The surrounding version import, startup guard, listener checks, ready-file write, and all other original functions are stated to remain byte-identical. The reviewed original server context is tied to SHA-256 `2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd` and `30dc704d919bf8a242d3a4e5a75f19866da66dcbff8cee8c57ae754cca3cd62f`. Both existing consumer sources exercise the actual CoreClient boundary and remain part of the supplied closure.

Because both contract version files now report `1.7`, retaining the old exact `1.6` gate would leave the resource unable to start against the current contract. Synchronizing those two literals is therefore necessary and narrower than changing validation behavior. It does not authorize cloning the guard, weakening or removing a guard, rerouting requests, or changing authorization, setup, cleanup, or deny paths. The existing whole-server reviews are accepted for the original source only; this decision does not reopen them.

**Condition:** Root must later perform the conditional whole inverse verification before treating this as a whole-source or quality result. That verification must establish that exactly those two literals changed in each proposed source, every other original byte and protected function remained unchanged, the imported contract version is `1.7`, and the supplied hashes and actual `case_read_material.schema.json` remain the operative inputs.

This handback is source-review-only. No runtime, test, build, parser, HTTP probe, model call, credential access, or GUI action was authorized or performed. It is not a runtime-permission grant and is not a PASS for whole implementation quality.
