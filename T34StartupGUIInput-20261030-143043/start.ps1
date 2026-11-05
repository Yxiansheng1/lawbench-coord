[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$RunRoot,
  [ValidateRange(1, 600)][int]$LifetimeSeconds = 600,
  [string]$LaunchSpecPath,
  [switch]$OwnedSupervisor
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-JsonNoBom([string]$Path, $Value) {
  $temporary = "$Path.tmp-$PID"
  $Value | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $temporary -Encoding utf8NoBOM
  Move-Item -Force -LiteralPath $temporary -Destination $Path
}

function Protect-RelayLogLine([AllowEmptyString()][string]$Line) {
  return [regex]::Replace($Line, '\A(dsh web: http://127\.0\.0\.1:[0-9]+/\?token=)([A-Za-z0-9_-]+)(\r?\n?)\z', '${1}[REDACTED]${3}')
}

function Invoke-ProcessRelay([string]$SpecPath) {
  $spec = Get-Content -Raw -LiteralPath $SpecPath | ConvertFrom-Json -AsHashtable
  $stdoutLog = [string]$spec.stdoutLog
  $stderrLog = [string]$spec.stderrLog
  $handoffPath = [string]$spec.handoffPath
  foreach ($logPath in @($stdoutLog, $stderrLog, $handoffPath)) {
    $parent = Split-Path -Parent $logPath
    if ($parent -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
      New-Item -ItemType Directory -Path $parent | Out-Null
    }
  }

  $process = $null
  $stdoutWriter = $null
  $stderrWriter = $null
  try {
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new([string]$spec.processPath)
    $startInfo.UseShellExecute = $false
    $startInfo.WorkingDirectory = [string]$spec.workingDirectory
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = [bool]$spec.createNoWindow
    foreach ($argument in @($spec.arguments)) {
      if ($null -ne $argument) { $startInfo.ArgumentList.Add([string]$argument) }
    }
    $startInfo.Environment.Clear()
    foreach ($entry in $spec.environment.GetEnumerator()) {
      $startInfo.Environment[[string]$entry.Key] = [string]$entry.Value
    }

    $stdoutStream = [IO.File]::Open(
      $stdoutLog,
      [IO.FileMode]::Append,
      [IO.FileAccess]::Write,
      [IO.FileShare]::ReadWrite
    )
    $stderrStream = [IO.File]::Open(
      $stderrLog,
      [IO.FileMode]::Append,
      [IO.FileAccess]::Write,
      [IO.FileShare]::ReadWrite
    )
    $utf8 = [Text.UTF8Encoding]::new($false)
    $stdoutWriter = [IO.StreamWriter]::new($stdoutStream, $utf8)
    $stderrWriter = [IO.StreamWriter]::new($stderrStream, $utf8)
    $stdoutWriter.AutoFlush = $true
    $stderrWriter.AutoFlush = $true

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    if (-not $process.Start()) { throw 'Process.Start returned false' }
    $process.Refresh()
    $record = [ordered]@{
      ok = $true
      pid = $process.Id
      relayPid = $PID
      startTimeUtc = $process.StartTime.ToUniversalTime().ToString('o')
      startTimeUtcTicks = [string]$process.StartTime.ToUniversalTime().Ticks
      executablePath = [IO.Path]::GetFullPath([string]$spec.processPath)
    }
    Write-JsonNoBom $handoffPath $record

    $stdoutTask = $process.StandardOutput.ReadLineAsync()
    $stderrTask = $process.StandardError.ReadLineAsync()
    while ($true) {
      $activity = $false
      if ($null -ne $stdoutTask -and $stdoutTask.IsCompleted) {
        $line = $stdoutTask.GetAwaiter().GetResult()
        if ($null -eq $line) {
          $stdoutTask = $null
        } else {
          $stdoutWriter.WriteLine((Protect-RelayLogLine -Line $line))
          $stdoutWriter.Flush()
          $stdoutTask = $process.StandardOutput.ReadLineAsync()
        }
        $activity = $true
      }
      if ($null -ne $stderrTask -and $stderrTask.IsCompleted) {
        $line = $stderrTask.GetAwaiter().GetResult()
        if ($null -eq $line) {
          $stderrTask = $null
        } else {
          $stderrWriter.WriteLine($line)
          $stderrWriter.Flush()
          $stderrTask = $process.StandardError.ReadLineAsync()
        }
        $activity = $true
      }
      if ($process.HasExited -and $null -eq $stdoutTask -and $null -eq $stderrTask) { break }
      if (-not $activity) { Start-Sleep -Milliseconds 20 }
    }
    $process.WaitForExit()
  } finally {
    if ($stdoutWriter) { $stdoutWriter.Dispose() }
    if ($stderrWriter) { $stderrWriter.Dispose() }
    if ($process) { $process.Dispose() }
  }
}

if ($LaunchSpecPath) {
  Invoke-ProcessRelay $LaunchSpecPath
  exit 0
}

$RepoRoot = 'D:\Lawbeach\lawbench-A'
$EvidenceRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsReadSignatureGUI-20261030-134212'
$E50EvidenceRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421'
$BlueprintRoot = 'D:\Lawbeach\lawbench-coord\T30GenuineSessionGuiInput-20261028-094637'
$Project = Join-Path $E50EvidenceRoot 'project'
$E50Runtime = Join-Path $E50EvidenceRoot 'runtime'
$PrimaryRuntime = Join-Path $RepoRoot 'dsh\apps\desktop\.desktop-build\targets\win-x64\runtime\primary-runtime'
$DesktopRoot = Join-Path $RepoRoot 'dsh\apps\desktop'
$Electron = Join-Path $DesktopRoot 'node_modules\electron\dist\electron.exe'
$ElectronBytes = 244440576
$ElectronSha256 = '1dc2d12e5c60341782e68c4b65a8e49cbd86217f81568f90575547cec13b5610'
$DesktopPackageBytes = 3474
$DesktopPackageSha256 = '2c1643549732e15dcd911658be6515ffcfef5ddaef308067eaa9fc6e827ee0a0'
$Node = 'E:\node\node.exe'
$NodeBytes = 93580104
$NodeSha256 = 'ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$NativeEntry = Join-Path $EvidenceRoot 'entry.py'
$ObserverPath = Join-Path $EvidenceRoot 'projection-observer.mjs'
$SettingsReadObserverPath = Join-Path $EvidenceRoot 'settings-read-observer.mjs'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$ServiceRoot = 'D:/Lawbeach/lawbench-B/service'
$RunsRoot = Join-Path $EvidenceRoot 'runs'
$NativeEntryBytes = 88658
$NativeEntrySha256 = '13c85e3964cd4bca46443a956ffdb6adb76ca4a6c38f233df330b2a9006c9c1b'
$ObserverBytes = 20058
$ObserverSha256 = '2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac'
$SettingsReadObserverBytes = 11513
$SettingsReadObserverSha256 = 'fea7c264923a67c725bc6eba62b1089ad7ebbc7bd614b588683c5811ef78f9bb'
$Guard = Join-Path $E50Runtime 'network-guard.cjs'
$Resolver = Join-Path $E50Runtime 'resolve-from-dsh.mjs'
$PrivateProviderBinding = Join-Path $EvidenceRoot 'private-provider-binding.mjs'
$PrivateProviderBindingBytes = 2499
$PrivateProviderBindingSha256 = '376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e'
$PrivateProviderOriginal = 'D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\lib\index.js'
$PrivateProviderOriginalBytes = 114078
$PrivateProviderOriginalSha256 = 'a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f'
$PrivateProviderComponent = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\llm-pi-ai.mjs'
$PrivateProviderComponentBytes = 81412
$PrivateProviderComponentSha256 = '664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17'
$PrivateProviderManifest = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\manifest.json'
$PrivateProviderManifestBytes = 24383
$PrivateProviderManifestSha256 = 'f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54'
$ExpectedHead = 'a23271abee333a9a256fd46a3141da16975c2380'
$PreparedFormat = 'lawbench-t34-private-projection-observer-prepared-v1'
$AdmissionFormat = 'lawbench-t34-private-projection-observer-admission-v1'
$ExpectedCaseId = '872b161f-27d4-40bf-879e-ee457ef6454b'
$SourceCaseRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case'
$SourceRunReportSha256 = '238bc2fa4d720d0b5c41e60f1c66a0fe51610e5b7a100b7593f4b61e978ea08e'
$SourceRunPacketManifestSha256 = 'b7c1933e9065a67049a2f4cb14d6eac804f084d388a130371664442876d708f4'
$SourceSession = 'session-97c67db2-b8a6-428b-be48-04b4144d10bd'
$ChildSession = 'session-7fd6b82e-f361-456a-9c91-b6ba77991bb9'
$SourceSessionBytes = 12059
$SourceSessionSha256 = 'e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee'
$ChildSessionBytes = 16235
$ChildSessionSha256 = 'b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461'
$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727.json'
$SourcePinsBytes = 53548
$SourcePinsSha256 = '7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b'
$SafetyBasePath = 'D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py'
$SafetyBaseBytes = 151304
$SafetyBaseSha256 = 'a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5'
$PrivateBuildRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\IdempotencePrivateBuild-20261030-085828\private-output-20261030-091211'
$PrivateBuildManifest = Join-Path $PrivateBuildRoot 'manifest.json'
$PrivateBuildManifestBytes = 58198
$PrivateBuildManifestSha256 = '8493f52c879b8674b8c72f961de4c81d89165f97ffd251b91bcb270c85bf39ab'
$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsFull = [IO.Path]::GetFullPath($RunsRoot)
$GuiRoot = Join-Path $rootFull 'gui'
$StateDir = Join-Path $GuiRoot 'state'
$LogDir = Join-Path $GuiRoot 'logs'
$StatePath = Join-Path $StateDir 'current.json'
$HandoffPath = Join-Path $StateDir 'handoff.json'
$LaunchErrorPath = Join-Path $StateDir 'launch-error.json'
$StopRequestPath = Join-Path $StateDir 'stop-request.json'
$StopReportPath = Join-Path $StateDir 'stop-report.json'
$ObserverOutputPath = Join-Path $StateDir 'projection-observer.json'
$DshHome = Join-Path $GuiRoot 'dsh-home'
$UserData = Join-Path $GuiRoot 'electron-user-data'
$HostSkills = Join-Path $GuiRoot 'host-skills'
$PrivateNative = Join-Path $GuiRoot 'private-native'
$PrivateNativeLib = Join-Path $PrivateNative 'lib'
$PrivateNativePackage = Join-Path $PrivateNative 'package.json'
$ProfileOverlay = Join-Path $GuiRoot 'dsh-home\profiles\desktop\cordis.patch.yml'
$ProfileDir = Join-Path $DshHome 'profiles\desktop'
$ProfileNodeModules = Join-Path $ProfileDir 'node_modules'
$PrivateHome = Join-Path $rootFull 'private\home'
$PrivateAppdata = Join-Path $rootFull 'private\appdata'
$PrivateTemp = Join-Path $rootFull 'private\temp'
$Roaming = Join-Path $rootFull 'private\roaming'
$ProgramData = Join-Path $rootFull 'private\programdata'
$PwshPath = (Get-Process -Id $PID).Path

function Assert-File([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Label missing: $Path"
  }
}

function Assert-Directory([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "$Label missing: $Path"
  }
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-ExtendedLocalPath([string]$Path) {
  $full = [IO.Path]::GetFullPath($Path)
  if ($full.StartsWith('\\?\', [StringComparison]::Ordinal)) {
    return $full
  }
  if ($full.StartsWith('\\', [StringComparison]::Ordinal)) {
    return '\\?\UNC\' + $full.Substring(2)
  }
  return '\\?\' + $full
}

function Assert-Sha256([string]$Path, [string]$Expected, [string]$Label) {
  Assert-File $Path $Label
  if ((Get-Sha256 $Path) -ne $Expected) {
    throw "$Label hash mismatch: $Path"
  }
}

function Get-T30CaseFile([string]$Root, [string]$RelativePath) {
  $path = Join-Path $Root ($RelativePath.Replace('/', '\'))
  Assert-NoReparsePath $path
  $extended = Get-ExtendedLocalPath $path
  if (-not (Test-Path -LiteralPath $extended -PathType Leaf)) {
    throw "T30 case file missing: $RelativePath"
  }
  return $extended
}

function Assert-T30PreparedInputs {
  $preparedPath = Join-Path $rootFull 'prepared.json'
  $admissionPath = Join-Path $rootFull 'admission.json'
  $casePath = Join-Path $rootFull 'case'
  $settingsPath = Join-Path $PrivateAppdata 'settings.json'
  $markerPath = Join-Path $PrivateAppdata 'daily-case.json'
  Assert-File $preparedPath 'T30 prepared manifest'
  Assert-File $admissionPath 'T30 admission report'
  Assert-NoReparsePath $casePath
  Assert-NoReparsePath $SourceCaseRoot
  $sourceRunReportPath = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\admission-report.json'
  Assert-Sha256 $sourceRunReportPath $SourceRunReportSha256 'T30 source run report'

  $manifest = Get-Content -Raw -LiteralPath $preparedPath | ConvertFrom-Json
  if ($manifest.format -cne $PreparedFormat -or
      $manifest.expectedCaseId -cne $ExpectedCaseId -or
      [string]$manifest.sourceCaseRoot -ine $SourceCaseRoot -or
      [string]$manifest.sourceRunReport.sha256 -cne $SourceRunReportSha256 -or
      [string]$manifest.sourceRunReport.packetManifestSha256 -cne $SourceRunPacketManifestSha256) {
    throw 'T30 prepared manifest identity mismatch'
  }

  $expectedRows = @(
    @{ RelativePath = "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/$SourceSession/session.v4.jsonl"; Bytes = $SourceSessionBytes; Sha256 = $SourceSessionSha256 },
    @{ RelativePath = "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/$ChildSession/session.v4.jsonl"; Bytes = $ChildSessionBytes; Sha256 = $ChildSessionSha256 },
    @{ RelativePath = '工作区/case.db'; Bytes = 65536; Sha256 = '47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6' },
    @{ RelativePath = '工作区/case.db-shm'; Bytes = 32768; Sha256 = 'fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb' },
    @{ RelativePath = '工作区/case.db-wal'; Bytes = 0; Sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
  )
  $actualManifestRows = @($manifest.sourceFiles | ForEach-Object {
    "$($_.relativePath)|$($_.bytes)|$($_.sha256)"
  } | Sort-Object)
  $expectedManifestRows = @($expectedRows | ForEach-Object {
    "$($_.RelativePath)|$($_.Bytes)|$($_.Sha256)"
  } | Sort-Object)
  if (($actualManifestRows -join "`n") -cne ($expectedManifestRows -join "`n")) {
    throw 'T30 prepared source row mismatch'
  }
  $sourceFileCount = @(Get-ChildItem -LiteralPath (Get-ExtendedLocalPath $SourceCaseRoot) -Recurse -File -Force).Count
  if ($sourceFileCount -ne $expectedRows.Count) {
    throw "T30 source case file count mismatch: $sourceFileCount"
  }
  foreach ($row in $expectedRows) {
    $sourcePath = Get-T30CaseFile $SourceCaseRoot $row.RelativePath
    if ((Get-Item -LiteralPath $sourcePath).Length -ne [long]$row.Bytes -or
        (Get-Sha256 $sourcePath) -cne [string]$row.Sha256) {
      throw "T30 source case changed: $($row.RelativePath)"
    }
  }

  $sourceLog = Get-T30CaseFile $casePath "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/$SourceSession/session.v4.jsonl"
  $childLog = Get-T30CaseFile $casePath "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/$ChildSession/session.v4.jsonl"
  if ((Get-Item -LiteralPath $sourceLog).Length -ne $SourceSessionBytes -or
      (Get-Sha256 $sourceLog) -cne $SourceSessionSha256 -or
      (Get-Item -LiteralPath $childLog).Length -ne $ChildSessionBytes -or
      (Get-Sha256 $childLog) -cne $ChildSessionSha256) {
    throw 'T30 copied session log identity mismatch'
  }

  $admission = Get-Content -Raw -LiteralPath $admissionPath | ConvertFrom-Json
  if ($admission.format -cne $AdmissionFormat -or
      $admission.status -cne 'REGISTERED_NOT_GUI_RUN' -or
      [string]$admission.runRoot -ine $rootFull -or
      [string]$admission.caseRoot -ine $casePath -or
      [string]$admission.appdata -ine $PrivateAppdata -or
      [string]$admission.caseId -cne $ExpectedCaseId -or
      [string]$admission.registryKind -cne 'daily' -or
      $admission.sourceBeforeEqualsAfter -ne $true -or
      [int]$admission.modelCalls -ne 0 -or
      [int]$admission.httpRequests -ne 0 -or
      $admission.guiStarted -ne $false -or
      $admission.deleteAttempted -ne $false) {
    throw 'T30 admission report identity mismatch'
  }
  if ([string]$admission.sourceLogs.source.sha256 -cne $SourceSessionSha256 -or
      [string]$admission.sourceLogs.child.sha256 -cne $ChildSessionSha256) {
    throw 'T30 admission log identity mismatch'
  }

  $cases = Get-Content -Raw -LiteralPath (Join-Path $PrivateAppdata 'cases.json') | ConvertFrom-Json
  if ($cases.v -ne 1 -or @($cases.cases).Count -ne 1 -or
      [string]$cases.cases[0].case_id -cne $ExpectedCaseId -or
      [string]$cases.cases[0].root -ine $casePath -or
      [string]$cases.cases[0].kind -cne 'daily') {
    throw 'T30 CaseRegistry cache identity mismatch'
  }

  $settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
  if ($settings.external_llm.enabled -ne $false -or
      $settings.servers.llm_base_url -cne 'http://127.0.0.1:65001/v1' -or
      $settings.servers.llm_alt_base_url -cne 'http://127.0.0.1:65003/v1' -or
      $settings.servers.prep_base_url -cne 'http://127.0.0.1:65002' -or
      $settings.servers.prep_alt_base_url -cne 'http://127.0.0.1:65004') {
    throw 'T30 prepared settings content mismatch'
  }
  if ((Get-Sha256 $settingsPath) -cne [string]$manifest.settings.sha256 -or
      (Get-Sha256 $markerPath) -cne [string]$manifest.dailyMarker.sha256) {
    throw 'T30 settings or daily marker changed'
  }
  $marker = Get-Content -Raw -LiteralPath $markerPath | ConvertFrom-Json
  if ([string]$marker.root -ine $casePath) {
    throw 'T30 daily marker root mismatch'
  }

  $rootEntries = @(Get-ChildItem -LiteralPath $rootFull -Force | ForEach-Object Name | Sort-Object)
  $expectedRootEntries = @('admission.json', 'case', 'prepared.json', 'private') | Sort-Object
  if (($rootEntries -join ',') -cne ($expectedRootEntries -join ',')) {
    throw 'T30 fresh prepared root inventory mismatch'
  }
  foreach ($artifact in @('started.json', 'ready.json', 'final-metadata.json', 'loop-closed.json', 'requests.ndjson', 'run-error.json')) {
    if (Test-Path -LiteralPath (Join-Path $rootFull $artifact)) {
      throw "T30 root already served or reused: $artifact"
    }
  }
  return $manifest
}

function Assert-NoReparsePath([string]$Path, [switch]$AllowMissingTail) {
  $full = [IO.Path]::GetFullPath($Path)
  $driveRoot = [IO.Path]::GetPathRoot($full)
  $current = $driveRoot
  foreach ($segment in (($full.Substring($driveRoot.Length)) -split '[\\/]+')) {
    if (-not $segment) { continue }
    $current = Join-Path $current $segment
    $extended = Get-ExtendedLocalPath $current
    if (-not (Test-Path -LiteralPath $extended)) {
      if ($AllowMissingTail) { continue }
      throw "path component missing: $current"
    }
    $item = Get-Item -LiteralPath $extended -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "reparse point refused: $current"
    }
  }
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

function New-IdentityRecord([int]$TargetPid, [string]$Role, [string]$Marker) {
  $identity = Get-ExactIdentity $TargetPid
  if (-not $identity) { throw "cannot record process identity for PID $TargetPid" }
  return [pscustomobject]@{
    pid = $identity.pid
    role = $Role
    executablePath = $identity.executablePath
    startTimeUtcTicks = $identity.startTimeUtcTicks
    marker = $Marker
    recordedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
}

function Test-ExactRecord($Record) {
  $current = Get-ExactIdentity ([int]$Record.pid)
  if (-not $current) { return $false }
  try {
    if ([IO.Path]::GetFullPath($current.executablePath) -ine [IO.Path]::GetFullPath([string]$Record.executablePath)) {
      return $false
    }
    return (
      [string]$current.startTimeUtcTicks -eq [string]$Record.startTimeUtcTicks -and
      $current.commandLine.IndexOf([string]$Record.marker, [StringComparison]::OrdinalIgnoreCase) -ge 0
    )
  } catch {
    return $false
  }
}

function Add-IdentityRecord($Record) {
  $duplicate = $script:ProcessRecords | Where-Object {
    [int]$_.pid -eq [int]$Record.pid -and
    [string]$_.startTimeUtcTicks -eq [string]$Record.startTimeUtcTicks
  } | Select-Object -First 1
  if (-not $duplicate) {
    $script:ProcessRecords = @($script:ProcessRecords) + @($Record)
  }
}

$LegacyPins = @(
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\prepare.ps1'; Sha = '1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\start.ps1'; Sha = '080abc3f93dbe7032fcad378315ee5b5c271d7cd4dec2761729ff24ebf295445' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\stop.ps1'; Sha = '7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647' },
  @{ Path = 'D:/Lawbeach/lawbench-B/docs/plan/evidence/T33/ReadGetEntry-20261025-105313/server.py'; Sha = 'c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\agent.js'; Sha = '3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\client.js'; Sha = 'e26b9f922b1c57a88d3e209fe1b0119d0e4f6381f02759afa23f629ebe5f8661' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\credentials.js'; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\host.js'; Sha = '4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\index.js'; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\session-store.js'; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\resolve-from-dsh.mjs'; Sha = '1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208' },
  @{ Path = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs'; Sha = 'cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/agent.js'; Sha = 'b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/client.js'; Sha = 'a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/host.js'; Sha = 'a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/credentials.js'; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/index.js'; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' },
  @{ Path = 'D:/Lawbeach/lawbench-A/dsh-ext/lib/session-store.js'; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' }
)

$PrivateOutputPins = @(
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/client.js'; Bytes = 144114; Sha = '05f5cdd4d5f96033d86b8c4deec640409e2952e149882b9a746267e3799a41fd' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/client.js.map'; Bytes = 372267; Sha = 'f7e0b1afa4d4b2119d832bffdc48e4ccada26b37d379ef11d8e081bd1bcf56e2' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js'; Bytes = 124525; Sha = 'c0fbf31baa63caa3e29d5de022109356ed2f1c9e136eb8844dccfc59c8843d6f' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.host.d.ts'; Bytes = 123; Sha = '5e2d26ee86d0fe170dac8cd3f5854e67bdea334c57f40a5766ace57b8304c17d' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.host.js'; Bytes = 158754; Sha = 'a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.d.ts'; Bytes = 6413; Sha = 'e6f7d2b5a6b35d7b1a28edf3afe10dbf73289775622f326c104d1855f9342fc3' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.d.ts.map'; Bytes = 891; Sha = 'a0b9ae0ec7312dea0beb6a4e5ef063e30bf54bfbb093157583c4b0932b29ca48' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.js'; Bytes = 59116; Sha = 'e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/types/remote-events.js'; Bytes = 11; Sha = '8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/types/types.js'; Bytes = 327; Sha = '147e061a2b698ee71442c71f4512a8f7e750f9e6cd6ca75545cd3805486e7f46' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-api-session-controller/package.json'; Bytes = 6030; Sha = 'ef7d21eec0e9b35212cc773f984afd7e24daca7063de8fad69a287e661c55a81' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'; Bytes = 718187; Sha = 'f20f2f8952b9718d7a5f4f9a524d6144d11a6511ab5205c65549952cceb1a753' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js.map'; Bytes = 1338524; Sha = '33f779c4e2b35cb9a5227bc74d52b90f79ecfb086fc15dde3031dc352b33f3bc' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/index.js'; Bytes = 1512; Sha = 'da3e4ed509e4da59cfaf5564d983e40cef422c0965c0561faab45cd61f28d3d2' },
  @{ Path = 'profile-node_modules/@deepseek-ai/dsh-client-ui-conversation/package.json'; Bytes = 3665; Sha = '9e002e9f9c09ec329e82995cbf1fe47d64dd5f516c8912bc98f73db327f567d1' },
  @{ Path = 'profile-node_modules/lawbench-dsh/cordis.patch.yml'; Bytes = 19570; Sha = 'e8c84bdfa142be2032f31b3e33040721efad0f2b1593b5a6a5b79bb01e91fcb4' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/agent.js'; Bytes = 557970; Sha = '0c403eacf1552a7fce0f628ca10044dc29fec9517394313fd4a809860f5da16d' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/client.js'; Bytes = 539498; Sha = 'b6ffe003a34af83918bc9fc069350cfa4054ac69458d7644200b68f567a9bd86' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/credentials.js'; Bytes = 15774; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/host.js'; Bytes = 902499; Sha = 'ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/index.js'; Bytes = 208; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/session-store.js'; Bytes = 44858; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' },
  @{ Path = 'profile-node_modules/lawbench-dsh/package.json'; Bytes = 1257; Sha = '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794' },
  @{ Path = 'profile-node_modules/lawbench-dsh/persona.md'; Bytes = 2706; Sha = 'a0dbc2b314f781d2b74a99edce633a289176965a549e00e45c946f0c5bf877c3' }
)

$NativeShimPins = @(
  @{ Name = 'host.js'; Bytes = 902499; Sha = 'ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b' },
  @{ Name = 'agent.js'; Bytes = 557970; Sha = '0c403eacf1552a7fce0f628ca10044dc29fec9517394313fd4a809860f5da16d' },
  @{ Name = 'session-store.js'; Bytes = 44858; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' }
)

function Assert-Preflight {
  if ($PrivateOutputPins.Count -ne 24) {
    throw 'literal private output pin count must be 24'
  }
  if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
    throw "run root must be a direct child of $runsFull"
  }
  if ($rootFull -notmatch '\\T34-private-projection-observer-[0-9]{8}-[0-9]{6}$') {
    throw "bad run root name: $rootFull"
  }
  Assert-NoReparsePath $rootFull
  Assert-NoReparsePath $Project
  Assert-NoReparsePath $PrimaryRuntime
  Assert-NoReparsePath $DesktopRoot
  Assert-NoReparsePath $BProductRoot
  Assert-NoReparsePath $PrivateBuildRoot
  Assert-NoReparsePath $NativeEntry
  Assert-NoReparsePath $ObserverPath
  Assert-NoReparsePath $SettingsReadObserverPath
  Assert-Sha256 $NativeEntry $NativeEntrySha256 'pinned native entry'
  if ((Get-Item -LiteralPath $NativeEntry).Length -ne $NativeEntryBytes) {
    throw 'pinned native entry byte count mismatch'
  }
  Assert-Sha256 $ObserverPath $ObserverSha256 'pinned projection observer'
  if ((Get-Item -LiteralPath $ObserverPath).Length -ne $ObserverBytes) {
    throw 'pinned projection observer byte count mismatch'
  }
  Assert-Sha256 $SettingsReadObserverPath $SettingsReadObserverSha256 'pinned settings read observer'
  if ((Get-Item -LiteralPath $SettingsReadObserverPath).Length -ne $SettingsReadObserverBytes) {
    throw 'pinned settings read observer byte count mismatch'
  }
  Assert-NoReparsePath $PrivateProviderBinding
  Assert-NoReparsePath $PrivateProviderOriginal
  Assert-NoReparsePath $PrivateProviderComponent
  Assert-NoReparsePath $PrivateProviderManifest
  Assert-Sha256 $PrivateProviderBinding $PrivateProviderBindingSha256 'private provider binding'
  if ((Get-Item -LiteralPath $PrivateProviderBinding).Length -ne $PrivateProviderBindingBytes) {
    throw 'private provider binding byte count mismatch'
  }
  Assert-Sha256 $PrivateProviderOriginal $PrivateProviderOriginalSha256 'original provider module'
  if ((Get-Item -LiteralPath $PrivateProviderOriginal).Length -ne $PrivateProviderOriginalBytes) {
    throw 'original provider module byte count mismatch'
  }
  Assert-Sha256 $PrivateProviderComponent $PrivateProviderComponentSha256 'private provider component'
  if ((Get-Item -LiteralPath $PrivateProviderComponent).Length -ne $PrivateProviderComponentBytes) {
    throw 'private provider component byte count mismatch'
  }
  Assert-Sha256 $PrivateProviderManifest $PrivateProviderManifestSha256 'private provider manifest'
  if ((Get-Item -LiteralPath $PrivateProviderManifest).Length -ne $PrivateProviderManifestBytes) {
    throw 'private provider manifest byte count mismatch'
  }
  if (Test-Path -LiteralPath $ObserverOutputPath) {
    throw 'projection observer output already exists in fresh run'
  }
  Assert-Sha256 $Guard 'cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130' 'original network guard'
  Assert-Sha256 $Resolver '1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208' 'original resolver'
  Assert-Sha256 $SourcePinsPath '7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b' 'reviewed B source pins'
  Assert-Sha256 $SafetyBasePath $SafetyBaseSha256 'separate-action safety base'
  Assert-Sha256 (Join-Path $BlueprintRoot 'prepare.ps1') '0f76e9216ec9b29941e0fa7f0e6bd82496d9cd36cbda3aef8f5740079ccf9f58' 'before prepare snapshot'
  Assert-Sha256 (Join-Path $BlueprintRoot 'start.ps1') 'c1f33da5c4dfb35b278315541fc47f2d7c4d943728ee8c6b2b068a49f099c0b0' 'before start snapshot'
  Assert-Sha256 (Join-Path $BlueprintRoot 'stop.ps1') 'b87887fe29dc191cbe9237e3111f1ce9d48ab26ac330edc1e06c5804699a9eec' 'before stop snapshot'
  $sourcePins = Get-Content -Raw -LiteralPath $SourcePinsPath | ConvertFrom-Json
  if (@($sourcePins.PSObject.Properties).Count -ne 346) {
    throw 'reviewed B source pin count mismatch'
  }
  foreach ($property in $sourcePins.PSObject.Properties) {
    $sourcePath = Join-Path $BProductRoot $property.Name
    if ((Get-Sha256 $sourcePath) -cne [string]$property.Value.sha256 -or
        (Get-Item -LiteralPath $sourcePath).Length -ne [long]$property.Value.bytes) {
      throw "reviewed B source changed: $($property.Name)"
    }
  }
  Assert-Sha256 (Join-Path $Project 'cordis.patch.yml') '7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f' 'profile patch source'
  Assert-Sha256 (Join-Path $Project 't50-memory-credentials.mjs') 'c4d0fefd428086416055f1350b0fb6e7cf1a7e14a3912a1e5796500e7e26377a' 'memory provider source'
  Assert-Sha256 (Join-Path $E50Runtime 'dsh-home\profiles\desktop\package.json') 'bb7315c3844542261d160da20c0b9c963b5e56464cb81f546862fb2d46f43c3f' 'profile package source'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\package.json') '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794' 'private plugin package source'
  Assert-File $Node 'pinned Node'
  Assert-File $Electron 'pinned Electron'
  if ((Get-Item -LiteralPath $Node).Length -ne $NodeBytes -or
      (Get-Sha256 $Node) -cne $NodeSha256 -or
      (Get-Item -LiteralPath $Electron).Length -ne $ElectronBytes -or
      (Get-Sha256 $Electron) -cne $ElectronSha256 -or
      (Get-Item -LiteralPath (Join-Path $DesktopRoot 'package.json')).Length -ne $DesktopPackageBytes -or
      (Get-Sha256 (Join-Path $DesktopRoot 'package.json')) -cne $DesktopPackageSha256) {
    throw 'pinned Node/Electron/desktop identity mismatch'
  }
  Assert-File (Join-Path $Project 'node_modules\@deepseek-ai\dsh\package.json') 'dsh install anchor'
  Assert-File (Join-Path $Project 'node_modules\@deepseek-ai\dsh-base\cordis.patch.yml') 'dsh-base bundle'
  Assert-File (Join-Path $Project 'node_modules\@deepseek-ai\dsh-web-app\cordis.patch.yml') 'dsh-web-app bundle'
  Assert-File (Join-Path $Project 'node_modules\lawbench-dsh\cordis.patch.yml') 'lawbench-dsh bundle'
  Assert-File (Join-Path $Project 'node_modules\lawbench-dsh\lib\host.js') 'lawbench host bundle'
  Assert-Directory $ServiceRoot 'native B service root'
  foreach ($environmentRoot in @($Project, $DesktopRoot, $ServiceRoot, $DshHome)) {
    foreach ($environmentName in @('.env', '.env.local')) {
      if (Test-Path -LiteralPath (Join-Path $environmentRoot $environmentName)) {
        throw "credential-bearing environment layer is forbidden: $(Join-Path $environmentRoot $environmentName)"
      }
    }
  }

  $profilePackage = Get-Content -Raw -LiteralPath (Join-Path $E50Runtime 'dsh-home\profiles\desktop\package.json') | ConvertFrom-Json
  if ((@($profilePackage.dsh.profile.bundles) -join "`n") -cne
      (@('@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'lawbench-dsh') -join "`n")) {
    throw 'profile bundle set changed'
  }

  foreach ($pin in $LegacyPins) {
    Assert-Sha256 $pin.Path $pin.Sha "frozen legacy pin"
  }

  Assert-Sha256 $PrivateBuildManifest $PrivateBuildManifestSha256 'private build manifest'
  if ((Get-Item -LiteralPath $PrivateBuildManifest).Length -ne $PrivateBuildManifestBytes) {
    throw 'private build manifest byte count mismatch'
  }
  $privateManifest = Get-Content -Raw -LiteralPath $PrivateBuildManifest | ConvertFrom-Json
  if ($privateManifest.format -cne 'T31-private-runtime-build-v1' -or
      $privateManifest.status -cne 'SOURCE_BUILT_RUNTIME_NOT_EXERCISED' -or
      $privateManifest.source.head -cne $ExpectedHead -or
      @($privateManifest.outputs).Count -ne $PrivateOutputPins.Count) {
    throw 'private build manifest identity mismatch'
  }
  $manifestOutputKeys = @($privateManifest.outputs | ForEach-Object {
    "$($_.path)|$($_.bytes)|$($_.sha256)"
  } | Sort-Object)
  $literalOutputKeys = @($PrivateOutputPins | ForEach-Object {
    "$($_.Path)|$($_.Bytes)|$($_.Sha)"
  } | Sort-Object)
  if (($manifestOutputKeys -join "`n") -cne ($literalOutputKeys -join "`n")) {
    throw 'private build output manifest/pins mismatch'
  }
  $privateFiles = @(Get-ChildItem -LiteralPath $PrivateBuildRoot -Recurse -File -Force)
  $expectedPrivateFiles = @(
    'manifest.json'
    foreach ($pin in $PrivateOutputPins) { $pin.Path -replace '/', '\' }
  ) | Sort-Object
  $actualPrivateFiles = @($privateFiles | ForEach-Object {
    $_.FullName.Substring([IO.Path]::GetFullPath($PrivateBuildRoot).TrimEnd('\').Length + 1)
  } | Sort-Object)
  if ($privateFiles.Count -ne ($PrivateOutputPins.Count + 1) -or
      ($actualPrivateFiles -join "`n") -cne ($expectedPrivateFiles -join "`n")) {
    throw 'private build inventory mismatch'
  }
  $privateItems = @(Get-ChildItem -LiteralPath $PrivateBuildRoot -Recurse -Force)
  if (@($privateItems | Where-Object {
    ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
  }).Count -ne 0) {
    throw 'private build contains a link/reparse point'
  }
  foreach ($pin in $PrivateOutputPins) {
    $path = Join-Path $PrivateBuildRoot ($pin.Path -replace '/', '\')
    Assert-NoReparsePath $path
    if ((Get-Item -LiteralPath $path).Length -ne [long]$pin.Bytes -or
        (Get-Sha256 $path) -ne [string]$pin.Sha) {
      throw "private build output identity mismatch: $($pin.Path)"
    }
  }

  [void](Assert-T30PreparedInputs)
  if (Test-Path -LiteralPath $GuiRoot) {
    throw "GUI run directory already exists; fresh root required: $GuiRoot"
  }
}

function Prepare-PrivateProfile {
  foreach ($directory in @(
    $GuiRoot, $StateDir, $LogDir, $DshHome, $UserData, $HostSkills,
    $ProfileDir, $PrivateNative, $PrivateNativeLib
  )) {
    if (Test-Path -LiteralPath $directory) { throw "fresh directory already exists: $directory" }
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  Assert-NoReparsePath $ProfileDir
  Assert-NoReparsePath $PrivateNative
  foreach ($directory in @(
    $PrivateHome, $PrivateAppdata, (Join-Path $rootFull 'private\system'),
    $PrivateTemp, $Roaming, $ProgramData
  )) {
    Assert-Directory $directory 'native private directory'
  }
  Assert-Directory (Join-Path $PrivateHome 'Desktop') 'private Desktop'

  $profilePackageText = @'
{
  "name": "dsh-profile-desktop",
  "private": true,
  "dependencies": {
    "@deepseek-ai/dsh-api-session-controller": "0.1.7-rc.2",
    "@deepseek-ai/dsh-client-ui-conversation": "0.1.7-rc.2",
    "lawbench-dsh": "0.0.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "lawbench-dsh"
      ]
    }
  }
}
'@
  $profilePackagePath = Join-Path $ProfileDir 'package.json'
  [IO.File]::WriteAllText($profilePackagePath, $profilePackageText, [Text.UTF8Encoding]::new($false))
  if ([IO.File]::ReadAllText($profilePackagePath) -cne $profilePackageText) {
    throw 'fresh profile package manifest changed during materialization'
  }
  $freshProfilePackage = Get-Content -Raw -LiteralPath $profilePackagePath | ConvertFrom-Json
  $dependencyKeys = @($freshProfilePackage.dependencies.PSObject.Properties.Name | Sort-Object)
  $expectedDependencyKeys = @(
    '@deepseek-ai/dsh-api-session-controller',
    '@deepseek-ai/dsh-client-ui-conversation',
    'lawbench-dsh'
  ) | Sort-Object
  if (($dependencyKeys -join ',') -cne ($expectedDependencyKeys -join ',') -or
      $freshProfilePackage.dependencies.'@deepseek-ai/dsh-api-session-controller' -cne '0.1.7-rc.2' -or
      $freshProfilePackage.dependencies.'@deepseek-ai/dsh-client-ui-conversation' -cne '0.1.7-rc.2' -or
      $freshProfilePackage.dependencies.'lawbench-dsh' -cne '0.0.0' -or
      (@($freshProfilePackage.dsh.profile.bundles) -join "`n") -cne
      (@('@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'lawbench-dsh') -join "`n")) {
    throw 'fresh profile dependencies or base bundle set changed'
  }

  $copies = @(
    @{ Source = Join-Path $Project 'cordis.patch.yml'; Target = Join-Path $ProfileDir 'cordis.patch.yml'; Sha = '7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f' },
    @{ Source = Join-Path $Project 't50-memory-credentials.mjs'; Target = Join-Path $ProfileDir 't50-memory-credentials.mjs'; Sha = 'c4d0fefd428086416055f1350b0fb6e7cf1a7e14a3912a1e5796500e7e26377a' }
  )
  foreach ($copy in $copies) {
    Assert-NoReparsePath $copy.Source
    if (Test-Path -LiteralPath $copy.Target) {
      throw "fresh profile file already exists: $($copy.Target)"
    }
    Copy-Item -LiteralPath $copy.Source -Destination $copy.Target
    Assert-Sha256 $copy.Target $copy.Sha 'materialized private profile'
  }

  if (Test-Path -LiteralPath $ProfileNodeModules) {
    throw "fresh profile node_modules already exists: $ProfileNodeModules"
  }
  $stagePrefix = 'profile-node_modules/'
  foreach ($pin in $PrivateOutputPins) {
    $source = Join-Path $PrivateBuildRoot ($pin.Path -replace '/', '\')
    Assert-NoReparsePath $source
    $relative = $pin.Path.Substring($stagePrefix.Length).Replace('/', '\')
    $target = Join-Path $ProfileNodeModules $relative
    if (Test-Path -LiteralPath $target) {
      throw "refusing to overwrite staged package file: $target"
    }
    $parent = Split-Path -Parent $target
    [void][IO.Directory]::CreateDirectory($parent)
    [IO.File]::Copy($source, $target, $false)
    Assert-NoReparsePath $target
    if ((Get-Item -LiteralPath $target).Length -ne [long]$pin.Bytes -or
        (Get-Sha256 $target) -ne [string]$pin.Sha) {
      throw "staged package identity mismatch: $($pin.Path)"
    }
  }
  Assert-NoReparsePath $ProfileNodeModules
  $stagedFiles = @(Get-ChildItem -LiteralPath $ProfileNodeModules -Recurse -File -Force)
  $stagedRelative = @($stagedFiles | ForEach-Object {
    $_.FullName.Substring([IO.Path]::GetFullPath($ProfileNodeModules).TrimEnd('\').Length + 1)
  } | Sort-Object)
  $expectedStagedRelative = @($PrivateOutputPins | ForEach-Object {
    $_.Path.Substring($stagePrefix.Length).Replace('/', '\')
  } | Sort-Object)
  if ($stagedFiles.Count -ne $PrivateOutputPins.Count -or
      ($stagedRelative -join "`n") -cne ($expectedStagedRelative -join "`n")) {
    throw 'staged profile node_modules inventory mismatch'
  }
  $stagedItems = @(Get-ChildItem -LiteralPath $ProfileNodeModules -Recurse -Force)
  if (@($stagedItems | Where-Object {
    ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
  }).Count -ne 0) {
    throw 'staged profile node_modules contains a link/reparse point'
  }

  $sessionPackage = Get-Content -Raw -LiteralPath (Join-Path $ProfileNodeModules '@deepseek-ai\dsh-api-session-controller\package.json') | ConvertFrom-Json
  $conversationPackage = Get-Content -Raw -LiteralPath (Join-Path $ProfileNodeModules '@deepseek-ai\dsh-client-ui-conversation\package.json') | ConvertFrom-Json
  $lawbenchPackage = Get-Content -Raw -LiteralPath (Join-Path $ProfileNodeModules 'lawbench-dsh\package.json') | ConvertFrom-Json
  if ($sessionPackage.name -cne '@deepseek-ai/dsh-api-session-controller' -or
      $sessionPackage.version -cne '0.1.7-rc.2' -or
      $sessionPackage.type -cne 'module' -or
      $sessionPackage.exports.'./client'.default -cne './lib/client.js' -or
      $sessionPackage.dsh.client.platform -cne 'web' -or
      $conversationPackage.name -cne '@deepseek-ai/dsh-client-ui-conversation' -or
      $conversationPackage.version -cne '0.1.7-rc.2' -or
      $conversationPackage.type -cne 'module' -or
      $conversationPackage.exports.'./client'.default -cne './lib/client.js' -or
      $conversationPackage.dsh.client.platform -cne 'web') {
    throw 'staged native package manifest/client metadata mismatch'
  }
  foreach ($export in @(
    @{ Name = '.'; Target = './lib/index.js' },
    @{ Name = './client'; Target = './lib/client.js' },
    @{ Name = './agent'; Target = './lib/agent.js' },
    @{ Name = './host'; Target = './lib/host.js' },
    @{ Name = './credentials'; Target = './lib/credentials.js' },
    @{ Name = './session-store'; Target = './lib/session-store.js' },
    @{ Name = './cordis.patch.yml'; Target = './cordis.patch.yml' },
    @{ Name = './persona.md'; Target = './persona.md' },
    @{ Name = './package.json'; Target = './package.json' }
  )) {
    if ([string]$lawbenchPackage.exports.PSObject.Properties[$export.Name].Value -cne $export.Target) {
      throw "lawbench package export changed: $($export.Name)"
    }
  }
  if ($lawbenchPackage.name -cne 'lawbench-dsh' -or
      $lawbenchPackage.version -cne '0.0.0' -or
      $lawbenchPackage.type -cne 'module' -or
      $lawbenchPackage.dsh.client.platform -cne 'web' -or
      $lawbenchPackage.dsh.bundle.patch -cne 'cordis.patch.yml') {
    throw 'staged lawbench package manifest/client/bundle metadata mismatch'
  }
  $lawbenchPatchText = Get-Content -Raw -LiteralPath (Join-Path $ProfileNodeModules 'lawbench-dsh\cordis.patch.yml')
  foreach ($requiredPatchText in @(
    "id: legal-ui",
    "name: 'lawbench-dsh'",
    "id: legal-host",
    "name: 'lawbench-dsh/host'",
    "id: legal-agent",
    "name: 'lawbench-dsh/agent'",
    "validateContracts: true",
    "id: legal-session-store",
    "name: 'lawbench-dsh/session-store'",
    "id: legal-credentials",
    "name: 'lawbench-dsh/credentials'"
  )) {
    if (-not $lawbenchPatchText.Contains($requiredPatchText, [StringComparison]::Ordinal)) {
      throw "staged lawbench patch identity text missing: $requiredPatchText"
    }
  }

  $nativePackageJson = '{"name":"lawbench-t31-native-private","type":"module","private":true}'
  [IO.File]::WriteAllText($PrivateNativePackage, $nativePackageJson, [Text.UTF8Encoding]::new($false))
  if ([IO.File]::ReadAllText($PrivateNativePackage) -cne $nativePackageJson) {
    throw 'private native shim metadata changed during materialization'
  }
  $nativeShimPackage = Get-Content -Raw -LiteralPath $PrivateNativePackage | ConvertFrom-Json
  if ($nativeShimPackage.name -cne 'lawbench-t31-native-private' -or
      $nativeShimPackage.type -cne 'module' -or
      $nativeShimPackage.private -ne $true -or
      ($nativeShimPackage.PSObject.Properties.Name -join ',') -cne 'name,type,private') {
    throw 'private native shim must contain exactly name, type, and private with no duplicate client metadata'
  }
  foreach ($pin in $NativeShimPins) {
    $source = Join-Path $PrivateBuildRoot "profile-node_modules\lawbench-dsh\lib\$($pin.Name)"
    $target = Join-Path $PrivateNativeLib $pin.Name
    Assert-NoReparsePath $source
    if ((Get-Item -LiteralPath $source).Length -ne [long]$pin.Bytes -or
        (Get-Sha256 $source) -ne [string]$pin.Sha) {
      throw "private native shim source identity mismatch: $($pin.Name)"
    }
    if (Test-Path -LiteralPath $target) {
      throw "refusing to overwrite private native shim file: $target"
    }
    [IO.File]::Copy($source, $target, $false)
    Assert-NoReparsePath $target
    if ((Get-Item -LiteralPath $target).Length -ne [long]$pin.Bytes -or
        (Get-Sha256 $target) -ne [string]$pin.Sha) {
      throw "private native shim target identity mismatch: $($pin.Name)"
    }
  }
  Assert-NoReparsePath $PrivateNative
  $nativeShimFiles = @(Get-ChildItem -LiteralPath $PrivateNative -Recurse -File -Force)
  $nativeShimRelative = @($nativeShimFiles | ForEach-Object {
    $_.FullName.Substring([IO.Path]::GetFullPath($PrivateNative).TrimEnd('\').Length + 1)
  } | Sort-Object)
  $expectedNativeShimRelative = @(
    'lib\agent.js', 'lib\host.js', 'lib\session-store.js', 'package.json'
  ) | Sort-Object
  if ($nativeShimFiles.Count -ne 4 -or
      ($nativeShimRelative -join "`n") -cne ($expectedNativeShimRelative -join "`n")) {
    throw 'private native shim inventory must contain exactly package.json and three admitted modules'
  }
  $nativeShimItems = @(Get-ChildItem -LiteralPath $PrivateNative -Recurse -Force)
  if (@($nativeShimItems | Where-Object {
    ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
  }).Count -ne 0) {
    throw 'private native shim contains a link/reparse point'
  }

  $prefixBytes = [IO.File]::ReadAllBytes($ProfileOverlay)
  $prefixText = [Text.Encoding]::UTF8.GetString($prefixBytes)
  if ($prefixText -notmatch '(?m)^- id: legal-credentials[ \t]*\r?\n\s+disabled: true[ \t]*\r?$' -or
      $prefixText -notmatch '(?m)^\s+- id: t50-memory-credentials[ \t]*\r?\n\s+name: \./t50-memory-credentials\.mjs[ \t]*\r?$') {
    throw 'frozen T50 memory-credential overlay identity changed'
  }
  foreach ($privateRowId in @('session-controller-private', 'ui-conversation-private')) {
    if ($prefixText -match "(?m)^\s*- id: $([regex]::Escape($privateRowId))[ \t]*\r?$") {
      throw "profile prefix already contains private row: $privateRowId"
    }
  }

  $originalPrefixBytes = $prefixBytes
  $originalPrefixText = $prefixText
  $providerHeaderMatches = [regex]::Matches(
    $originalPrefixText,
    '(?m)^    providers:(?<newline>\r?\n)'
  )
  $lawfirmRowCount = [regex]::Matches(
    $originalPrefixText,
    '(?m)^      lawfirm:[ \t]*\r?$'
  ).Count
  $providerRowCount = [regex]::Matches(
    $originalPrefixText,
    '(?m)^      [A-Za-z0-9_-]+:[ \t]*\r?$'
  ).Count
  $externalRowCount = [regex]::Matches(
    $originalPrefixText,
    '(?m)^      external:[ \t]*\r?$'
  ).Count
  if ($providerHeaderMatches.Count -ne 1 -or $providerRowCount -ne 1 -or
      $lawfirmRowCount -ne 1 -or $externalRowCount -ne 0) {
    throw 'required-unset seed preconditions changed'
  }
  $seedNewline = $providerHeaderMatches[0].Groups['newline'].Value
  $seedLines = @(
    '      external:'
    '        displayName: T34 required-unset synthetic'
    '        api: openai-completions'
    "        baseURL: !!js `"'http://127.0.0.1:' + process.env.T50_LLM_PORT + '/v1'`""
    '        apiKeyEnv: LAWFIRM_KEY'
    '        timeoutMs: 1200000'
    '        retryPolicy:'
    '          mode: normal'
    '          maxRetries: 1'
    '        models:'
    '          - id: t34-required-unset-synthetic'
    '            name: T34 required-unset synthetic'
    '            contextWindow: 2048'
    '            input: [text]'
  )
  $seedBlock = (($seedLines -join $seedNewline) + $seedNewline)
  $seedInsertAt = $providerHeaderMatches[0].Index + $providerHeaderMatches[0].Length
  $prefixText = $originalPrefixText.Insert($seedInsertAt, $seedBlock)
  $seedOccurrences = @(
    $prefixText.Split([string[]]@($seedBlock), [StringSplitOptions]::None)
  ).Count - 1
  if ($seedOccurrences -ne 1) {
    throw 'required-unset seed insertion count must be one'
  }
  $seedRemovalCheck = $prefixText.Remove($seedInsertAt, $seedBlock.Length)
  $seedInverseBytes = [Text.UTF8Encoding]::new($false).GetBytes($seedRemovalCheck)
  if (-not [Linq.Enumerable]::SequenceEqual($seedInverseBytes, $originalPrefixBytes)) {
    throw 'required-unset seed inverse is not byte-exact with the original prefix'
  }
  $prefixBytes = [Text.UTF8Encoding]::new($false).GetBytes($prefixText)
  $settingsProofPath = Join-Path $PrivateAppdata 'settings.json'
  $settingsProof = Get-Content -Raw -LiteralPath $settingsProofPath | ConvertFrom-Json
  if ($settingsProof.external_llm.enabled -ne $false) {
    throw 'required-unset seed requires the checked B setting external_llm.enabled=false'
  }
  $originalPrefixSha256 = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($originalPrefixBytes)
  ).ToLowerInvariant()
  $legalUiIndex = Join-Path $ProfileNodeModules 'lawbench-dsh\lib\index.js'
  $legalHostShim = Join-Path $PrivateNativeLib 'host.js'
  $legalAgentShim = Join-Path $PrivateNativeLib 'agent.js'
  $legalSessionStoreShim = Join-Path $PrivateNativeLib 'session-store.js'
  $legalUiUrl = ([Uri]$legalUiIndex).AbsoluteUri
  $legalHostUrl = ([Uri]$legalHostShim).AbsoluteUri
  $legalAgentUrl = ([Uri]$legalAgentShim).AbsoluteUri
  $observerUrl = ([Uri]$ObserverPath).AbsoluteUri
  $settingsReadObserverUrl = ([Uri]$SettingsReadObserverPath).AbsoluteUri
  $legalSessionStoreUrl = ([Uri]$legalSessionStoreShim).AbsoluteUri
  foreach ($routeTarget in @(
    @{ Label = 'legal UI'; File = $legalUiIndex; Url = $legalUiUrl },
    @{ Label = 'legal Host'; File = $legalHostShim; Url = $legalHostUrl },
    @{ Label = 'legal Agent'; File = $legalAgentShim; Url = $legalAgentUrl },
    @{ Label = 'legal session store'; File = $legalSessionStoreShim; Url = $legalSessionStoreUrl },
    @{ Label = 'settings read observer'; File = $SettingsReadObserverPath; Url = $settingsReadObserverUrl },
    @{ Label = 'projection observer'; File = $ObserverPath; Url = $observerUrl }
  )) {
    Assert-File $routeTarget.File $routeTarget.Label
    $routeUri = [Uri]([string]$routeTarget.Url)
    if (-not $routeUri.IsAbsoluteUri -or $routeUri.IsFile -ne $true -or $routeUri.Scheme -cne 'file') {
      throw "route target is not an exact file URL: $($routeTarget.Label)"
    }
  }
  $suffixTemplate = @'
- id: session-controller
  disabled: true
- insert:
    - id: session-controller-private
      name: '@deepseek-ai/dsh-api-session-controller'
- id: ui-conversation
  disabled: true
- insert:
    - id: ui-conversation-private
      name: '@deepseek-ai/dsh-client-ui-conversation'
- insert:
    - id: t34-settings-read-observer
      name: '__SETTINGS_READ_OBSERVER_URL__'
      config:
        stateDir: __SETTINGS_READ_OBSERVER_STATE_JSON__
        hostModuleUrl: __LEGAL_HOST_URL__
- insert:
    - id: t34-projection-observer
      name: '__OBSERVER_URL__'
      config:
        stateDir: __OBSERVER_STATE_JSON__
        outputPath: __OBSERVER_OUTPUT_JSON__
        configEditorModuleUrl: !!js "process.getBuiltinModule('node:url').pathToFileURL(process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@deepseek-ai/dsh-config-editor')).href"
        settingsModuleUrl: !!js "process.getBuiltinModule('node:url').pathToFileURL(process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@deepseek-ai/dsh-settings')).href"
- id: legal-ui
  disabled: true
- insert:
    - id: legal-ui-t31-private
      name: __LEGAL_UI_URL__
- id: legal-host
  disabled: true
- insert:
    - id: legal-host-t31-private
      name: __LEGAL_HOST_URL__
      config:
        command: !!js "JSON.parse(process.env.LAWBENCH_SERVICE_CMD ?? '[]')"
        cwd: !!js process.env.LAWBENCH_SERVICE_CWD
        appData: !!js process.env.LOCALAPPDATA
        forwardPort: !!js "Number(process.env.T50_LLM_PORT)"
        env: !!js "JSON.parse(process.env.LAWBENCH_SERVICE_ENV ?? '{}')"
        skillDirs: !!js "JSON.parse(process.env.LAWBENCH_SKILL_DIRS ?? '[]')"
        officeRuntimeWorker: !!js process.env.T50_OFFICE_WORKER
- id: legal-session-store
  disabled: true
- insert:
    - id: legal-session-store-t31-private
      name: __LEGAL_SESSION_STORE_URL__
      config:
        backendModule: !!js "process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@deepseek-ai/dsh-session-persistence-jsonl')"
        compression: none
        defaultRoot: !!js dshHomePath('sessions')
        appData: !!js "process.platform === 'darwin' ? process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:os').homedir(), 'Library', 'Application Support', 'lawbench') : process.getBuiltinModule('node:path').join(process.env.LOCALAPPDATA ?? process.getBuiltinModule('node:os').homedir(), 'lawbench')"
        allowOutsideCase: false
        projectionCache:
          module: !!js "process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@deepseek-ai/dsh-session-projection-cache')"
          writeEveryEvents: 200
          writeIntervalMs: 5000
- id: preset-lawbench
  config:
    id: lawbench
    name: 律师工作台
    order: 1
    plugins:
      - id: persona
        name: '@deepseek-ai/dsh-persona'
        config:
          complete: true
          includeRuntimeContext: false
          prefix: !!js "process.getBuiltinModule('node:fs').readFileSync(process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('lawbench-dsh/persona.md'), 'utf8').replace(/^【草稿[^\\n]*\\n+/, '').trim()"
      - id: skill-filesystem
        name: '@deepseek-ai/dsh-skill-filesystem'
        config:
          providerName: lawbench-skills
          includeDefaultRoots: false
          watch: false
          customSkillDirs: !!js "((p, fs) => { if (process.platform === 'darwin') { const res = p.join(p.dirname(process.execPath), '..', 'Resources'); const packaged = fs.existsSync(p.join(res, 'app.asar')); return ['/Library/Application Support/lawbench/skills', packaged ? p.join(res, 'skills') : process.env.LAWBENCH_SKILLS_DIR].filter(Boolean) } const inst = p.dirname(process.execPath); const packaged = fs.existsSync(p.join(inst, 'resources', 'app.asar')); return [p.join(process.env.ProgramData ?? 'C:\\\\ProgramData', 'lawbench', 'skills'), packaged ? p.join(inst, 'skills') : process.env.LAWBENCH_SKILLS_DIR].filter(Boolean) })(process.getBuiltinModule('node:path'), process.getBuiltinModule('node:fs'))"
      - id: tool-skill
        name: '@deepseek-ai/dsh-tool-skill'
      - id: tool-ask-user
        name: '@deepseek-ai/dsh-tool-ask-user'
      - id: compaction
        name: cordis:group
        group: true
        isolate:
          compaction: true
          toolResultPruner: true
        config:
          - id: compaction-basic
            name: '@deepseek-ai/dsh-compaction-basic'
            config:
              thresholdRatio: 0.8
              headroomTokens: 16384
              maxTokens: 8192
          - id: tool-result-pruner
            name: '@deepseek-ai/dsh-compaction-tool-result-pruner'
            config:
              thresholdChars: 48000
              headChars: 32000
              tailChars: 8000
      - id: legal-agent
        name: __LEGAL_AGENT_URL__
        config:
          validateContracts: true
'@
  $observerStateJson = ConvertTo-Json -Compress -InputObject $StateDir
  $observerOutputJson = ConvertTo-Json -Compress -InputObject $ObserverOutputPath
  $suffix = $suffixTemplate.Replace('__LEGAL_UI_URL__', $legalUiUrl).Replace('__LEGAL_HOST_URL__', $legalHostUrl).Replace('__LEGAL_SESSION_STORE_URL__', $legalSessionStoreUrl).Replace('__LEGAL_AGENT_URL__', $legalAgentUrl).Replace('__SETTINGS_READ_OBSERVER_URL__', $settingsReadObserverUrl).Replace('__SETTINGS_READ_OBSERVER_STATE_JSON__', $observerStateJson).Replace('__OBSERVER_URL__', $observerUrl).Replace('__OBSERVER_STATE_JSON__', $observerStateJson).Replace('__OBSERVER_OUTPUT_JSON__', $observerOutputJson)
  if ($suffix.Contains('__LEGAL_', [StringComparison]::Ordinal) -or
      $suffix.Contains('__SETTINGS_', [StringComparison]::Ordinal) -or
      $suffix.Contains('__OBSERVER_', [StringComparison]::Ordinal)) {
    throw 'private profile route or observer placeholder remained after substitution'
  }
  $suffixBytes = [Text.UTF8Encoding]::new($false).GetBytes($suffix)
  $combinedBytes = [byte[]]::new($prefixBytes.Length + $suffixBytes.Length)
  [Array]::Copy($prefixBytes, 0, $combinedBytes, 0, $prefixBytes.Length)
  [Array]::Copy($suffixBytes, 0, $combinedBytes, $prefixBytes.Length, $suffixBytes.Length)
  [IO.File]::WriteAllBytes($ProfileOverlay, $combinedBytes)
  $overlayBytes = [IO.File]::ReadAllBytes($ProfileOverlay)
  $prefixHex = [Convert]::ToHexString($prefixBytes)
  $suffixHex = [Convert]::ToHexString($suffixBytes)
  $overlayHex = [Convert]::ToHexString($overlayBytes)
  if ($overlayHex.Length -ne ($prefixHex.Length + $suffixHex.Length) -or
      -not $overlayHex.StartsWith($prefixHex, [StringComparison]::Ordinal) -or
      -not $overlayHex.EndsWith($suffixHex, [StringComparison]::Ordinal)) {
    throw 'private profile overlay is not the exact original prefix plus private-runtime suffix'
  }
  $overlayText = [Text.Encoding]::UTF8.GetString($overlayBytes)
  foreach ($rowId in @(
    't34-settings-read-observer',
    't34-projection-observer',
    'session-controller',
    'session-controller-private',
    'ui-conversation',
    'ui-conversation-private'
  )) {
    $count = [regex]::Matches($overlayText, "(?m)^[ \t]*- id: $([regex]::Escape($rowId))[ \t]*\r?$").Count
    if ($count -ne 1) {
      throw "profile overlay row identity is not unique: $rowId"
    }
  }
  $overlayLf = $overlayText.Replace("`r`n", "`n").Replace("`r", "`n")
  $seedBlockLf = $seedBlock.Replace("`r`n", "`n").Replace("`r", "`n")
  $seedBlockCount = @(
    $overlayLf.Split([string[]]@($seedBlockLf), [StringSplitOptions]::None)
  ).Count - 1
  if ($seedBlockCount -ne 1) {
    throw 'required-unset seed block must remain exactly once in the completed profile'
  }
  $overlayLines = @($overlayLf.Split([string[]]@("`n"), [StringSplitOptions]::None))
  $settingsReadObserverRowLf = "    - id: t34-settings-read-observer`n      name: '$settingsReadObserverUrl'`n      config:`n        stateDir: $observerStateJson`n        hostModuleUrl: $legalHostUrl"
  $settingsReadObserverIndex = $overlayLf.IndexOf(
    $settingsReadObserverRowLf,
    [StringComparison]::Ordinal
  )
  $projectionObserverIndex = $overlayLf.IndexOf(
    '- id: t34-projection-observer',
    [StringComparison]::Ordinal
  )
  if ($settingsReadObserverIndex -lt 0 -or
      $projectionObserverIndex -lt 0 -or
      $settingsReadObserverIndex -ge $projectionObserverIndex) {
    throw 'settings read observer row must occur once before the projection observer'
  }
  foreach ($expectedLine in @(
    @{ Line = '    - id: t34-settings-read-observer'; Label = 'settings read observer insert row' },
    @{ Line = "      name: '$settingsReadObserverUrl'"; Label = 'settings read observer file URL' },
    @{ Line = "        stateDir: $observerStateJson"; Label = 'observer state directory'; Occurrences = 2 },
    @{ Line = "        hostModuleUrl: $legalHostUrl"; Label = 'settings read observer Host URL' },
    @{ Line = '    - id: t34-projection-observer'; Label = 'projection observer insert row' },
    @{ Line = "      name: '$observerUrl'"; Label = 'projection observer file URL' },
    @{ Line = "        stateDir: $observerStateJson"; Label = 'projection observer state directory'; Occurrences = 2 },
    @{ Line = "        outputPath: $observerOutputJson"; Label = 'projection observer output path' },
    @{ Line = '    - id: legal-ui-t31-private'; Label = 'legal UI insert row' },
    @{ Line = '    - id: legal-host-t31-private'; Label = 'legal Host insert row' },
    @{ Line = '    - id: legal-session-store-t31-private'; Label = 'legal session-store insert row' },
    @{ Line = '      - id: legal-agent'; Label = 'legal Agent preset row' },
    @{ Line = "      name: $legalUiUrl"; Label = 'legal UI file URL' },
    @{ Line = "      name: $legalHostUrl"; Label = 'legal Host file URL' },
    @{ Line = "      name: $legalSessionStoreUrl"; Label = 'legal session-store file URL' },
    @{ Line = "        name: $legalAgentUrl"; Label = 'legal Agent file URL' },
    @{ Line = '        allowOutsideCase: false'; Label = 'legal session-store case routing' },
    @{ Line = '          writeEveryEvents: 200'; Label = 'legal session-store projection cadence' },
    @{ Line = '          writeIntervalMs: 5000'; Label = 'legal session-store projection interval' },
    @{ Line = '          validateContracts: true'; Label = 'legal Agent contract validation' }
  )) {
    $count = @($overlayLines | Where-Object { $_ -ceq $expectedLine.Line }).Count
    $expectedCount = if ($expectedLine.ContainsKey('Occurrences')) {
      [int]$expectedLine.Occurrences
    } else {
      1
    }
    if ($count -ne $expectedCount) {
      throw "overlay literal line count mismatch ($($expectedLine.Label)): $($expectedLine.Line)"
    }
  }
  foreach ($expectedBlock in @(
    @{ Text = $settingsReadObserverRowLf; Label = 'settings read observer complete row' },
    @{ Text = "- id: legal-ui`n  disabled: true"; Label = 'built-in legal UI disable' },
    @{ Text = "- id: legal-host`n  disabled: true"; Label = 'built-in legal Host disable' },
    @{ Text = "- id: legal-session-store`n  disabled: true"; Label = 'built-in legal session-store disable' },
    @{ Text = "- id: preset-lawbench`n  config:`n    id: lawbench"; Label = 'complete Lawbench preset replacement' }
  )) {
    $count = @($overlayLf.Split([string[]]@($expectedBlock.Text), [StringSplitOptions]::None)).Count - 1
    if ($count -ne 1) {
      throw "overlay literal block must occur exactly once ($($expectedBlock.Label))"
    }
  }
  $credentialDisableCount = @(
    $overlayLf.Split([string[]]@("- id: legal-credentials`n  disabled: true"), [StringSplitOptions]::None)
  ).Count - 1
  if ($credentialDisableCount -ne 1 -or
      $overlayLf.Contains('lawbench-dsh/credentials', [StringComparison]::Ordinal) -or
      $overlayLf.Contains("- id: legal-credentials`n  disabled: false", [StringComparison]::Ordinal)) {
    throw 'production credential row must not be activated'
  }
  $seededPrefixOnDisk = [byte[]]::new($prefixBytes.Length)
  [Array]::Copy($overlayBytes, 0, $seededPrefixOnDisk, 0, $prefixBytes.Length)
  if (-not [Linq.Enumerable]::SequenceEqual($seededPrefixOnDisk, $prefixBytes)) {
    throw 'on-disk seeded prefix differs from the checked prefix'
  }
  $seededPrefixOnDiskText = [Text.Encoding]::UTF8.GetString($seededPrefixOnDisk)
  $seededPrefixOnDiskInverse = $seededPrefixOnDiskText.Remove($seedInsertAt, $seedBlock.Length)
  $seededPrefixOnDiskInverseBytes = [Text.UTF8Encoding]::new($false).GetBytes($seededPrefixOnDiskInverse)
  if (-not [Linq.Enumerable]::SequenceEqual($seededPrefixOnDiskInverseBytes, $originalPrefixBytes)) {
    throw 'on-disk seeded prefix inverse is not byte-exact with the original prefix'
  }
  $seededPrefixOnDiskSha256 = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($seededPrefixOnDisk)
  ).ToLowerInvariant()
  Write-JsonNoBom (Join-Path $StateDir 'required-unset-seed.json') ([ordered]@{
    schema = 'lawbench-t34-required-unset-seed-proof-v1'
    kind = 'required_unset_seed'
    namespace = 'llm-pi-ai'
    providerKey = 'external'
    providerLabel = 'T34 required-unset synthetic'
    seedModelId = 't34-required-unset-synthetic'
    ownedOverlayPath = $ProfileOverlay
    beforePrefixBytes = $originalPrefixBytes.Length
    beforePrefixSha256 = $originalPrefixSha256
    afterPrefixBytes = $seededPrefixOnDisk.Length
    afterPrefixSha256 = $seededPrefixOnDiskSha256
    insertionCount = $seedOccurrences
    currentBExternalLlmEnabled = [bool]$settingsProof.external_llm.enabled
    actualKeyValuesRecorded = 0
    rawConfigRecorded = $false
  })
}

function New-IsolatedBaseEnvironment {
  $environment = [Collections.Generic.Dictionary[string, string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($name in @(
    'SystemRoot', 'WINDIR', 'SystemDrive', 'PATH', 'PATHEXT', 'COMSPEC',
    'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'OS',
    'USERNAME', 'USERDOMAIN', 'LOGONSERVER', 'SESSIONNAME'
  )) {
    $value = [Environment]::GetEnvironmentVariable($name, [EnvironmentVariableTarget]::Process)
    if ($null -ne $value) { $environment[$name] = $value }
  }
  $environment['HOME'] = $PrivateHome
  $environment['USERPROFILE'] = $PrivateHome
  $environment['HOMEDRIVE'] = [IO.Path]::GetPathRoot($PrivateHome).TrimEnd('\')
  $environment['HOMEPATH'] = $PrivateHome.Substring([IO.Path]::GetPathRoot($PrivateHome).Length - 1)
  $environment['APPDATA'] = $Roaming
  $environment['LOCALAPPDATA'] = $PrivateAppdata
  $environment['HostLB_APPDATA'] = $PrivateAppdata
  $environment['PROGRAMDATA'] = $ProgramData
  $environment['TEMP'] = $PrivateTemp
  $environment['TMP'] = $PrivateTemp
  $environment['TMPDIR'] = $PrivateTemp
  return $environment
}

function Copy-IsolatedEnvironment($SourceEnvironment) {
  $environment = [Collections.Generic.Dictionary[string, string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($entry in $SourceEnvironment.GetEnumerator()) {
    $environment[$entry.Key] = $entry.Value
  }
  return $environment
}

function Start-OwnedTarget(
  [string]$Name,
  [string]$ProcessPath,
  [string[]]$Arguments,
  [string]$WorkingDirectory,
  $Environment,
  [bool]$CreateNoWindow
) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmssfff'
  $specPath = Join-Path $StateDir "$Name-relay-$stamp.json"
  $handoffPath = Join-Path $StateDir "$Name-handoff-$stamp.json"
  $spec = [ordered]@{
    processPath = $ProcessPath
    arguments = @($Arguments)
    workingDirectory = $WorkingDirectory
    createNoWindow = $CreateNoWindow
    stdoutLog = Join-Path $LogDir "$Name-$stamp.stdout.log"
    stderrLog = Join-Path $LogDir "$Name-$stamp.stderr.log"
    handoffPath = $handoffPath
    environment = $Environment
  }
  Write-JsonNoBom $specPath $spec
  $relay = Start-Process -FilePath $PwshPath -ArgumentList @(
    '-NoProfile', '-File', $PSCommandPath, '-RunRoot', $rootFull, 
    '-LaunchSpecPath', $specPath
  ) -WindowStyle Hidden -PassThru
  $relayRecord = New-IdentityRecord $relay.Id 'relay' $specPath
  Add-IdentityRecord $relayRecord

  $deadline = (Get-Date).AddSeconds(15)
  while (-not (Test-Path -LiteralPath $handoffPath -PathType Leaf)) {
    if ($relay.HasExited) { throw "$Name relay exited before publishing identity" }
    if ((Get-Date) -gt $deadline) { throw "$Name relay did not publish identity" }
    Start-Sleep -Milliseconds 100
  }
  $record = Get-Content -Raw -LiteralPath $handoffPath | ConvertFrom-Json
  if (-not $record.ok) { throw "$Name target launch failed" }
  $targetRecord = [pscustomobject]@{
    pid = [int]$record.pid
    role = $Name
    executablePath = [string]$record.executablePath
    startTimeUtcTicks = [string]$record.startTimeUtcTicks
    marker = $UserData
    recordedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  Add-IdentityRecord $targetRecord
  return [pscustomobject]@{
    target = $targetRecord
    relay = $relayRecord
    stdoutLog = $spec.stdoutLog
    stderrLog = $spec.stderrLog
  }
}

function Write-RunState([string]$Phase, [string]$Reason = '') {
  $state = [ordered]@{
    schemaVersion = 1
    task = 'T34-private-projection-observer'
    phase = $Phase
    reason = $Reason
    runRoot = $rootFull
    supervisor = $script:SupervisorRecord
    startedAt = $script:StartedAt
    deadlineUtc = $script:DeadlineUtc
    rootPid = $script:ElectronPid
    nativePort = $script:NativePort
    nativePid = $script:NativePid
    processes = @($script:ProcessRecords)
    paths = [ordered]@{
      gui = $GuiRoot
      state = $StateDir
      logs = $LogDir
      dshHome = $DshHome
      profileNodeModules = $ProfileNodeModules
      privateNative = $PrivateNative
      privateNativePackage = $PrivateNativePackage
      privateBuild = $PrivateBuildRoot
      electronUserData = $UserData
      localAppdata = $PrivateAppdata
      home = $PrivateHome
      temp = $PrivateTemp
      hostSkills = $HostSkills
      nativeRun = $rootFull
    }
  }
  Write-JsonNoBom $StatePath $state
}

function Update-TreeRecords {
  $all = @()
  try { $all = @(Get-CimInstance Win32_Process -ErrorAction Stop) } catch { return }
  $byParent = @{}
  foreach ($entry in $all) {
    $parentPid = [int]$entry.ParentProcessId
    if (-not $byParent.ContainsKey($parentPid)) {
      $byParent[$parentPid] = [Collections.Generic.List[object]]::new()
    }
    $byParent[$parentPid].Add($entry)
  }
  $queue = [Collections.Generic.Queue[int]]::new()
  $visited = [Collections.Generic.HashSet[int]]::new()
  [void]$queue.Enqueue([int]$script:ElectronPid)
  $allowedExecutables = @($Electron, $Node, $Python)
  while ($queue.Count -gt 0) {
    $parentPid = $queue.Dequeue()
    if (-not $byParent.ContainsKey($parentPid)) { continue }
    foreach ($child in $byParent[$parentPid]) {
      $childPid = [int]$child.ProcessId
      if (-not $visited.Add($childPid)) { continue }
      [void]$queue.Enqueue($childPid)
      $identity = Get-ExactIdentity $childPid
      if (-not $identity) { continue }
      $allowed = $false
      foreach ($executable in $allowedExecutables) {
        if ($identity.executablePath -ieq $executable) { $allowed = $true; break }
      }
      if (-not $allowed) { continue }
      $marker = $null
      foreach ($candidate in @($rootFull, $Project, $PrimaryRuntime, $NativeEntry, $UserData)) {
        if ($identity.commandLine.IndexOf($candidate, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
          $marker = $candidate
          break
        }
      }
      if (-not $marker) { continue }
      $role = if ($identity.commandLine.IndexOf($NativeEntry, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
          $identity.commandLine.IndexOf('--serve', [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        'native-service'
      } elseif ($identity.commandLine.IndexOf('dsh-desktop-host', [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
          $identity.commandLine.IndexOf('index.js', [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        'host'
      } elseif ($identity.executablePath -ieq $Electron) {
        'electron-child'
      } elseif ($identity.executablePath -ieq $Node) {
        'node-child'
      } else {
        'python-helper'
      }
      Add-IdentityRecord ([pscustomobject]@{
        pid = $identity.pid
        role = $role
        executablePath = $identity.executablePath
        startTimeUtcTicks = $identity.startTimeUtcTicks
        marker = $marker
        recordedAt = (Get-Date).ToUniversalTime().ToString('o')
      })
    }
  }

  $startedPath = Join-Path $rootFull 'started.json'
  if (Test-Path -LiteralPath $startedPath -PathType Leaf) {
    try {
      $started = Get-Content -Raw -LiteralPath $startedPath | ConvertFrom-Json
      $nativePid = [int]$started.pid
      if ($nativePid -gt 0) {
        $identity = Get-ExactIdentity $nativePid
        if ($identity -and $identity.executablePath -ieq $Python -and
            $identity.commandLine.IndexOf($NativeEntry, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
            $identity.commandLine.IndexOf($rootFull, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
          Add-IdentityRecord ([pscustomobject]@{
            pid = $nativePid
            role = 'native-service'
            executablePath = $identity.executablePath
            startTimeUtcTicks = $identity.startTimeUtcTicks
            marker = $rootFull
            recordedAt = (Get-Date).ToUniversalTime().ToString('o')
          })
          $script:NativePid = $nativePid
        }
      }
      $script:NativePort = [int]$started.host_port
    } catch {}
  }
}

function Stop-ExactRecord($Record) {
  if (-not (Test-ExactRecord $Record)) { return $false }
  Stop-Process -Id ([int]$Record.pid) -Force -ErrorAction Stop
  return $true
}

function Test-PortClosed([int]$Port) {
  if ($Port -le 0) { return [pscustomobject]@{ closed = $false; verified = $false; reason = 'port_not_recorded' } }
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

function Stop-OwnedRun([string]$Reason) {
  Update-TreeRecords
  $rootRecord = $script:ProcessRecords | Where-Object role -eq 'electron' | Select-Object -First 1
  if ($rootRecord -and (Test-ExactRecord $rootRecord)) {
    $process = Get-Process -Id ([int]$rootRecord.pid) -ErrorAction SilentlyContinue
    if ($process) {
      try { [void]$process.CloseMainWindow() } catch {}
      $deadline = (Get-Date).AddSeconds(12)
      while (-not $process.HasExited -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 250
        $process.Refresh()
      }
    }
  }
  Update-TreeRecords
  $stopped = [Collections.Generic.List[int]]::new()
  $pythonForced = $false
  $records = @($script:ProcessRecords | Sort-Object {
    switch ($_.role) {
      'native-service' { 0 }
      'python-helper' { 1 }
      'node-child' { 3 }
      'host' { 4 }
      'electron-child' { 4 }
      'electron' { 5 }
      'relay' { 6 }
      default { 7 }
    }
  })
  foreach ($record in $records) {
    if ($record.role -eq 'supervisor' -or [int]$record.pid -eq $PID) { continue }
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
    $remaining = @($script:ProcessRecords | Where-Object {
      $_.role -ne 'supervisor' -and (Test-ExactRecord $_)
    } | ForEach-Object pid)
    $portCheck = Test-PortClosed $script:NativePort
    if ($remaining.Count -eq 0 -and $portCheck.closed) { break }
    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $settleDeadline)
  $report = [ordered]@{
    stoppedAt = (Get-Date).ToUniversalTime().ToString('o')
    reason = $Reason
    processRecords = @($script:ProcessRecords)
    stoppedPids = @($stopped | Select-Object -Unique)
    remainingPids = $remaining
    nativePort = $script:NativePort
    portClosed = [bool]$portCheck.closed
    portVerificationAvailable = [bool]$portCheck.verified
    portVerificationError = [string]$portCheck.reason
    pythonForcedStop = $pythonForced
    pythonCleanupClaimed = $false
  }
  Write-JsonNoBom $StopReportPath $report
  return ($remaining.Count -eq 0 -and $portCheck.closed)
}

function Invoke-OwnedSupervisor {
  $script:ProcessRecords = @()
  $script:StartedAt = (Get-Date).ToUniversalTime().ToString('o')
  $script:DeadlineUtc = ((Get-Date).ToUniversalTime()).AddSeconds($LifetimeSeconds).ToString('o')
  $script:ElectronPid = 0
  $script:NativePid = 0
  $script:NativePort = 0
  $lockStream = $null
  $electronLaunch = $null
  $terminationReason = 'unknown'
  try {
    Assert-Preflight
    Prepare-PrivateProfile
    $lockPath = Join-Path $StateDir 'run.lock'
    $lockStream = [IO.File]::Open($lockPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    $supervisorIdentity = Get-ExactIdentity $PID
    if (-not $supervisorIdentity) { throw 'cannot record supervisor identity' }
    $script:SupervisorRecord = [pscustomobject]@{
      pid = $supervisorIdentity.pid
      role = 'supervisor'
      executablePath = $supervisorIdentity.executablePath
      startTimeUtcTicks = $supervisorIdentity.startTimeUtcTicks
      marker = $rootFull
      recordedAt = (Get-Date).ToUniversalTime().ToString('o')
    }
    Write-RunState 'prepared'

    $baseEnvironment = New-IsolatedBaseEnvironment
    $electronEnvironment = Copy-IsolatedEnvironment $baseEnvironment
    $electronEnvironment['DSH_HOME'] = $DshHome
    $electronEnvironment['DSH_DESKTOP_DSH_DIR'] = $Project
    $electronEnvironment['DSH_DESKTOP_USER_DATA_DIR'] = $UserData
    $electronEnvironment['DSH_DESKTOP_PRIMARY_RUNTIME_DIR'] = $PrimaryRuntime
    $electronEnvironment['DSH_DESKTOP_OPEN_DEVTOOLS'] = '0'
    $electronEnvironment['DSH_TELEMETRY_DISABLED'] = '1'
    $electronEnvironment['DSH_TELEMETRY_MODE'] = 'DISABLED'
    $electronEnvironment['DSH_DESKTOP_UPDATE_CHECK_INTERVAL_MS'] = '2147483647'
    $electronEnvironment['DSH_DESKTOP_UPDATE_CHECK_MAX_BACKOFF_MS'] = '2147483647'
    $electronEnvironment['DSH_DESKTOP_UPDATE_CHECK_JITTER'] = '0'
    $electronEnvironment['LAWBENCH_HOST_PORT'] = '0'
    $electronEnvironment['LAWBENCH_SKILLS_DIR'] = $HostSkills
    $electronEnvironment['LAWBENCH_SKILL_DIRS'] = ConvertTo-Json -Compress -InputObject @($HostSkills)
    $electronEnvironment['LAWBENCH_SERVICE_CWD'] = $ServiceRoot
    $electronEnvironment['LAWBENCH_SERVICE_CMD'] = ConvertTo-Json -Compress -InputObject @(
      $Python, '-B', '-X', 'utf8', $NativeEntry, '--serve', '--root', $rootFull, '--seconds', [string]$LifetimeSeconds
    )
    $electronEnvironment['LAWBENCH_SERVICE_ENV'] = '{}'
    $electronEnvironment['T50_LLM_PORT'] = '65005'
    $electronEnvironment['T50_GUARD_READY_FILE'] = Join-Path $LogDir 'guard-ready.log'
    $electronEnvironment['T50_NETWORK_DENIAL_LOG'] = Join-Path $LogDir 'network-denied.log'
    $resolverUrl = ([Uri]$Resolver).AbsoluteUri
    $privateProviderBindingUrl = ([Uri]$PrivateProviderBinding).AbsoluteUri
    if ($privateProviderBindingUrl -isnot [string] -or
        $privateProviderBindingUrl -cne 'file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T34/SettingsReadSignatureGUI-20261030-134212/private-provider-binding.mjs') {
      throw 'private provider binding file URL mismatch'
    }
    $electronEnvironment['NODE_OPTIONS'] = "--import=$resolverUrl --import=$privateProviderBindingUrl --require=$Guard"
    $electronEnvironment['HTTP_PROXY'] = 'http://127.0.0.1:9'
    $electronEnvironment['HTTPS_PROXY'] = 'http://127.0.0.1:9'
    $electronEnvironment['ALL_PROXY'] = 'http://127.0.0.1:9'
    $electronEnvironment['NO_PROXY'] = '127.0.0.1,localhost,::1'
    $electronEnvironment['ELECTRON_ENABLE_LOGGING'] = '1'

    $electronArguments = @(
      '--proxy-server=http://127.0.0.1:9',
      '--proxy-bypass-list=127.0.0.1;localhost',
      "--user-data-dir=$UserData",
      $DesktopRoot
    )
    $electronLaunch = Start-OwnedTarget `
      -Name 'electron' `
      -ProcessPath $Electron `
      -Arguments $electronArguments `
      -WorkingDirectory $DesktopRoot `
      -Environment $electronEnvironment `
      -CreateNoWindow $false
    $script:ElectronPid = [int]$electronLaunch.target.pid
    $script:DeadlineUtc = ((Get-Date).ToUniversalTime()).AddSeconds($LifetimeSeconds).ToString('o')
    Write-RunState 'launching'

    $readyPath = Join-Path $rootFull 'ready.json'
    $startedPath = Join-Path $rootFull 'started.json'
    $readyDeadline = (Get-Date).AddSeconds(45)
    while (-not (Test-Path -LiteralPath $readyPath -PathType Leaf)) {
      Update-TreeRecords
      Write-RunState 'launching'
      if (-not (Test-ExactRecord $electronLaunch.target)) {
        throw 'Electron exited before the native service published ready.json'
      }
      if ((Get-Date) -gt $readyDeadline) {
        throw 'native service did not publish ready.json within 45 seconds'
      }
      Start-Sleep -Milliseconds 250
    }
    Update-TreeRecords
    if ($script:NativePid -le 0 -or -not (Test-Path -LiteralPath $startedPath -PathType Leaf)) {
      throw 'native service started.json/PID identity is incomplete'
    }
    if ($script:NativePort -lt 1 -or $script:NativePort -gt 65535) {
      throw 'native service assigned port is not recorded'
    }
    Write-RunState 'running'
    Write-JsonNoBom $HandoffPath ([ordered]@{
      ok = $true
      runRoot = $rootFull
      state = $StatePath
      rootPid = $script:ElectronPid
      nativePid = $script:NativePid
      nativePort = $script:NativePort
      deadlineUtc = $script:DeadlineUtc
      stopScript = Join-Path $PSScriptRoot 'stop.ps1'
    })

    $lastDiscovery = Get-Date
    while ($true) {
      if (Test-Path -LiteralPath $StopRequestPath -PathType Leaf) {
        $terminationReason = 'requested'
        break
      }
      if (-not (Test-ExactRecord $electronLaunch.target)) {
        $terminationReason = 'root-exited'
        break
      }
      if ((Get-Date).ToUniversalTime() -ge [datetime]::Parse($script:DeadlineUtc).ToUniversalTime()) {
        $terminationReason = 'outer-budget'
        break
      }
      if (((Get-Date) - $lastDiscovery).TotalMilliseconds -ge 750) {
        Update-TreeRecords
        Write-RunState 'running'
        $lastDiscovery = Get-Date
      }
      Start-Sleep -Milliseconds 250
    }
    $clean = Stop-OwnedRun $terminationReason
    Write-RunState $(if ($clean) { 'stopped' } else { 'stop-incomplete' }) $terminationReason
    if (-not $clean) { return 1 }
    return 0
  } catch {
    $terminationReason = 'exception'
    try {
      if (-not (Test-Path -LiteralPath $StateDir)) { New-Item -ItemType Directory -Path $StateDir | Out-Null }
      Write-JsonNoBom $LaunchErrorPath ([ordered]@{
        at = (Get-Date).ToUniversalTime().ToString('o')
        error = $_.Exception.Message
        runRoot = $rootFull
        rootRetained = $true
      })
    } catch {}
    try {
      if ($electronLaunch -or $ProcessRecords.Count -gt 0) { [void](Stop-OwnedRun $terminationReason) }
    } catch {}
    try { Write-RunState 'failed' $terminationReason } catch {}
    return 1
  } finally {
    if ($lockStream) { $lockStream.Dispose() }
  }
}

if ($OwnedSupervisor) {
  $code = Invoke-OwnedSupervisor
  exit $code
}

if ($rootFull -notmatch '\\T34-private-projection-observer-[0-9]{8}-[0-9]{6}$') {
  throw "bad run root: $rootFull"
}
if (Test-Path -LiteralPath $HandoffPath) {
  throw "run already handed off; fresh root required: $rootFull"
}
$supervisor = Start-Process -FilePath $PwshPath -ArgumentList @(
  '-NoProfile', '-File', $PSCommandPath,
  '-OwnedSupervisor', '-RunRoot', $rootFull,
  '-LifetimeSeconds', [string]$LifetimeSeconds
) -WindowStyle Hidden -PassThru

$launchDeadline = (Get-Date).AddSeconds(70)
while (-not (Test-Path -LiteralPath $HandoffPath -PathType Leaf)) {
  if (Test-Path -LiteralPath $LaunchErrorPath -PathType Leaf) {
    $failure = Get-Content -Raw -LiteralPath $LaunchErrorPath | ConvertFrom-Json
    throw "T34 projection observer launch refused/failed: $($failure.error)"
  }
  if ($supervisor.HasExited) { throw "T31 branch GUI supervisor exited before handoff with code $($supervisor.ExitCode)" }
  if ((Get-Date) -gt $launchDeadline) { throw 'T31 branch GUI supervisor did not hand off within 70 seconds' }
  Start-Sleep -Milliseconds 250
}
$handoff = Get-Content -Raw -LiteralPath $HandoffPath | ConvertFrom-Json
$handoff | ConvertTo-Json -Depth 5
