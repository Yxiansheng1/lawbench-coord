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
$EvidenceRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421'
$Project = Join-Path $EvidenceRoot 'project'
$E50Runtime = Join-Path $EvidenceRoot 'runtime'
$PrimaryRuntime = Join-Path $RepoRoot 'dsh\apps\desktop\.desktop-build\targets\win-x64\runtime\primary-runtime'
$DesktopRoot = Join-Path $RepoRoot 'dsh\apps\desktop'
$Electron = Join-Path $DesktopRoot 'node_modules\electron\dist\electron.exe'
$Node = 'E:\node\node.exe'
$Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\server.py'
$BProductRoot = 'D:\Lawbeach\lawbench-B'
$ServiceRoot = 'D:/Lawbeach/lawbench-B/service'
$RunsRoot = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\runs'
$NativeEntryBytes = 78926
$NativeEntrySha256 = '165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f'
$Guard = Join-Path $E50Runtime 'network-guard.cjs'
$Resolver = Join-Path $E50Runtime 'resolve-from-dsh.mjs'
$SidecarScript = Join-Path $E50Runtime 'fake-sidecars.mjs'
$ReplyFixture = Join-Path $EvidenceRoot 'fixtures\fake-llm-reply.md'
$ExpectedHead = 'a23271abee333a9a256fd46a3141da16975c2380'
$PreparedHead = 'dc56a93be4b07dbe7a48863e3135351659817fb5'
$PreparedFormat = 'T32-native-pdf-citation-entry-prepared-v1'
$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json'
$SourcePinsBytes = 53547
$SourcePinsSha256 = '5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf'
$PreparedSourceCount = 347
$SafetyBasePath = 'D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py'
$SafetyBaseBytes = 151304
$SafetyBaseSha256 = 'a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5'
$Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
$FixtureBytes = 47379
$FixtureSha256 = 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad'
$CitationSourceFile = '起诉意见书.pdf'
$CitationSourceBytes = 57132
$CitationSourceSha256 = '761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191'
$PdfFixtureSourcePath = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\起诉意见书.pdf'
$ReadyInputFiles = 2
$PreparedSettingsSha256 = '564385737cc7417888a518a3c29678459fe41264a08ee30a30bb4a7435b33add'
$PrivateBuildRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112'
$PrivateBuildManifest = Join-Path $PrivateBuildRoot 'manifest.json'
$PrivateBuildManifestBytes = 58195
$PrivateBuildManifestSha256 = '5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f'
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

function Assert-Sha256([string]$Path, [string]$Expected, [string]$Label) {
  Assert-File $Path $Label
  if ((Get-Sha256 $Path) -ne $Expected) {
    throw "$Label hash mismatch: $Path"
  }
}

function Assert-PreparedInputs {
  $preparedPath = Join-Path $rootFull 'prepared.json'
  $casePath = Join-Path $rootFull 'case'
  $readyPath = Join-Path $rootFull 'input\ready'
  $readyFixture = Join-Path $readyPath '转账截图.jpg'
  $citationSourcePath = Join-Path $readyPath $CitationSourceFile
  $settingsPath = Join-Path $PrivateAppdata 'settings.json'
  $markerPath = Join-Path $PrivateAppdata 'daily-case.json'
  Assert-File $preparedPath 'native prepared manifest'
  $manifest = Get-Content -Raw -LiteralPath $preparedPath | ConvertFrom-Json
  if ($manifest.format -cne $PreparedFormat -or
      $manifest.expected_head -ne $PreparedHead -or
      $manifest.initial_case_empty -ne $true -or
      $manifest.not_case_id_or_session -ne $true -or
      $manifest.not_service_registration -ne $true) {
    throw 'prepared format/head/semantic identity mismatch'
  }
  $rootEntries = @(Get-ChildItem -LiteralPath $rootFull -Force)
  $actualRootNames = @($rootEntries | ForEach-Object Name | Sort-Object)
  $expectedRootNames = @('case', 'input', 'prepared.json', 'private') | Sort-Object
  if ($rootEntries.Count -ne $expectedRootNames.Count -or
      ($actualRootNames -join ',') -cne ($expectedRootNames -join ',')) {
    throw 'prepared root inventory must contain only case, input, prepared.json, and private'
  }

  $expectedPaths = [ordered]@{
    appdata = $PrivateAppdata
    case = $casePath
    home = $PrivateHome
    paste = Join-Path $PrivateAppdata '临时\粘贴'
    ready = $readyPath
    root = $rootFull
    system = Join-Path $rootFull 'private\system'
    temp = $PrivateTemp
  }
  $actualPathNames = @($manifest.paths.PSObject.Properties.Name | Sort-Object)
  $expectedPathNames = @($expectedPaths.Keys | Sort-Object)
  if (($actualPathNames -join ',') -cne ($expectedPathNames -join ',')) {
    throw 'prepared canonical path set mismatch'
  }
  foreach ($name in $expectedPaths.Keys) {
    $expected = [IO.Path]::GetFullPath([string]$expectedPaths[$name])
    $entry = $manifest.paths.PSObject.Properties[$name].Value
    if ($null -eq $entry -or
        [string]$entry.path -ine $expected -or
        [string]$entry.canonical -ine $expected.ToLowerInvariant()) {
      throw "prepared canonical path identity mismatch: $name"
    }
  }

  $readyEntries = @(Get-ChildItem -LiteralPath $readyPath -Force)
  if ($readyEntries.Count -ne $ReadyInputFiles -or
      -not (Test-Path -LiteralPath $readyFixture -PathType Leaf) -or
      -not (Test-Path -LiteralPath $citationSourcePath -PathType Leaf) -or
      @($readyEntries | Where-Object PSIsContainer).Count -ne 0 -or
      @($readyEntries | Where-Object {
        $_.FullName -ine $readyFixture -and $_.FullName -ine $citationSourcePath
      }).Count -ne 0) {
    throw 'prepared ready inventory mismatch'
  }
  Assert-NoReparsePath $readyFixture
  Assert-NoReparsePath $citationSourcePath
  if ((Get-Item -LiteralPath $readyFixture).Length -ne $FixtureBytes -or
      (Get-Sha256 $readyFixture) -ne $FixtureSha256) {
    throw 'prepared JPEG identity mismatch'
  }
  if ((Get-Item -LiteralPath $citationSourcePath).Length -ne $CitationSourceBytes -or
      (Get-Sha256 $citationSourcePath) -ne $CitationSourceSha256) {
    throw 'prepared citation PDF copy identity mismatch'
  }

  $actualCitationSourceMtimeNs = (
    (Get-Item -LiteralPath $citationSourcePath).LastWriteTimeUtc.ToFileTimeUtc() -
    116444736000000000L
  ) * 100L
  if ($null -eq $manifest.citation_source) {
    throw 'prepared citation_source is missing'
  }
  $citationSourcePropertyNames = @($manifest.citation_source.PSObject.Properties.Name | Sort-Object)
  $expectedCitationSourcePropertyNames = @('bytes', 'canonical', 'mtime_ns', 'path', 'sha256')
  if (($citationSourcePropertyNames -join ',') -cne ($expectedCitationSourcePropertyNames -join ',') -or
      [long]$manifest.citation_source.bytes -ne $CitationSourceBytes -or
      [string]$manifest.citation_source.sha256 -cne $CitationSourceSha256 -or
      [long]$manifest.citation_source.mtime_ns -ne $actualCitationSourceMtimeNs -or
      [string]$manifest.citation_source.path -ine $citationSourcePath -or
      [string]$manifest.citation_source.canonical -ine $citationSourcePath.ToLowerInvariant()) {
    throw 'prepared citation_source identity mismatch'
  }

  Assert-NoReparsePath $PdfFixtureSourcePath
  if ((Get-Item -LiteralPath $PdfFixtureSourcePath).Length -ne $CitationSourceBytes -or
      (Get-Sha256 $PdfFixtureSourcePath) -ne $CitationSourceSha256) {
    throw 'prepared PDF source actual-file identity mismatch'
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
  if (($pdfCopyPropertyNames -join ',') -cne ($expectedPdfCopyPropertyNames -join ',') -or
      [long]$manifest.pdf_copy.bytes -ne $CitationSourceBytes -or
      [string]$manifest.pdf_copy.sha256 -cne $CitationSourceSha256 -or
      [long]$manifest.pdf_copy.mtime_ns -ne $actualCitationSourceMtimeNs -or
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
  Assert-NoReparsePath $SourcePinsPath
  if ((Get-Item -LiteralPath $SourcePinsPath).Length -ne $SourcePinsBytes -or
      (Get-Sha256 $SourcePinsPath) -ne $SourcePinsSha256) {
    throw 'source pins actual-file identity mismatch'
  }
  if ($null -eq $manifest.source_pins -or
      (@($manifest.source_pins.PSObject.Properties.Name | Sort-Object) -join ',') -cne
        (@('bytes', 'canonical', 'frozen_sha256', 'path', 'sha256') -join ',') -or
      [long]$manifest.source_pins.bytes -ne $SourcePinsBytes -or
      [string]$manifest.source_pins.sha256 -cne $SourcePinsSha256 -or
      [string]$manifest.source_pins.frozen_sha256 -cne $SourcePinsSha256 -or
      [string]$manifest.source_pins.path -ine $SourcePinsPath -or
      [string]$manifest.source_pins.canonical -ine $SourcePinsPath.ToLowerInvariant() -or
      @($manifest.source.PSObject.Properties).Count -ne $PreparedSourceCount) {
    throw 'prepared source pins identity mismatch'
  }
  Assert-NoReparsePath $SafetyBasePath
  if ((Get-Item -LiteralPath $SafetyBasePath).Length -ne $SafetyBaseBytes -or
      (Get-Sha256 $SafetyBasePath) -ne $SafetyBaseSha256) {
    throw 'safety base actual-file identity mismatch'
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
    throw 'prepared native entry source identity mismatch'
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
    if ((Get-Item -LiteralPath $sourcePath).Length -ne [long]$property.Value.bytes -or
        (Get-Sha256 $sourcePath) -ne [string]$property.Value.sha256) {
      throw "prepared source identity mismatch: $($property.Name)"
    }
  }

  if ((Get-Sha256 $settingsPath) -ne $PreparedSettingsSha256 -or
      [string]$manifest.settings.sha256 -cne $PreparedSettingsSha256 -or
      [string]$manifest.settings.path -ine $settingsPath -or
      [string]$manifest.settings.canonical -ine $settingsPath.ToLowerInvariant()) {
    throw 'prepared settings identity mismatch'
  }
  $settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
  if ($settings.external_llm.enabled -ne $false -or
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
  if ([string]$marker.root -ine $casePath -or
      ($marker.PSObject.Properties.Name -join ',') -cne 'root') {
    throw 'prepared daily marker content mismatch'
  }
  if (@(Get-ChildItem -LiteralPath $casePath -Force).Count -ne 0) {
    throw 'prepared case directory is not empty'
  }
  foreach ($artifact in @('started.json', 'ready.json', 'final-metadata.json', 'loop-closed.json', 'requests.ndjson', 'run-error.json')) {
    if (Test-Path -LiteralPath (Join-Path $rootFull $artifact)) {
      throw "root already served or reused: $artifact"
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
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/agent.js'; Bytes = 537563; Sha = '0013b9564720a2c68fe2239a36ebfe6f2e80aee35d8e3ade019384b62091135b' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/client.js'; Bytes = 537185; Sha = 'fcf4210f78ffedce8b25e99301003ab3c0aadcbb2468b1212e68909a526991ed' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/credentials.js'; Bytes = 15774; Sha = '556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/host.js'; Bytes = 900805; Sha = '84adeef92360e0ef3faddb1b89e6d56a2c66135e2b07283a180049613bce8164' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/index.js'; Bytes = 208; Sha = 'df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956' },
  @{ Path = 'profile-node_modules/lawbench-dsh/lib/session-store.js'; Bytes = 44858; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' },
  @{ Path = 'profile-node_modules/lawbench-dsh/package.json'; Bytes = 1257; Sha = '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794' },
  @{ Path = 'profile-node_modules/lawbench-dsh/persona.md'; Bytes = 2706; Sha = 'a0dbc2b314f781d2b74a99edce633a289176965a549e00e45c946f0c5bf877c3' }
)

$NativeShimPins = @(
  @{ Name = 'host.js'; Bytes = 900805; Sha = '84adeef92360e0ef3faddb1b89e6d56a2c66135e2b07283a180049613bce8164' },
  @{ Name = 'agent.js'; Bytes = 537563; Sha = '0013b9564720a2c68fe2239a36ebfe6f2e80aee35d8e3ade019384b62091135b' },
  @{ Name = 'session-store.js'; Bytes = 44858; Sha = '91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762' }
)

function Assert-Preflight {
  if ($PrivateOutputPins.Count -ne 24) {
    throw 'literal private output pin count must be 24'
  }
  if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
    throw "run root must be a direct child of $runsFull"
  }
  if ($rootFull -notmatch '\\T32-pdf-citation-[0-9]{8}-[0-9]{6}$') {
    throw "bad run root name: $rootFull"
  }
  Assert-NoReparsePath $rootFull
  Assert-NoReparsePath $Project
  Assert-NoReparsePath $PrimaryRuntime
  Assert-NoReparsePath $DesktopRoot
  Assert-NoReparsePath $BProductRoot
  Assert-NoReparsePath $PrivateBuildRoot
  Assert-NoReparsePath $NativeEntry
  Assert-NoReparsePath $Fixture
  Assert-Sha256 $NativeEntry $NativeEntrySha256 'pinned native entry'
  if ((Get-Item -LiteralPath $NativeEntry).Length -ne $NativeEntryBytes) {
    throw 'pinned native entry byte count mismatch'
  }
  Assert-File $Fixture 'synthetic JPEG fixture'
  if ((Get-Item -LiteralPath $Fixture).Length -ne $FixtureBytes -or
      (Get-Sha256 $Fixture) -ne $FixtureSha256) {
    throw 'synthetic JPEG fixture identity mismatch'
  }
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

  [void](Assert-PreparedInputs)
  if (Test-Path -LiteralPath $GuiRoot) {
    throw "GUI run directory already exists; fresh root required: $GuiRoot"
  }
}

function Prepare-PrivateProfile {
  foreach ($directory in @(
    $GuiRoot, $StateDir, $LogDir, $DshHome, $UserData, $HostSkills,
    $Roaming, $ProgramData,
    $ProfileDir, $PrivateNative, $PrivateNativeLib
  )) {
    if (Test-Path -LiteralPath $directory) { throw "fresh directory already exists: $directory" }
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  Assert-NoReparsePath $ProfileDir
  Assert-NoReparsePath $PrivateNative
  foreach ($directory in @($PrivateHome, $PrivateAppdata, $PrivateTemp)) {
    Assert-Directory $directory 'native private directory'
  }

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
  $legalUiIndex = Join-Path $ProfileNodeModules 'lawbench-dsh\lib\index.js'
  $legalHostShim = Join-Path $PrivateNativeLib 'host.js'
  $legalAgentShim = Join-Path $PrivateNativeLib 'agent.js'
  $legalSessionStoreShim = Join-Path $PrivateNativeLib 'session-store.js'
  $legalUiUrl = ([Uri]$legalUiIndex).AbsoluteUri
  $legalHostUrl = ([Uri]$legalHostShim).AbsoluteUri
  $legalAgentUrl = ([Uri]$legalAgentShim).AbsoluteUri
  $legalSessionStoreUrl = ([Uri]$legalSessionStoreShim).AbsoluteUri
  foreach ($routeTarget in @(
    @{ Label = 'legal UI'; File = $legalUiIndex; Url = $legalUiUrl },
    @{ Label = 'legal Host'; File = $legalHostShim; Url = $legalHostUrl },
    @{ Label = 'legal Agent'; File = $legalAgentShim; Url = $legalAgentUrl },
    @{ Label = 'legal session store'; File = $legalSessionStoreShim; Url = $legalSessionStoreUrl }
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
  $suffix = $suffixTemplate.Replace('__LEGAL_UI_URL__', $legalUiUrl).Replace('__LEGAL_HOST_URL__', $legalHostUrl).Replace('__LEGAL_SESSION_STORE_URL__', $legalSessionStoreUrl).Replace('__LEGAL_AGENT_URL__', $legalAgentUrl)
  if ($suffix.Contains('__LEGAL_', [StringComparison]::Ordinal)) {
    throw 'private profile route placeholder remained after substitution'
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
  $overlayLines = @($overlayLf.Split([string[]]@("`n"), [StringSplitOptions]::None))
  foreach ($expectedLine in @(
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
    if ($count -ne 1) {
      throw "overlay literal line must occur exactly once ($($expectedLine.Label)): $($expectedLine.Line)"
    }
  }
  foreach ($expectedBlock in @(
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

if ($rootFull -notmatch '\\T32-pdf-citation-[0-9]{8}-[0-9]{6}$') {
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
