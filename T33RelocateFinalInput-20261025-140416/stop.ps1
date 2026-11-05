[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsRoot = [IO.Path]::GetFullPath('D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs')
if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsRoot.TrimEnd('\') -or
    $rootFull -notmatch '\\T33-host-[0-9]{8}-[0-9]{6}$') {
  throw "refusing non-T33 run root: $rootFull"
}

$StateDir = Join-Path $rootFull 'gui\state'
$StatePath = Join-Path $StateDir 'current.json'
$StopRequestPath = Join-Path $StateDir 'stop-request.json'
$StopReportPath = Join-Path $StateDir 'stop-report.json'
$FallbackReportPath = Join-Path $StateDir 'stop-report-fallback.json'
if (-not (Test-Path -LiteralPath $StatePath -PathType Leaf)) {
  throw "no T33 GUI state: $StatePath"
}

function Write-JsonNoBom([string]$Path, $Value) {
  $temporary = "$Path.tmp-$PID"
  $Value | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $temporary -Encoding utf8NoBom
  Move-Item -Force -LiteralPath $temporary -Destination $Path
}

function Get-ExactIdentity([int]$TargetPid) {
  $process = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
  if (-not $process) { return $null }
  try {
    $commandLine = ''
    try {
      $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $TargetPid" -ErrorAction Stop
      if ($cim) { $commandLine = [string]$cim.CommandLine }
    } catch {}
    return [pscustomobject]@{
      pid = $process.Id
      executablePath = [IO.Path]::GetFullPath($process.Path)
      startTimeUtcTicks = [string]$process.StartTime.ToUniversalTime().Ticks
      commandLine = $commandLine
    }
  } catch {
    return $null
  }
}

function Test-ExactRecord($Record) {
  $current = Get-ExactIdentity ([int]$Record.pid)
  if (-not $current) { return $false }
  try {
    return (
      $current.executablePath -ieq [IO.Path]::GetFullPath([string]$Record.executablePath) -and
      [string]$current.startTimeUtcTicks -eq [string]$Record.startTimeUtcTicks -and
      $current.commandLine.IndexOf([string]$Record.marker, [StringComparison]::OrdinalIgnoreCase) -ge 0
    )
  } catch {
    return $false
  }
}

function Stop-ExactRecord($Record) {
  if (-not (Test-ExactRecord $Record)) { return $false }
  Stop-Process -Id ([int]$Record.pid) -Force -ErrorAction Stop
  return $true
}

function Test-PortClosed([int]$Port) {
  if ($Port -le 0) {
    return [pscustomobject]@{ closed = $false; verified = $false; reason = 'port_not_recorded' }
  }
  if (-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)) {
    return [pscustomobject]@{ closed = $false; verified = $false; reason = 'Get-NetTCPConnection_unavailable' }
  }
  try {
    $listeners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    return [pscustomobject]@{ closed = ($listeners.Count -eq 0); verified = $true; reason = '' }
  } catch {
    return [pscustomobject]@{ closed = $false; verified = $false; reason = $_.Exception.Message }
  }
}

function Wait-SupervisorExit($Record) {
  $deadline = (Get-Date).AddSeconds(5)
  while ((Test-ExactRecord $Record) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 100
  }
  return -not (Test-ExactRecord $Record)
}

$state = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
if ($state.runRoot -ine $rootFull) { throw 'state runRoot mismatch' }
$processRecords = @($state.processes)
$supervisorRecord = $state.supervisor
$nativePort = [int]$state.nativePort

if (Test-Path -LiteralPath $StopReportPath -PathType Leaf) {
  $existing = Get-Content -Raw -LiteralPath $StopReportPath | ConvertFrom-Json
  $existing | ConvertTo-Json -Depth 10
  if ($existing.remainingPids.Count -eq 0 -and [bool]$existing.portClosed -and (Wait-SupervisorExit $supervisorRecord)) { exit 0 }
  exit 1
}

if (Test-ExactRecord $supervisorRecord) {
  if (-not (Test-Path -LiteralPath $StopRequestPath)) {
    Write-JsonNoBom $StopRequestPath ([ordered]@{
      requestedAt = (Get-Date).ToUniversalTime().ToString('o')
      requesterPid = $PID
      runRoot = $rootFull
    })
  }
  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline) {
    if (Test-Path -LiteralPath $StopReportPath -PathType Leaf) {
      $report = Get-Content -Raw -LiteralPath $StopReportPath | ConvertFrom-Json
      $report | ConvertTo-Json -Depth 10
      if ($report.remainingPids.Count -eq 0 -and [bool]$report.portClosed -and (Wait-SupervisorExit $supervisorRecord)) { exit 0 }
      exit 1
    }
    if (-not (Test-ExactRecord $supervisorRecord)) { break }
    Start-Sleep -Milliseconds 250
  }
}

$freshState = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
$processRecords = @($freshState.processes)
$nativePort = [int]$freshState.nativePort
$rootRecord = $processRecords | Where-Object role -eq 'electron' | Select-Object -First 1
if ($rootRecord -and (Test-ExactRecord $rootRecord)) {
  $rootProcess = Get-Process -Id ([int]$rootRecord.pid) -ErrorAction SilentlyContinue
  if ($rootProcess) {
    try { [void]$rootProcess.CloseMainWindow() } catch {}
    $graceDeadline = (Get-Date).AddSeconds(12)
    while (-not $rootProcess.HasExited -and (Get-Date) -lt $graceDeadline) {
      Start-Sleep -Milliseconds 250
      $rootProcess.Refresh()
    }
  }
}

$stopped = [Collections.Generic.List[int]]::new()
$pythonForced = $false
$ordered = @($processRecords | Sort-Object {
  switch ($_.role) {
    'native-service' { 0 }
    'python-helper' { 1 }
    'sidecars' { 2 }
    'node-child' { 3 }
    'host' { 4 }
    'electron-child' { 4 }
    'electron' { 5 }
    'relay' { 6 }
    default { 7 }
  }
})
foreach ($record in $ordered) {
  if ($record.role -eq 'supervisor') { continue }
  try {
    if (Stop-ExactRecord $record) {
      $stopped.Add([int]$record.pid)
      if ($record.role -eq 'native-service') { $pythonForced = $true }
    }
  } catch {
    Write-Warning "exact stop refused for PID $($record.pid): $($_.Exception.Message)"
  }
}
$remaining = @()
$portCheck = [pscustomobject]@{ closed = $false; verified = $false; reason = 'not_checked' }
$settleDeadline = (Get-Date).AddSeconds(10)
do {
  $remaining = @($processRecords | Where-Object {
    $_.role -ne 'supervisor' -and (Test-ExactRecord $_)
  } | ForEach-Object pid)
  $portCheck = Test-PortClosed $nativePort
  if ($remaining.Count -eq 0 -and $portCheck.closed) { break }
  Start-Sleep -Milliseconds 250
} while ((Get-Date) -lt $settleDeadline)
$fallback = [ordered]@{
  stoppedAt = (Get-Date).ToUniversalTime().ToString('o')
  reason = 'fallback-exact-stop'
  processRecords = $processRecords
  stoppedPids = @($stopped | Select-Object -Unique)
  remainingPids = $remaining
  nativePort = $nativePort
  portClosed = [bool]$portCheck.closed
  portVerificationAvailable = [bool]$portCheck.verified
  portVerificationError = [string]$portCheck.reason
  pythonForcedStop = $pythonForced
  pythonCleanupClaimed = $false
}
Write-JsonNoBom $FallbackReportPath $fallback
$fallback | ConvertTo-Json -Depth 10
if ($remaining.Count -eq 0 -and $portCheck.closed) { exit 0 }
exit 1
