[CmdletBinding()]
param(
  [string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\server.py'
$NativeEntryBytes = 78926
$NativeEntrySha256 = '165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$RunsRoot = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\runs'
$Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
$FixtureBytes = 47379
$FixtureSha256 = 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad'
$ExpectedHead = 'dc56a93be4b07dbe7a48863e3135351659817fb5'
$PreparedFormat = 'T32-native-pdf-citation-entry-prepared-v1'
$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json'
$SourcePinsBytes = 53547
$SourcePinsSha256 = '5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf'
$SourceCount = 347
$SafetyBasePath = 'D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py'
$SafetyBaseBytes = 151304
$SafetyBaseSha256 = 'a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5'
$SettingsSha256 = '564385737cc7417888a518a3c29678459fe41264a08ee30a30bb4a7435b33add'
$CitationSourceFile = '起诉意见书.pdf'
$CitationSourceBytes = 57132
$CitationSourceSha256 = '761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191'
$PdfFixtureSourcePath = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\起诉意见书.pdf'
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
Assert-File $PdfFixtureSourcePath 'synthetic PDF fixture'
Assert-File $SourcePinsPath 'reviewed source pins'
Assert-File $SafetyBasePath 'frozen safety base'
Assert-NoReparsePath $NativeEntry
Assert-NoReparsePath $Fixture
Assert-NoReparsePath $PdfFixtureSourcePath
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
if ((Get-Item -LiteralPath $PdfFixtureSourcePath).Length -ne $CitationSourceBytes) {
  throw 'synthetic PDF byte count mismatch'
}
if ((Get-Sha256 $PdfFixtureSourcePath) -ne $CitationSourceSha256) {
  throw 'synthetic PDF hash mismatch'
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
  $RunRoot = Join-Path $RunsRoot ('T32-pdf-citation-{0}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsFull = [IO.Path]::GetFullPath($RunsRoot)
if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
  throw "run root must be a direct child of $runsFull"
}
if ($rootFull -notmatch '\\T32-pdf-citation-[0-9]{8}-[0-9]{6}$') {
  throw "run root name must be T32-pdf-citation-YYYYMMDD-HHMMSS: $rootFull"
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
  throw "prepared ready directory must contain exactly the JPEG and PDF reference source: $readyPath"
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
    (Get-Sha256 $citationSourcePath) -ne $CitationSourceSha256) {
  throw 'prepared citation PDF copy identity mismatch'
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
$expectedCitationSourcePropertyNames = @('bytes', 'canonical', 'mtime_ns', 'path', 'sha256')
$actualCitationSourceMtimeNs = (
  (Get-Item -LiteralPath $citationSourcePath).LastWriteTimeUtc.ToFileTimeUtc() -
  116444736000000000L
) * 100L
if (($citationSourcePropertyNames -join ',') -cne ($expectedCitationSourcePropertyNames -join ',') -or
    [long]$manifest.citation_source.bytes -ne $CitationSourceBytes -or
    [string]$manifest.citation_source.sha256 -cne $CitationSourceSha256 -or
    [long]$manifest.citation_source.mtime_ns -ne $actualCitationSourceMtimeNs -or
    [string]$manifest.citation_source.path -ine $citationSourcePath -or
    [string]$manifest.citation_source.canonical -ine $citationSourcePath.ToLowerInvariant()) {
  throw 'prepared citation_source identity mismatch'
}

if ($null -eq $manifest.pdf_source) {
  throw 'prepared PDF source is missing'
}
$pdfSourcePropertyNames = @($manifest.pdf_source.PSObject.Properties.Name | Sort-Object)
$expectedPdfSourcePropertyNames = @('bytes', 'canonical', 'mtime_ns', 'path', 'sha256')
$actualPdfSourceMtimeNs = (
  (Get-Item -LiteralPath $PdfFixtureSourcePath).LastWriteTimeUtc.ToFileTimeUtc() -
  116444736000000000L
) * 100L
if (($pdfSourcePropertyNames -join ',') -cne ($expectedPdfSourcePropertyNames -join ',') -or
    [long]$manifest.pdf_source.bytes -ne $CitationSourceBytes -or
    [string]$manifest.pdf_source.sha256 -cne $CitationSourceSha256 -or
    [long]$manifest.pdf_source.mtime_ns -ne $actualPdfSourceMtimeNs -or
    [string]$manifest.pdf_source.path -ine $PdfFixtureSourcePath -or
    [string]$manifest.pdf_source.canonical -ine $PdfFixtureSourcePath.ToLowerInvariant()) {
  throw 'prepared PDF source identity mismatch'
}

if ($null -eq $manifest.pdf_copy) {
  throw 'prepared PDF copy is missing'
}
$pdfCopyPropertyNames = @($manifest.pdf_copy.PSObject.Properties.Name | Sort-Object)
$expectedPdfCopyPropertyNames = @('bytes', 'canonical', 'mtime_ns', 'path', 'sha256')
$actualPdfCopyMtimeNs = (
  (Get-Item -LiteralPath $citationSourcePath).LastWriteTimeUtc.ToFileTimeUtc() -
  116444736000000000L
) * 100L
if (($pdfCopyPropertyNames -join ',') -cne ($expectedPdfCopyPropertyNames -join ',') -or
    [long]$manifest.pdf_copy.bytes -ne $CitationSourceBytes -or
    [string]$manifest.pdf_copy.sha256 -cne $CitationSourceSha256 -or
    [long]$manifest.pdf_copy.mtime_ns -ne $actualPdfCopyMtimeNs -or
    [string]$manifest.pdf_copy.path -ine $citationSourcePath -or
    [string]$manifest.pdf_copy.canonical -ine $citationSourcePath.ToLowerInvariant() -or
    [long]$manifest.pdf_copy.bytes -ne [long]$manifest.citation_source.bytes -or
    [string]$manifest.pdf_copy.sha256 -cne [string]$manifest.citation_source.sha256 -or
    [long]$manifest.pdf_copy.mtime_ns -ne [long]$manifest.citation_source.mtime_ns -or
    [string]$manifest.pdf_copy.path -ine [string]$manifest.citation_source.path -or
    [string]$manifest.pdf_copy.canonical -ine [string]$manifest.citation_source.canonical) {
  throw 'prepared PDF copy/citation source identity mismatch'
}

if ($null -eq $manifest.input_ready -or
    (@($manifest.input_ready.PSObject.Properties.Name | Sort-Object) -join ',') -cne
      (@('jpeg_control_imported', 'names', 'pdf_reference_import_only') -join ',') -or
    (@($manifest.input_ready.names) -join ',') -cne '转账截图.jpg,起诉意见书.pdf' -or
    $manifest.input_ready.jpeg_control_imported -ne $false -or
    $manifest.input_ready.pdf_reference_import_only -ne $true) {
  throw 'prepared PDF input_ready identity mismatch'
}
if ($null -eq $manifest.citation -or
    (@($manifest.citation.PSObject.Properties.Name | Sort-Object) -join ',') -cne
      (@('from', 'material_name', 'text', 'unit') -join ',') -or
    [int]$manifest.citation.from -ne 2 -or
    [string]$manifest.citation.material_name -cne '起诉意见书' -or
    [string]$manifest.citation.text -cne '〔起诉意见书 第2页〕' -or
    [string]$manifest.citation.unit -cne 'page') {
  throw 'prepared PDF citation identity mismatch'
}
if ($null -eq $manifest.read -or
    (@($manifest.read.PSObject.Properties.Name | Sort-Object) -join ',') -cne
      (@('max_chars', 'start') -join ',') -or
    [int]$manifest.read.start -ne 2 -or
    [int]$manifest.read.max_chars -ne 500) {
  throw 'prepared PDF read identity mismatch'
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
  pdfSourceBytes = $CitationSourceBytes
  pdfSourceSha256 = $CitationSourceSha256
  readyInputFiles = $ReadyInputFiles
  sourcePinsSha256 = $SourcePinsSha256
  caseEmpty = $true
  runtimeArtifactsAbsent = $true
  privateDesktop = [ordered]@{
    path = $privateDesktop
    empty = $true
  }
} | ConvertTo-Json -Depth 4
