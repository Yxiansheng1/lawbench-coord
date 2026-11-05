[CmdletBinding()]
param(
  [string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\server.py'
$NativeEntryBytes = 141021
$NativeEntrySha256 = '399f49b59097c87548c2dec307cbfac8cbe828f1fb4845b5d2c23c99f5c5947d'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$RunsRoot = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\runs'
$Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
$FixtureBytes = 47379
$FixtureSha256 = 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad'
$ExpectedHead = 'dc56a93be4b07dbe7a48863e3135351659817fb5'
$PreparedFormat = 'T32-reference-remove-gui-prepared-v1'
$SourcePinsSha256 = '5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf'
$SourceCount = 347
$SettingsSha256 = '564385737cc7417888a518a3c29678459fe41264a08ee30a30bb4a7435b33add'
$ScopeFiles = @(
  @{ Name = 'scope-in.txt'; MaterialName = 'scope-in'; Bytes = 30; Sha256 = '4d9e4eb195fb86d06512f7595739a7b08adb3e800994e1aafa8646c08d837140' },
  @{ Name = 'scope-out.txt'; MaterialName = 'scope-out'; Bytes = 30; Sha256 = '5c9b2740bb117076db13c45d4960b11911079a79ae36b38342047a60aca59510' },
  @{ Name = 'scope-third.txt'; MaterialName = 'scope-third'; Bytes = 22; Sha256 = '103da2317f4bee98ae3cf0bb84635b306ec78f304a18a9bdf1589ef0e245dbc6' }
)

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
Assert-NoReparsePath $NativeEntry
Assert-NoReparsePath $Fixture
Assert-NoReparsePath $BProductRoot
Assert-NoReparsePath $RunsRoot
if ((Get-Item -LiteralPath $NativeEntry).Length -ne $NativeEntryBytes) {
  throw 'pinned native entry byte count mismatch'
}
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
$scopePath = Join-Path $readyPath 'scope-source'
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
$rootEntries = @(Get-ChildItem -LiteralPath $rootFull -Force)
$actualRootNames = @($rootEntries | ForEach-Object Name | Sort-Object)
$expectedRootNames = @('case', 'input', 'prepared.json', 'private') | Sort-Object
if ($rootEntries.Count -ne $expectedRootNames.Count -or
    ($actualRootNames -join ',') -cne ($expectedRootNames -join ',')) {
  throw 'prepared root inventory must contain only case, input, prepared.json, and private'
}
foreach ($directoryName in @('case', 'input', 'private')) {
  if (-not (Test-Path -LiteralPath (Join-Path $rootFull $directoryName) -PathType Container)) {
    throw "prepared root directory missing: $directoryName"
  }
}
$readyEntries = @(Get-ChildItem -LiteralPath $readyPath -Force)
$readyFixture = Join-Path $readyPath '转账截图.jpg'
if ($readyEntries.Count -ne 2) {
  throw "prepared ready directory must contain exactly the JPEG and scope-source directory: $readyPath"
}
if (-not (Test-Path -LiteralPath $readyFixture -PathType Leaf) -or
    -not (Test-Path -LiteralPath $scopePath -PathType Container)) {
  throw 'prepared ready inventory identity mismatch'
}
Assert-NoReparsePath $readyFixture
Assert-NoReparsePath $scopePath
$unexpectedReady = @($readyEntries | Where-Object {
  $_.FullName -ine $readyFixture -and $_.FullName -ine $scopePath
})
if ($unexpectedReady.Count -ne 0) {
  throw "unexpected prepared ready entry: $($unexpectedReady[0].FullName)"
}
if ((Get-Item -LiteralPath $readyFixture).Length -ne $FixtureBytes -or (Get-Sha256 $readyFixture) -ne $FixtureSha256) {
  throw 'prepared JPEG copy identity mismatch'
}
$scopeEntries = @(Get-ChildItem -LiteralPath $scopePath -Force)
if ($scopeEntries.Count -ne $ScopeFiles.Count -or @($scopeEntries | Where-Object { $_.PSIsContainer }).Count -ne 0) {
  throw "prepared scope-source must contain exactly three files: $scopePath"
}
$actualScopeNames = @($scopeEntries | ForEach-Object Name | Sort-Object)
$expectedScopeNames = @($ScopeFiles | ForEach-Object Name | Sort-Object)
if (($actualScopeNames -join "`n") -cne ($expectedScopeNames -join "`n")) {
  throw 'prepared scope-source file-name set mismatch'
}
foreach ($scopeFile in $ScopeFiles) {
  $path = Join-Path $scopePath $scopeFile.Name
  Assert-NoReparsePath $path
  if ((Get-Item -LiteralPath $path).Length -ne [long]$scopeFile.Bytes) {
    throw "prepared scope-source byte count mismatch: $($scopeFile.Name)"
  }
  if ((Get-Sha256 $path) -ne $scopeFile.Sha256) {
    throw "prepared scope-source hash mismatch: $($scopeFile.Name)"
  }
}

$manifest = Get-Content -Raw -LiteralPath $preparedPath | ConvertFrom-Json
if ($manifest.format -cne $PreparedFormat) {
  throw "unexpected prepared format: $($manifest.format)"
}
if ($manifest.expected_head -ne $ExpectedHead) {
  throw "unexpected native entry source head: $($manifest.expected_head)"
}
if ($manifest.initial_case_empty -ne $true -or
    $manifest.not_case_id_or_session -ne $true -or
    $manifest.not_service_registration -ne $true) {
  throw 'prepared semantic identity mismatch'
}
$expectedPreparedPaths = [ordered]@{
  appdata = Join-Path $rootFull 'private\appdata'
  case = $casePath
  home = Join-Path $rootFull 'private\home'
  paste = Join-Path $rootFull 'private\appdata\临时\粘贴'
  ready = $readyPath
  root = $rootFull
  system = Join-Path $rootFull 'private\system'
  temp = Join-Path $rootFull 'private\temp'
}
$actualPreparedPathNames = @($manifest.paths.PSObject.Properties.Name | Sort-Object)
$expectedPreparedPathNames = @($expectedPreparedPaths.Keys | Sort-Object)
if (($actualPreparedPathNames -join ',') -cne ($expectedPreparedPathNames -join ',')) {
  throw 'prepared canonical path set mismatch'
}
foreach ($name in $expectedPreparedPaths.Keys) {
  $expected = [IO.Path]::GetFullPath([string]$expectedPreparedPaths[$name])
  $entry = $manifest.paths.PSObject.Properties[$name].Value
  if ($null -eq $entry -or
      (@($entry.PSObject.Properties.Name | Sort-Object) -join ',') -cne 'canonical,path' -or
      [string]$entry.path -ine $expected -or
      [string]$entry.canonical -ine $expected.ToLowerInvariant()) {
    throw "prepared canonical path identity mismatch: $name"
  }
}

if ($null -eq $manifest.scope_source) {
  throw 'prepared scope_source is missing'
}
$scopeSourcePropertyNames = @($manifest.scope_source.PSObject.Properties.Name | Sort-Object)
$expectedScopeSourcePropertyNames = @('canonical', 'files', 'path', 'scope_in_material_name')
if (($scopeSourcePropertyNames -join ',') -cne ($expectedScopeSourcePropertyNames -join ',') -or
    [string]$manifest.scope_source.path -ine $scopePath -or
    [string]$manifest.scope_source.canonical -ine $scopePath.ToLowerInvariant() -or
    [string]$manifest.scope_source.scope_in_material_name -cne 'scope-in' -or
    @($manifest.scope_source.files).Count -ne $ScopeFiles.Count) {
  throw 'prepared scope_source identity mismatch'
}
foreach ($scopeFile in $ScopeFiles) {
  $entry = @($manifest.scope_source.files | Where-Object { [string]$_.name -ceq $scopeFile.Name })
  if ($entry.Count -ne 1) {
    throw "prepared scope_source file set mismatch: $($scopeFile.Name)"
  }
  $expectedPath = [IO.Path]::GetFullPath((Join-Path $scopePath $scopeFile.Name))
  $actualPropertyNames = @($entry[0].PSObject.Properties.Name | Sort-Object)
  $expectedPropertyNames = @('bytes', 'canonical', 'material_name', 'name', 'path', 'sha256')
  if (($actualPropertyNames -join ',') -cne ($expectedPropertyNames -join ',') -or
      [long]$entry[0].bytes -ne [long]$scopeFile.Bytes -or
      [string]$entry[0].sha256 -cne $scopeFile.Sha256 -or
      [string]$entry[0].material_name -cne $scopeFile.MaterialName -or
      [string]$entry[0].path -ine $expectedPath -or
      [string]$entry[0].canonical -ine $expectedPath.ToLowerInvariant()) {
    throw "prepared scope_source identity mismatch: $($scopeFile.Name)"
  }
}

if ([string]$manifest.fixture.source_path -ine $Fixture -or
    [string]$manifest.fixture.copy_path -ine $readyFixture -or
    [long]$manifest.fixture.source_bytes -ne $FixtureBytes -or
    [long]$manifest.fixture.copy_bytes -ne $FixtureBytes -or
    [string]$manifest.fixture.source_sha256 -cne $FixtureSha256 -or
    [string]$manifest.fixture.copy_sha256 -cne $FixtureSha256 -or
    [string]$manifest.fixture.source_canonical -ine $Fixture.ToLowerInvariant() -or
    [string]$manifest.fixture.copy_canonical -ine $readyFixture.ToLowerInvariant()) {
  throw 'prepared JPEG manifest identity mismatch'
}

if ([string]$manifest.source_pins_sha256 -cne $SourcePinsSha256 -or
    @($manifest.source.PSObject.Properties).Count -ne $SourceCount) {
  throw 'prepared source pins identity mismatch'
}
$entrySource = $manifest.source.PSObject.Properties['entry/server.py'].Value
if ($null -eq $entrySource -or
    [long]$entrySource.bytes -ne $NativeEntryBytes -or
    [string]$entrySource.sha256 -cne $NativeEntrySha256) {
  throw 'prepared source entry hash mismatch'
}
foreach ($property in $manifest.source.PSObject.Properties) {
  $sourcePath = if ($property.Name -ceq 'entry/server.py') {
    $NativeEntry
  } else {
    Join-Path $BProductRoot $property.Name
  }
  $sourcePath = [IO.Path]::GetFullPath($sourcePath)
  $sourceRoot = [IO.Path]::GetFullPath($BProductRoot).TrimEnd('\') + '\'
  if (-not $sourcePath.StartsWith($sourceRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "prepared source path escapes product root: $($property.Name)"
  }
  Assert-NoReparsePath $sourcePath
  Assert-File $sourcePath "prepared source $($property.Name)"
  if ((Get-Item -LiteralPath $sourcePath).Length -ne [long]$property.Value.bytes -or
      (Get-Sha256 $sourcePath) -ne [string]$property.Value.sha256) {
    throw "prepared source identity mismatch: $($property.Name)"
  }
}

if ((Get-Sha256 $settingsPath) -ne $SettingsSha256 -or
    [string]$manifest.settings.sha256 -cne $SettingsSha256 -or
    [string]$manifest.settings.path -ine $settingsPath -or
    [string]$manifest.settings.canonical -ine $settingsPath.ToLowerInvariant()) {
  throw 'prepared settings hash mismatch'
}
$settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
if ($settings.external_llm.enabled -ne $false -or
    $settings.external_llm.base_url -ne $null -or
    $settings.external_llm.context_window -ne $null -or
    $settings.external_llm.model -ne $null -or
    $settings.servers.llm_base_url -cne 'http://127.0.0.1:65001/v1' -or
    $settings.servers.llm_alt_base_url -cne 'http://127.0.0.1:65003/v1' -or
    $settings.servers.prep_base_url -cne 'http://127.0.0.1:65002' -or
    $settings.servers.prep_alt_base_url -cne 'http://127.0.0.1:65004') {
  throw 'prepared settings content mismatch'
}
$expectedMarkerRootJson = ConvertTo-Json -InputObject $casePath -Compress
$expectedMarkerText = (
  '{' + "`n" +
  '  "root": ' + $expectedMarkerRootJson + "`n" +
  '}' + "`n"
)
$expectedMarkerBytes = [Text.UTF8Encoding]::new($false).GetBytes($expectedMarkerText)
$expectedMarkerSha256 = [Convert]::ToHexString(
  [System.Security.Cryptography.SHA256]::HashData($expectedMarkerBytes)
).ToLowerInvariant()
$actualMarkerBytes = [IO.File]::ReadAllBytes($markerPath)
$expectedMarkerByteHex = [Convert]::ToHexString($expectedMarkerBytes)
$actualMarkerByteHex = [Convert]::ToHexString($actualMarkerBytes)
if ($actualMarkerBytes.Length -ne $expectedMarkerBytes.Length -or
    $actualMarkerByteHex -cne $expectedMarkerByteHex -or
    (Get-Sha256 $markerPath) -cne $expectedMarkerSha256 -or
    [string]$manifest.daily_marker.sha256 -cne $expectedMarkerSha256 -or
    [long]$manifest.daily_marker.bytes -ne $expectedMarkerBytes.Length -or
    [string]$manifest.daily_marker.path -ine $markerPath -or
    [string]$manifest.daily_marker.canonical -ine $markerPath.ToLowerInvariant() -or
    $manifest.daily_marker.service_registration -ne $false) {
  throw 'prepared daily marker expected-byte identity mismatch'
}
$marker = Get-Content -Raw -LiteralPath $markerPath | ConvertFrom-Json
if (([string]$marker.root -ine $casePath) -or
    (($marker.PSObject.Properties.Name -join ',') -cne 'root')) {
  throw 'prepared daily marker content mismatch'
}
foreach ($runtimeArtifact in @(
  'started.json', 'ready.json', 'final-metadata.json',
  'loop-closed.json', 'requests.ndjson', 'run-error.json'
)) {
  if (Test-Path -LiteralPath (Join-Path $rootFull $runtimeArtifact)) {
    throw "fresh root unexpectedly contains runtime artifact: $runtimeArtifact"
  }
}

$privateHome = [IO.Path]::GetFullPath([string]$expectedPreparedPaths.home)
$expectedPrivateHome = [IO.Path]::GetFullPath((Join-Path $rootFull 'private\home'))
$privateDesktop = [IO.Path]::GetFullPath((Join-Path $privateHome 'Desktop'))
$expectedPrivateDesktop = [IO.Path]::GetFullPath((Join-Path $expectedPrivateHome 'Desktop'))
$ownedRootPrefix = $rootFull.TrimEnd('\') + '\'
if ($privateHome -ine $expectedPrivateHome -or
    $privateDesktop -ine $expectedPrivateDesktop -or
    [IO.Path]::GetDirectoryName($privateDesktop) -ine $privateHome -or
    [IO.Path]::GetFileName($privateDesktop) -cne 'Desktop' -or
    -not $privateDesktop.StartsWith($ownedRootPrefix, [StringComparison]::OrdinalIgnoreCase) -or
    -not (Test-Path -LiteralPath $privateHome -PathType Container)) {
  throw "private Desktop preparation identity mismatch: $privateDesktop"
}
Assert-NoReparsePath $privateHome
$privateDesktopBefore = Get-Item -LiteralPath $privateDesktop -Force -ErrorAction SilentlyContinue
if ($null -ne $privateDesktopBefore) {
  throw "private Desktop already exists: $privateDesktop"
}
$null = New-Item -ItemType Directory -Path $privateDesktop -ErrorAction Stop
$privateDesktopItem = Get-Item -LiteralPath $privateDesktop -Force -ErrorAction Stop
if (-not $privateDesktopItem.PSIsContainer -or
    ($privateDesktopItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
  throw "private Desktop is not a plain directory: $privateDesktop"
}
Assert-NoReparsePath $privateDesktop
if (@(Get-ChildItem -LiteralPath $privateDesktop -Force).Count -ne 0) {
  throw "private Desktop is not empty: $privateDesktop"
}

[ordered]@{
  ok = $true
  runRoot = $rootFull
  prepared = $preparedPath
  nativeEntry = $NativeEntry
  nativeEntryBytes = $NativeEntryBytes
  nativeEntrySha256 = $NativeEntrySha256
  fixtureBytes = $FixtureBytes
  fixtureSha256 = $FixtureSha256
  scopeSourceFiles = $ScopeFiles.Count
  sourcePinsSha256 = $SourcePinsSha256
  caseEmpty = $true
  runtimeArtifactsAbsent = $true
  privateDesktop = [ordered]@{
    path = $privateDesktop
    empty = $true
  }
} | ConvertTo-Json -Depth 4
