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
          $stdoutWriter.WriteLine($line)
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
$EvidenceRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421'
$Project = Join-Path $EvidenceRoot 'project'
$E50Runtime = Join-Path $EvidenceRoot 'runtime'
$PrimaryRuntime = Join-Path $RepoRoot 'dsh\apps\desktop\.desktop-build\targets\win-x64\runtime\primary-runtime'
$DesktopRoot = Join-Path $RepoRoot 'dsh\apps\desktop'
$Electron = Join-Path $DesktopRoot 'node_modules\electron\dist\electron.exe'
$Node = 'E:\node\node.exe'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\TaskSelectionEntry-20261025-154140\server.py'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$ServiceRoot = 'D:/Lawbeach/lawbench-B/service'
$RunsRoot = Split-Path -Parent $NativeEntry | ForEach-Object { Join-Path $_ 'runs' }
$NativeEntrySha256 = 'ed7be2e8530f128d3068e793cc04c0d05deb7d68aefd243353c428df06d5fd34'
$Guard = Join-Path $E50Runtime 'network-guard.cjs'
$Resolver = Join-Path $E50Runtime 'resolve-from-dsh.mjs'
$SidecarScript = Join-Path $E50Runtime 'fake-sidecars.mjs'
$ReplyFixture = Join-Path $EvidenceRoot 'fixtures\fake-llm-reply.md'
$ExpectedHead = 'a23271abee333a9a256fd46a3141da16975c2380'
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
$DshHome = Join-Path $GuiRoot 'dsh-home'
$UserData = Join-Path $GuiRoot 'electron-user-data'
$HostSkills = Join-Path $GuiRoot 'host-skills'
$PrivatePlugin = Join-Path $GuiRoot 'privateplugin'
$PrivatePluginLib = Join-Path $PrivatePlugin 'lib'
$PrivatePluginPackage = Join-Path $PrivatePlugin 'package.json'
$PrivatePluginIndex = Join-Path $PrivatePluginLib 'index.js'
$PrivateNative = Join-Path $GuiRoot 'private-native'
$PrivateNativeLib = Join-Path $PrivateNative 'lib'
$PrivateNativePackage = Join-Path $PrivateNative 'package.json'
$ProfileOverlay = Join-Path $GuiRoot 'dsh-home\profiles\desktop\cordis.patch.yml'
$PrivateHome = Join-Path $rootFull 'private\home'
$PrivateAppdata = Join-Path $rootFull 'private\appdata'
$PrivateTemp = Join-Path $rootFull 'private\temp'
$Roaming = Join-Path $rootFull 'private\roaming'
$ProgramData = Join-Path $rootFull 'private\programdata'
$WikiBuildCurrent = 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-wiki-build-root-full-20261025-1123\current'
$WikiEmptyCurrent = 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-wiki-empty-root-full-20261025-1120\current'
$T34CoreBuildCurrent = 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-core-build-root-full-20261025-144914\current'
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

function Assert-Sha256([string]$Path, [string]$Expected, [string]$Label) {
  Assert-File $Path $Label
  if ((Get-Sha256 $Path) -ne $Expected) {
    throw "$Label hash mismatch: $Path"
  }
}

function Assert-NoReparsePath([string]$Path, [switch]$AllowMissingTail) {
  $full = [IO.Path]::GetFullPath($Path)
  $driveRoot = [IO.Path]::GetPathRoot($full)
  $current = $driveRoot
  foreach ($segment in (($full.Substring($driveRoot.Length)) -split '[\\/]+')) {
    if (-not $segment) { continue }
    $current = Join-Path $current $segment
    if (-not (Test-Path -LiteralPath $current)) {
      if ($AllowMissingTail) { continue }
      throw "path component missing: $current"
    }
    $item = Get-Item -LiteralPath $current -Force
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

$AssetPins = @(
  @{ Path = 'dsh-ext\ui\settings.tsx'; Sha = 'af20dbd621065bc36880215f99229ca7c071112cd76363f44795af720066e64d'; Frozen = '00-settings.tsx' },
  @{ Path = 'dsh-ext\tests\t34-projection-error.spec.ts'; Sha = '6e9733c4e843d8b910c8fac785cc93836426f72fb629a95d588522aec5989ed0'; Frozen = '01-t34-projection-error.spec.ts' },
  @{ Path = 'docs\plan\evidence\T50\20261023-211421\start.ps1'; Sha = '95ce7bac006be1e8a36b6ae5e5966412ca6a0edc4cdecdf6022cbc3eb412ebf0'; Frozen = '02-start.ps1' },
  @{ Path = 'dsh-ext\lib\agent.js'; Sha = 'b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b'; Frozen = 'agent.js' },
  @{ Path = 'dsh-ext\lib\client.js'; Sha = 'a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46'; Frozen = 'client.js' },
  @{ Path = 'dsh-ext\lib\credentials.js'; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1'; Frozen = 'credentials.js' },
  @{ Path = 'dsh-ext\lib\host.js'; Sha = 'a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994'; Frozen = 'host.js' },
  @{ Path = 'dsh-ext\lib\index.js'; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956'; Frozen = 'index.js' },
  @{ Path = 'dsh-ext\lib\session-store.js'; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762'; Frozen = 'session-store.js' },
  @{ Path = 'dsh-ext\tests\t34-provider.spec.ts'; Sha = '85ab25a0e3b3b360d35630fd6996187ac8f30e33e2b35379ff93f8082780b716'; Frozen = '09-t34-provider.spec.ts' },
  @{ Path = 'dsh-ext\tests\settings-t34.spec.ts'; Sha = '14b9e21982a6ec0d4cf51ebde716f82c1e91cddeac660eb7f3a6a312f94751c3'; Frozen = '10-settings-t34.spec.ts' }
)

$CoreBuildLibPaths = @(
  'dsh-ext\lib\agent.js',
  'dsh-ext\lib\client.js',
  'dsh-ext\lib\credentials.js',
  'dsh-ext\lib\host.js',
  'dsh-ext\lib\index.js',
  'dsh-ext\lib\session-store.js'
)

$WikiPluginLibPins = @(
  @{ Name = 'agent.js'; Sha = 'b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b' },
  @{ Name = 'client.js'; Sha = 'a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46' },
  @{ Name = 'credentials.js'; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' },
  @{ Name = 'host.js'; Sha = 'a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994' },
  @{ Name = 'index.js'; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' },
  @{ Name = 'session-store.js'; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' }
)

function Assert-Preflight {
  if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
    throw "run root must be a direct child of $runsFull"
  }
  if ($rootFull -notmatch '\\T33-host-[0-9]{8}-[0-9]{6}$') {
    throw "bad run root name: $rootFull"
  }
  Assert-NoReparsePath $rootFull
  Assert-NoReparsePath $Project
  Assert-NoReparsePath $PrimaryRuntime
  Assert-NoReparsePath $DesktopRoot
  Assert-Sha256 $NativeEntry $NativeEntrySha256 'pinned native entry'
  Assert-Sha256 $Guard 'cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130' 'original network guard'
  Assert-Sha256 $Resolver '1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208' 'original resolver'
  Assert-Sha256 (Join-Path $Project 'cordis.patch.yml') '7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f' 'profile patch source'
  Assert-Sha256 (Join-Path $Project 't50-memory-credentials.mjs') 'c4d0fefd428086416055f1350b0fb6e7cf1a7e14a3912a1e5796500e7e26377a' 'memory provider source'
  Assert-Sha256 (Join-Path $E50Runtime 'dsh-home\profiles\desktop\package.json') 'bb7315c3844542261d160da20c0b9c963b5e56464cb81f546862fb2d46f43c3f' 'profile package source'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\package.json') '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794' 'private plugin package source'
  Assert-File $Node 'pinned Node'
  Assert-File $Electron 'pinned Electron'
  Assert-File $SidecarScript 'original fake sidecars'
  Assert-File $ReplyFixture 'synthetic sidecar reply'
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

  $frozenRoot = 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-projection-root-full-20261025-065119\current'
  foreach ($pin in $AssetPins) {
    Assert-Sha256 (Join-Path $RepoRoot $pin.Path) $pin.Sha "pinned source $($pin.Path)"
    if ($CoreBuildLibPaths -contains $pin.Path) {
      Assert-Sha256 (Join-Path $T34CoreBuildCurrent $pin.Frozen) $pin.Sha "frozen source $($pin.Frozen)"
    } else {
      Assert-Sha256 (Join-Path $frozenRoot $pin.Frozen) $pin.Sha "frozen source $($pin.Frozen)"
    }
  }
  Assert-Sha256 (Join-Path $WikiEmptyCurrent 'wiki-card.tsx') 'aa3080aff89e12caf173e838ef6635203ed51858a64c5e93ab58521de5db5e5a' 'frozen wiki source'
  Assert-Sha256 (Join-Path $WikiEmptyCurrent 'wiki-card.spec.ts') 'ae7089e08404237f57010f07c395f6870ac90e51e42a749d38d50801d34ec984' 'frozen wiki test'
  foreach ($pin in $WikiPluginLibPins) {
    Assert-Sha256 (Join-Path $RepoRoot "dsh-ext\lib\$($pin.Name)") $pin.Sha "private plugin source $($pin.Name)"
  }
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\agent.js') '3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43' 'runtime lib agent.js'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\client.js') 'e26b9f922b1c57a88d3e209fe1b0119d0e4f6381f02759afa23f629ebe5f8661' 'runtime lib client.js'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\credentials.js') '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' 'runtime lib credentials.js'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\host.js') '4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8' 'runtime lib host.js'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\index.js') 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' 'runtime lib index.js'
  Assert-Sha256 (Join-Path $Project 'node_modules\lawbench-dsh\lib\session-store.js') '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' 'runtime lib session-store.js'

  $preparedPath = Join-Path $rootFull 'prepared.json'
  Assert-File $preparedPath 'native prepared manifest'
  $manifest = Get-Content -Raw -LiteralPath $preparedPath | ConvertFrom-Json
  if ($manifest.format -ne 'T33-host-entry-prepared-v1') {
    throw "unexpected prepared format: $($manifest.format)"
  }
  if ($manifest.expected_head -ne 'dc56a93be4b07dbe7a48863e3135351659817fb5') {
    throw 'unexpected native entry source head'
  }
  if ($manifest.paths.root.canonical -ine $rootFull -or
      $manifest.paths.case.canonical -ine (Join-Path $rootFull 'case') -or
      $manifest.paths.appdata.canonical -ine $PrivateAppdata) {
    throw 'prepared canonical paths changed'
  }
  foreach ($property in $manifest.source.PSObject.Properties) {
    $sourcePath = if ($property.Name -ceq 'entry/server.py') {
      $NativeEntry
    } else {
      Join-Path $BProductRoot $property.Name
    }
    Assert-Sha256 $sourcePath ([string]$property.Value.sha256) "native prepared source $($property.Name)"
  }
  Assert-Sha256 (Join-Path $rootFull 'private\appdata\settings.json') ([string]$manifest.settings.sha256) 'prepared settings'
  Assert-Sha256 (Join-Path $rootFull 'private\appdata\daily-case.json') ([string]$manifest.daily_marker.sha256) 'prepared daily marker'
  if (@(Get-ChildItem -LiteralPath (Join-Path $rootFull 'case') -Force).Count -ne 0) {
    throw 'prepared case root is not empty'
  }
  foreach ($artifact in @('started.json', 'ready.json', 'final-metadata.json', 'loop-closed.json', 'requests.ndjson', 'run-error.json')) {
    if (Test-Path -LiteralPath (Join-Path $rootFull $artifact)) {
      throw "root already served or reused: $artifact"
    }
  }
  if (Test-Path -LiteralPath $GuiRoot) {
    throw "GUI run directory already exists; fresh root required: $GuiRoot"
  }
}

function Prepare-PrivateProfile {
  foreach ($directory in @(
    $GuiRoot, $StateDir, $LogDir, $DshHome, $UserData, $HostSkills,
    $Roaming, $ProgramData,
    (Join-Path $DshHome 'profiles\desktop'), $PrivatePlugin, $PrivatePluginLib,
    $PrivateNative, $PrivateNativeLib
  )) {
    if (Test-Path -LiteralPath $directory) { throw "fresh directory already exists: $directory" }
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  Assert-NoReparsePath $PrivatePlugin
  Assert-NoReparsePath $PrivateNative
  foreach ($directory in @($PrivateHome, $PrivateAppdata, $PrivateTemp)) {
    Assert-Directory $directory 'native private directory'
  }

  $profileDir = Join-Path $DshHome 'profiles\desktop'
  $copies = @(
    @{ Source = Join-Path $E50Runtime 'dsh-home\profiles\desktop\package.json'; Target = Join-Path $profileDir 'package.json'; Sha = 'bb7315c3844542261d160da20c0b9c963b5e56464cb81f546862fb2d46f43c3f' },
    @{ Source = Join-Path $Project 'cordis.patch.yml'; Target = Join-Path $profileDir 'cordis.patch.yml'; Sha = '7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f' },
    @{ Source = Join-Path $Project 't50-memory-credentials.mjs'; Target = Join-Path $profileDir 't50-memory-credentials.mjs'; Sha = 'c4d0fefd428086416055f1350b0fb6e7cf1a7e14a3912a1e5796500e7e26377a' }
  )
  foreach ($copy in $copies) {
    Copy-Item -LiteralPath $copy.Source -Destination $copy.Target
    Assert-Sha256 $copy.Target $copy.Sha 'materialized private profile'
  }

  $nativePackageJson = '{"name":"lawbench-t34-native-private","type":"module","private":true}'
  [IO.File]::WriteAllText($PrivateNativePackage, $nativePackageJson, [Text.UTF8Encoding]::new($false))
  if ([IO.File]::ReadAllText($PrivateNativePackage) -cne $nativePackageJson) {
    throw 'private native module metadata changed'
  }
  $nativePackage = Get-Content -Raw -LiteralPath $PrivateNativePackage | ConvertFrom-Json
  if ($nativePackage.name -cne 'lawbench-t34-native-private' -or
      $nativePackage.type -cne 'module' -or
      $nativePackage.private -ne $true -or
      ($nativePackage.PSObject.Properties.Name -join ',') -cne 'name,type,private') {
    throw 'private native module metadata changed'
  }

  $pluginPackageSource = Join-Path $Project 'node_modules\lawbench-dsh\package.json'
  Copy-Item -LiteralPath $pluginPackageSource -Destination $PrivatePluginPackage
  Assert-Sha256 $PrivatePluginPackage '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794' 'materialized private plugin package'
  $privatePackage = Get-Content -Raw -LiteralPath $PrivatePluginPackage | ConvertFrom-Json
  if ($privatePackage.name -cne 'lawbench-dsh' -or
      $privatePackage.type -cne 'module' -or
      $privatePackage.exports.'./client' -cne './lib/client.js' -or
      $null -eq $privatePackage.dsh.client) {
    throw 'private plugin manifest metadata changed'
  }
  foreach ($pin in $WikiPluginLibPins) {
    $source = Join-Path $RepoRoot "dsh-ext\lib\$($pin.Name)"
    $target = Join-Path $PrivatePluginLib $pin.Name
    Copy-Item -LiteralPath $source -Destination $target
    Assert-Sha256 $target $pin.Sha "materialized private plugin $($pin.Name)"
  }
  foreach ($pin in @(
    @{ Name = 'agent.js'; Sha = 'b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b' },
    @{ Name = 'host.js'; Sha = 'a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994' }
  )) {
    $source = Join-Path $RepoRoot "dsh-ext\lib\$($pin.Name)"
    $target = Join-Path $PrivateNativeLib $pin.Name
    Copy-Item -LiteralPath $source -Destination $target
    Assert-Sha256 $target $pin.Sha "materialized private native $($pin.Name)"
  }
  Assert-NoReparsePath $PrivatePlugin
  Assert-NoReparsePath $PrivateNative

  $prefixBytes = [IO.File]::ReadAllBytes($ProfileOverlay)
  $prefixText = [Text.Encoding]::UTF8.GetString($prefixBytes)
  if ($prefixText -match '(?m)^- id: legal-ui\s*$') {
    throw 'private profile overlay already contains legal-ui'
  }
  $legalUiUrl = ([Uri]$PrivatePluginIndex).AbsoluteUri
  $legalHostUrl = ([Uri](Join-Path $PrivateNativeLib 'host.js')).AbsoluteUri
  $legalAgentUrl = ([Uri](Join-Path $PrivateNativeLib 'agent.js')).AbsoluteUri
  $suffixTemplate = @'
- id: legal-ui
  disabled: true
- insert:
    - id: legal-ui-wiki-private
      name: __LEGAL_UI_URL__
- id: legal-host
  disabled: true
- insert:
    - id: legal-host-t34-private
      name: __LEGAL_HOST_URL__
      config:
        command: !!js "JSON.parse(process.env.LAWBENCH_SERVICE_CMD ?? '[]')"
        cwd: !!js process.env.LAWBENCH_SERVICE_CWD
        appData: !!js process.env.LOCALAPPDATA
        forwardPort: !!js "Number(process.env.T50_LLM_PORT)"
        env: !!js "JSON.parse(process.env.LAWBENCH_SERVICE_ENV ?? '{}')"
        skillDirs: !!js "JSON.parse(process.env.LAWBENCH_SKILL_DIRS ?? '[]')"
        officeRuntimeWorker: !!js process.env.T50_OFFICE_WORKER
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
  $suffix = $suffixTemplate.Replace('__LEGAL_UI_URL__', $legalUiUrl).Replace('__LEGAL_HOST_URL__', $legalHostUrl).Replace('__LEGAL_AGENT_URL__', $legalAgentUrl)
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
    marker = $(if ($Name -eq 'sidecars') { $SidecarScript } else { $UserData })
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
    task = 'T33-native-gui'
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
  [void]$queue.Enqueue([int]$script:SidecarsPid)
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
      foreach ($candidate in @($rootFull, $Project, $PrimaryRuntime, $NativeEntry, $SidecarScript, $UserData)) {
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
      'sidecars' { 2 }
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
  $script:SidecarsPid = 0
  $script:NativePid = 0
  $script:NativePort = 0
  $lockStream = $null
  $electronLaunch = $null
  $sidecarLaunch = $null
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
    $sidecarEnvironment = Copy-IsolatedEnvironment $baseEnvironment
    $sidecarEnvironment['T50_FAKE_SEARCH_TOKEN'] = 'T50_FAKE_SEARCH_TOKEN_NOT_A_SECRET'
    $sidecarEnvironment['T50_FAKE_LAWFIRM_TOKEN'] = 'T50_FAKE_LAWFIRM_TOKEN_NOT_A_SECRET'
    $sidecarState = Join-Path $LogDir 'fake-sidecars.json'
    $sidecarLaunch = Start-OwnedTarget `
      -Name 'sidecars' `
      -ProcessPath $Node `
      -Arguments @($SidecarScript, '--state-file', $sidecarState, '--reply-file', $ReplyFixture) `
      -WorkingDirectory $E50Runtime `
      -Environment $sidecarEnvironment `
      -CreateNoWindow $true
    $script:SidecarsPid = [int]$sidecarLaunch.target.pid

    $deadline = (Get-Date).AddSeconds(12)
    while (-not (Test-Path -LiteralPath $sidecarState -PathType Leaf)) {
      if (-not (Test-ExactRecord $sidecarLaunch.target)) { throw 'fake sidecars exited before publishing loopback ports' }
      if ((Get-Date) -gt $deadline) { throw 'fake sidecars did not publish loopback ports' }
      Start-Sleep -Milliseconds 100
    }
    $ports = Get-Content -Raw -LiteralPath $sidecarState | ConvertFrom-Json
    foreach ($port in @([int]$ports.modelPort, [int]$ports.searchPort)) {
      if ($port -lt 1 -or $port -gt 65535) { throw "invalid fake sidecar port: $port" }
    }

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
    $electronEnvironment['T50_LLM_PORT'] = [string]$ports.modelPort
    $electronEnvironment['T50_FAKE_SEARCH_PORT'] = [string]$ports.searchPort
    $electronEnvironment['T50_FAKE_SEARCH_TOKEN'] = 'T50_FAKE_SEARCH_TOKEN_NOT_A_SECRET'
    $electronEnvironment['T50_FAKE_LAWFIRM_TOKEN'] = 'T50_FAKE_LAWFIRM_TOKEN_NOT_A_SECRET'
    $electronEnvironment['T50_GUARD_READY_FILE'] = Join-Path $LogDir 'guard-ready.log'
    $electronEnvironment['T50_NETWORK_DENIAL_LOG'] = Join-Path $LogDir 'network-denied.log'
    $resolverUrl = ([Uri]$Resolver).AbsoluteUri
    $electronEnvironment['NODE_OPTIONS'] = "--import=$resolverUrl --require=$Guard"
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
      if ($electronLaunch -or $sidecarLaunch -or $ProcessRecords.Count -gt 0) { [void](Stop-OwnedRun $terminationReason) }
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

if ($rootFull -notmatch '\\T33-host-[0-9]{8}-[0-9]{6}$') {
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
    throw "T33 GUI launch refused/failed: $($failure.error)"
  }
  if ($supervisor.HasExited) { throw "T33 GUI supervisor exited before handoff with code $($supervisor.ExitCode)" }
  if ((Get-Date) -gt $launchDeadline) { throw 'T33 GUI supervisor did not hand off within 70 seconds' }
  Start-Sleep -Milliseconds 250
}
$handoff = Get-Content -Raw -LiteralPath $HandoffPath | ConvertFrom-Json
$handoff | ConvertTo-Json -Depth 5
