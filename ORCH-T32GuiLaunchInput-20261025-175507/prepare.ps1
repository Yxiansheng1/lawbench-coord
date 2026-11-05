[CmdletBinding()]
param(
  [string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\TaskSelectionEntry-20261025-154140\server.py'
$NativeEntrySha256 = 'ed7be2e8530f128d3068e793cc04c0d05deb7d68aefd243353c428df06d5fd34'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$RunsRoot = Join-Path (Split-Path -Parent $NativeEntry) 'runs'
$Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
$FixtureBytes = 47379
$FixtureSha256 = 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad'

function Assert-File([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Label missing: $Path"
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

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

Assert-File $Python 'Python312'
Assert-File $NativeEntry 'pinned native entry'
Assert-File $Fixture 'synthetic JPEG fixture'
Assert-NoReparsePath $RunsRoot
if ((Get-Sha256 $NativeEntry) -ne $NativeEntrySha256) {
  throw 'pinned native entry hash mismatch'
}
if ((Get-Item -LiteralPath $Fixture).Length -ne $FixtureBytes) {
  throw 'synthetic JPEG byte count mismatch'
}
if ((Get-Sha256 $Fixture) -ne $FixtureSha256) {
  throw 'synthetic JPEG hash mismatch'
}

if ([string]::IsNullOrWhiteSpace($RunRoot)) {
  $RunRoot = Join-Path $RunsRoot ('T33-host-{0}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsFull = [IO.Path]::GetFullPath($RunsRoot)
if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
  throw "run root must be a direct child of $runsFull"
}
if ($rootFull -notmatch '\\T33-host-[0-9]{8}-[0-9]{6}$') {
  throw "run root name must be T33-host-YYYYMMDD-HHMMSS: $rootFull"
}
if (Test-Path -LiteralPath $rootFull) {
  throw "run root already exists: $rootFull"
}
Assert-NoReparsePath $rootFull -AllowMissingTail

& $Python -B -X utf8 $NativeEntry --prepare --root $rootFull
if ($LASTEXITCODE -ne 0) {
  throw "native --prepare refused with exit code $LASTEXITCODE; retained target: $rootFull"
}

$preparedPath = Join-Path $rootFull 'prepared.json'
$casePath = Join-Path $rootFull 'case'
$readyPath = Join-Path $rootFull 'input\ready'
$settingsPath = Join-Path $rootFull 'private\appdata\settings.json'
$markerPath = Join-Path $rootFull 'private\appdata\daily-case.json'
foreach ($path in @($preparedPath, $settingsPath, $markerPath)) {
  Assert-File $path 'native prepared artifact'
}
if (-not (Test-Path -LiteralPath $casePath -PathType Container)) {
  throw "prepared case directory missing: $casePath"
}
if (@(Get-ChildItem -LiteralPath $casePath -Force).Count -ne 0) {
  throw "prepared case directory is not empty: $casePath"
}
$readyFiles = @(Get-ChildItem -LiteralPath $readyPath -File -Force)
$readyFixture = Join-Path $readyPath '转账截图.jpg'
if ($readyFiles.Count -ne 1 -or $readyFiles[0].FullName -ine $readyFixture) {
  throw "prepared ready directory must contain only the exact JPEG fixture: $readyPath"
}
if ($readyFiles[0].Length -ne $FixtureBytes -or (Get-Sha256 $readyFixture) -ne $FixtureSha256) {
  throw 'prepared JPEG copy identity mismatch'
}

$manifest = Get-Content -Raw -LiteralPath $preparedPath | ConvertFrom-Json
if ($manifest.format -ne 'T33-host-entry-prepared-v1') {
  throw "unexpected prepared format: $($manifest.format)"
}
if ($manifest.expected_head -ne 'dc56a93be4b07dbe7a48863e3135351659817fb5') {
  throw "unexpected native entry source head: $($manifest.expected_head)"
}
if ($manifest.paths.root.canonical -ine $rootFull -or
    $manifest.paths.appdata.canonical -ine (Join-Path $rootFull 'private\appdata') -or
    $manifest.paths.case.canonical -ine $casePath) {
  throw 'prepared canonical path identity mismatch'
}
$entrySource = $manifest.source.PSObject.Properties['entry/server.py'].Value
if ($entrySource.sha256 -ne $NativeEntrySha256) {
  throw 'prepared source entry hash mismatch'
}
if ((Get-Sha256 $settingsPath) -ne [string]$manifest.settings.sha256) {
  throw 'prepared settings hash mismatch'
}
if ((Get-Sha256 $markerPath) -ne [string]$manifest.daily_marker.sha256) {
  throw 'prepared daily marker hash mismatch'
}
foreach ($runtimeArtifact in @(
  'started.json', 'ready.json', 'final-metadata.json',
  'loop-closed.json', 'requests.ndjson', 'run-error.json'
)) {
  if (Test-Path -LiteralPath (Join-Path $rootFull $runtimeArtifact)) {
    throw "fresh root unexpectedly contains runtime artifact: $runtimeArtifact"
  }
}

[ordered]@{
  ok = $true
  runRoot = $rootFull
  prepared = $preparedPath
  nativeEntry = $NativeEntry
  nativeEntrySha256 = $NativeEntrySha256
  fixtureBytes = $FixtureBytes
  fixtureSha256 = $FixtureSha256
  caseEmpty = $true
  runtimeArtifactsAbsent = $true
} | ConvertTo-Json -Depth 4
