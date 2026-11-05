[CmdletBinding()]
param(
  [string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDocumentCitationEntry-20261027-190830\server.py'
$NativeEntryBytes = 67862
$NativeEntrySha256 = 'ec4e15f047f3ae6264dc25ad582cb2191ce085e9bc7c5add4bb5df0212ba0dd8'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$RunsRoot = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDocumentCitationEntry-20261027-190830\runs'
$Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
$FixtureBytes = 47379
$FixtureSha256 = 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad'
$ExpectedHead = 'dc56a93be4b07dbe7a48863e3135351659817fb5'
$PreparedFormat = 'T32-native-document-citation-entry-prepared-v1'
$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json'
$SourcePinsBytes = 53547
$SourcePinsSha256 = '5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf'
$SourceCount = 347
$SafetyBasePath = 'D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py'
$SafetyBaseBytes = 151304
$SafetyBaseSha256 = 'a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5'
$SettingsSha256 = '564385737cc7417888a518a3c29678459fe41264a08ee30a30bb4a7435b33add'
$CitationSourceFile = '引用材料.txt'
$CitationSourceBytes = 50
$CitationSourceSha256 = '410a87a9c0853f886fe526ce940ba396d09929d1304b3f9c146f5612e7e1954f'
$CitationSourceText = "T32 合成引用原文，仅用于本地测试。`n"
$ReadyInputFiles = 2

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
Assert-File $SourcePinsPath 'reviewed source pins'
Assert-File $SafetyBasePath 'frozen safety base'
Assert-NoReparsePath $NativeEntry
Assert-NoReparsePath $Fixture
Assert-NoReparsePath $SourcePinsPath
Assert-NoReparsePath $SafetyBasePath
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
if ((Get-Item -LiteralPath $SourcePinsPath).Length -ne $SourcePinsBytes -or
    (Get-Sha256 $SourcePinsPath) -ne $SourcePinsSha256) {
  throw 'reviewed source pins identity mismatch'
}
if ((Get-Item -LiteralPath $SafetyBasePath).Length -ne $SafetyBaseBytes -or
    (Get-Sha256 $SafetyBasePath) -ne $SafetyBaseSha256) {
  throw 'frozen safety base identity mismatch'
}

if ([string]::IsNullOrWhiteSpace($RunRoot)) {
  $RunRoot = Join-Path $RunsRoot ('T32-citation-{0}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsFull = [IO.Path]::GetFullPath($RunsRoot)
if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
  throw "run root must be a direct child of $runsFull"
}
if ($rootFull -notmatch '\\T32-citation-[0-9]{8}-[0-9]{6}$') {
  throw "run root name must be T32-citation-YYYYMMDD-HHMMSS: $rootFull"
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
$citationSourcePath = Join-Path $readyPath $CitationSourceFile
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
if ($readyEntries.Count -ne $ReadyInputFiles) {
  throw "prepared ready directory must contain exactly the JPEG and citation source: $readyPath"
}
if (-not (Test-Path -LiteralPath $readyFixture -PathType Leaf) -or
    -not (Test-Path -LiteralPath $citationSourcePath -PathType Leaf)) {
  throw 'prepared ready inventory identity mismatch'
}
Assert-NoReparsePath $readyFixture
Assert-NoReparsePath $citationSourcePath
$unexpectedReady = @($readyEntries | Where-Object {
  $_.FullName -ine $readyFixture -and $_.FullName -ine $citationSourcePath
})
if ($unexpectedReady.Count -ne 0 -or
    @($readyEntries | Where-Object PSIsContainer).Count -ne 0) {
  throw "unexpected prepared ready entry: $($unexpectedReady[0].FullName)"
}
if ((Get-Item -LiteralPath $readyFixture).Length -ne $FixtureBytes -or (Get-Sha256 $readyFixture) -ne $FixtureSha256) {
  throw 'prepared JPEG copy identity mismatch'
}
if ((Get-Item -LiteralPath $citationSourcePath).Length -ne $CitationSourceBytes -or
    (Get-Sha256 $citationSourcePath) -ne $CitationSourceSha256 -or
    [IO.File]::ReadAllText($citationSourcePath, [Text.UTF8Encoding]::new($false)) -cne $CitationSourceText) {
  throw 'prepared citation source identity mismatch'
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

if ($null -eq $manifest.citation_source) {
  throw 'prepared citation_source is missing'
}
$citationSourcePropertyNames = @($manifest.citation_source.PSObject.Properties.Name | Sort-Object)
$expectedCitationSourcePropertyNames = @('bytes', 'canonical', 'mtime_ns', 'path', 'sha256', 'text')
if (($citationSourcePropertyNames -join ',') -cne ($expectedCitationSourcePropertyNames -join ',') -or
    [long]$manifest.citation_source.bytes -ne $CitationSourceBytes -or
    [string]$manifest.citation_source.sha256 -cne $CitationSourceSha256 -or
    [string]$manifest.citation_source.text -cne $CitationSourceText -or
    [string]$manifest.citation_source.path -ine $citationSourcePath -or
    [string]$manifest.citation_source.canonical -ine $citationSourcePath.ToLowerInvariant()) {
  throw 'prepared citation_source identity mismatch'
}

if ($null -eq $manifest.fixture_source -or
    [string]$manifest.fixture_source.path -ine $Fixture -or
    [string]$manifest.fixture_source.canonical -ine $Fixture.ToLowerInvariant() -or
    [long]$manifest.fixture_source.bytes -ne $FixtureBytes -or
    [string]$manifest.fixture_source.sha256 -cne $FixtureSha256) {
  throw 'prepared JPEG source identity mismatch'
}
if ($null -eq $manifest.fixture_copy -or
    [string]$manifest.fixture_copy.path -ine $readyFixture -or
    [string]$manifest.fixture_copy.canonical -ine $readyFixture.ToLowerInvariant() -or
    [long]$manifest.fixture_copy.bytes -ne $FixtureBytes -or
    [string]$manifest.fixture_copy.sha256 -cne $FixtureSha256) {
  throw 'prepared JPEG copy identity mismatch'
}

if ($null -eq $manifest.source_pins -or
    (@($manifest.source_pins.PSObject.Properties.Name | Sort-Object) -join ',') -cne
      (@('bytes', 'canonical', 'frozen_sha256', 'path', 'sha256') -join ',') -or
    [long]$manifest.source_pins.bytes -ne $SourcePinsBytes -or
    [string]$manifest.source_pins.sha256 -cne $SourcePinsSha256 -or
    [string]$manifest.source_pins.frozen_sha256 -cne $SourcePinsSha256 -or
    [string]$manifest.source_pins.path -ine $SourcePinsPath -or
    [string]$manifest.source_pins.canonical -ine $SourcePinsPath.ToLowerInvariant() -or
    @($manifest.source.PSObject.Properties).Count -ne $SourceCount) {
  throw 'prepared source pins identity mismatch'
}
if ($null -eq $manifest.safety_base -or
    (@($manifest.safety_base.PSObject.Properties.Name | Sort-Object) -join ',') -cne
      (@('bytes', 'canonical', 'frozen_sha256', 'path', 'sha256') -join ',') -or
    [long]$manifest.safety_base.bytes -ne $SafetyBaseBytes -or
    [string]$manifest.safety_base.sha256 -cne $SafetyBaseSha256 -or
    [string]$manifest.safety_base.frozen_sha256 -cne $SafetyBaseSha256 -or
    [string]$manifest.safety_base.path -ine $SafetyBasePath -or
    [string]$manifest.safety_base.canonical -ine $SafetyBasePath.ToLowerInvariant()) {
  throw 'prepared safety base identity mismatch'
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
    [string]$manifest.daily_marker.host_shape.root -ine $casePath -or
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
  readyInputFiles = $ReadyInputFiles
  sourcePinsSha256 = $SourcePinsSha256
  caseEmpty = $true
  runtimeArtifactsAbsent = $true
  privateDesktop = [ordered]@{
    path = $privateDesktop
    empty = $true
  }
} | ConvertTo-Json -Depth 4
