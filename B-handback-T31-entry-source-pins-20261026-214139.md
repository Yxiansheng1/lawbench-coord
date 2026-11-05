# B handback: T31 entry source pins

Status: `DELIVERED_STATIC_TWO_LITERAL_UPDATE`; runtime and GUI `NOT_RUN`.

Only `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py` was edited. The two literals now read:

```text
SOURCE_PINS = r"D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json"
SOURCE_PINS_SHA256 = "da2763bc9e723bb31baced46c608b70dc696b57ae3f426c0be6580af4e6b906f"
```

Fixed input manifest SHA-256 measured by `Get-FileHash`: `DA2763BC9E723BB31BACED46C608B70DC696B57AE3F426C0BE6580AF4E6B906F` (exit `0`). Entry file SHA-256 changed from `10C3A8FB366D340624ACCDB8313742A3219230DDA98DF0A902C955D0CAEF8EE4` to `19862F3388F8B761FCC188DDE4614E87E70172F76A9D4399A464A01668E85E4A`.

Actual checks:

```powershell
rg -n -F "T31BEntrySourcePinsInput-20261026-214139" "docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py"
rg -n -F "da2763bc9e723bb31baced46c608b70dc696b57ae3f426c0be6580af4e6b906f" "docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py"
```

Exit `0` for both; matches at lines 46 and 49.

```powershell
rg -n -F "T31ScopeHttpInput-20261026-031523" "docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py"
rg -n -F "7c3cf7cda3632f2bb1f05fa69bdebb5b1fa40806bf710bec4e6293d864bdb18e" "docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py"
```

Exit `1` for both with no output; old path and old hash are absent.

```powershell
git status --short
```

Exit `1`: `dsh` submodule chdir permission denied. No lock or permission repair was attempted.

```powershell
git --no-optional-locks status --short --ignore-submodules=all
```

Exit `0`; existing dirty state was preserved.

`NOT_RUN`: runtime, GUI, prepare, serve, probe, HTTP, model, Node, Python, Vitest, tsc, pytest, parser, AST, tests, collection, self-check, build, old-20 rerun, packaging, and all Git writes. No commit was made. Evidence: `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\source-pins-20261026-214139.md`.
