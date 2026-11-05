[CmdletBinding()]
param(
  [string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$EvidenceRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218'
$RunsRoot = Join-Path $EvidenceRoot 'runs'
$SourceCaseRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case'
$SourceRunReport = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\admission-report.json'
$SourceRunReportSha256 = '238bc2fa4d720d0b5c41e60f1c66a0fe51610e5b7a100b7593f4b61e978ea08e'
$SourceRunPacketManifestSha256 = 'b7c1933e9065a67049a2f4cb14d6eac804f084d388a130371664442876d708f4'
$ExpectedCaseId = '872b161f-27d4-40bf-879e-ee457ef6454b'
$ExpectedSourceTreeSha256 = 'fbace1ea0b8a396669e8b544af60778b33c6ef83c7c60852615b174de7e35716'
$PreparedFormat = 'lawbench-t34-private-projection-observer-prepared-v1'

$ExpectedFiles = @(
  @{ RelativePath = '工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-97c67db2-b8a6-428b-be48-04b4144d10bd/session.v4.jsonl'; Bytes = 12059; Sha256 = 'e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee' },
  @{ RelativePath = '工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-7fd6b82e-f361-456a-9c91-b6ba77991bb9/session.v4.jsonl'; Bytes = 16235; Sha256 = 'b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461' },
  @{ RelativePath = '工作区/case.db'; Bytes = 65536; Sha256 = '47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6' },
  @{ RelativePath = '工作区/case.db-shm'; Bytes = 32768; Sha256 = 'fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb' },
  @{ RelativePath = '工作区/case.db-wal'; Bytes = 0; Sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
)

$ExpectedDirectories = @(
  '成果',
  '工作区',
  '工作区/材料',
  '工作区/材料/识别页',
  '工作区/材料/文本',
  '工作区/会话',
  '工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--',
  '工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-7fd6b82e-f361-456a-9c91-b6ba77991bb9',
  '工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-97c67db2-b8a6-428b-be48-04b4144d10bd',
  '工作区/临时',
  '工作区/任务',
  '工作区/wiki'
)

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-ExtendedPath([string]$Path) {
  $full = [IO.Path]::GetFullPath($Path)
  if ($full.StartsWith('\\?\', [StringComparison]::Ordinal)) {
    return $full
  }
  if ($full.StartsWith('\\', [StringComparison]::Ordinal)) {
    return '\\?\UNC\' + $full.Substring(2)
  }
  return '\\?\' + $full
}

function Assert-NoReparsePath([string]$Path, [switch]$AllowMissingTail) {
  $full = [IO.Path]::GetFullPath($Path)
  $root = [IO.Path]::GetPathRoot($full)
  $current = $root
  foreach ($segment in (($full.Substring($root.Length)) -split '[\\/]+')) {
    if (-not $segment) { continue }
    $current = Join-Path $current $segment
    if (-not (Test-Path -LiteralPath (Get-ExtendedPath $current))) {
      if ($AllowMissingTail) { continue }
      throw "path component missing: $current"
    }
    $item = Get-Item -LiteralPath (Get-ExtendedPath $current) -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "reparse point refused: $current"
    }
  }
}

function Get-TreeRows([string]$Root) {
  $extended = Get-ExtendedPath $Root
  $rows = foreach ($file in @(Get-ChildItem -LiteralPath $extended -Recurse -File -Force)) {
    if (($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "reparse file refused: $($file.FullName)"
    }
    $relative = $file.FullName.Substring($extended.Length).TrimStart('\').Replace('\', '/')
    [pscustomobject]@{
      relativePath = $relative
      bytes = [long]$file.Length
      sha256 = Get-Sha256 $file.FullName
      sortKey = [Convert]::ToHexString([Text.Encoding]::UTF8.GetBytes($relative))
    }
  }
  return @($rows | Sort-Object sortKey | ForEach-Object {
    [pscustomobject][ordered]@{
      relativePath = $_.relativePath
      bytes = $_.bytes
      sha256 = $_.sha256
    }
  })
}

function Get-TreeDigest($Rows) {
  $canonical = (($Rows | ForEach-Object {
    "$($_.relativePath)`t$($_.bytes)`t$($_.sha256)"
  }) -join "`n") + "`n"
  return [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($canonical))
  ).ToLowerInvariant()
}

function Assert-ExactRows($Rows, [string]$Label) {
  if ($Rows.Count -ne $ExpectedFiles.Count) {
    throw "$Label file inventory or identity mismatch"
  }
  $actual = [Collections.Generic.Dictionary[string, string]]::new(
    [StringComparer]::Ordinal
  )
  foreach ($row in $Rows) {
    $actual[$row.relativePath] = "$($row.bytes)|$($row.sha256)"
  }
  foreach ($expected in $ExpectedFiles) {
    if (-not $actual.ContainsKey($expected.RelativePath) -or
        $actual[$expected.RelativePath] -cne
          "$($expected.Bytes)|$($expected.Sha256)") {
      throw "$Label file inventory or identity mismatch"
    }
  }
}

function Write-JsonNoBom([string]$Path, $Value) {
  $encoded = ($Value | ConvertTo-Json -Depth 20) + "`n"
  [IO.File]::WriteAllText(
    (Get-ExtendedPath $Path),
    $encoded,
    [Text.UTF8Encoding]::new($false)
  )
}

if (-not (Test-Path -LiteralPath $SourceCaseRoot -PathType Container)) {
  throw "source case missing: $SourceCaseRoot"
}
if (-not (Test-Path -LiteralPath $SourceRunReport -PathType Leaf)) {
  throw "source run report missing: $SourceRunReport"
}
if ((Get-Sha256 $SourceRunReport) -cne $SourceRunReportSha256) {
  throw 'source run report identity mismatch'
}
Assert-NoReparsePath $SourceCaseRoot
Assert-NoReparsePath $SourceRunReport

$sourceFiles = @(Get-TreeRows $SourceCaseRoot)
Assert-ExactRows $sourceFiles 'source case'
if ((Get-TreeDigest $sourceFiles) -cne $ExpectedSourceTreeSha256) {
  throw 'source case tree digest mismatch'
}

$sourceDirs = @(
  Get-ChildItem -LiteralPath (Get-ExtendedPath $SourceCaseRoot) -Recurse -Directory -Force |
    ForEach-Object {
      if (($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "reparse directory refused: $($_.FullName)"
      }
      $_.FullName.Substring((Get-ExtendedPath $SourceCaseRoot).Length).TrimStart('\').Replace('\', '/')
    } |
    Sort-Object
)
if (($sourceDirs -join "`n") -cne (($ExpectedDirectories | Sort-Object) -join "`n")) {
  throw 'source case directory inventory mismatch'
}

if ([string]::IsNullOrWhiteSpace($RunRoot)) {
  $RunRoot = Join-Path $RunsRoot ('T34-private-projection-observer-{0}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
$rootFull = [IO.Path]::GetFullPath($RunRoot)
$runsFull = [IO.Path]::GetFullPath($RunsRoot)
if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsFull.TrimEnd('\')) {
  throw "run root must be a direct child of $runsFull"
}
if ($rootFull -notmatch '\\T34-private-projection-observer-[0-9]{8}-[0-9]{6}$') {
  throw "run root name must be T34-private-projection-observer-YYYYMMDD-HHMMSS: $rootFull"
}
if (Test-Path -LiteralPath $rootFull) {
  throw "run root already exists: $rootFull"
}
Assert-NoReparsePath $rootFull -AllowMissingTail

[void][IO.Directory]::CreateDirectory((Get-ExtendedPath $rootFull))
foreach ($relative in $ExpectedDirectories) {
  $sourceDirectory = Join-Path $SourceCaseRoot ($relative.Replace('/', '\'))
  $targetDirectory = Join-Path $rootFull ('case\' + $relative.Replace('/', '\'))
  Assert-NoReparsePath $sourceDirectory
  [void][IO.Directory]::CreateDirectory((Get-ExtendedPath $targetDirectory))
}

foreach ($expected in $ExpectedFiles) {
  $source = Join-Path $SourceCaseRoot ($expected.RelativePath.Replace('/', '\'))
  $target = Join-Path $rootFull ('case\' + $expected.RelativePath.Replace('/', '\'))
  [IO.File]::Copy(
    (Get-ExtendedPath $source),
    (Get-ExtendedPath $target),
    $false
  )
  [IO.File]::SetLastWriteTimeUtc(
    (Get-ExtendedPath $target),
    [IO.File]::GetLastWriteTimeUtc((Get-ExtendedPath $source))
  )
  if ((Get-Sha256 $target) -cne $expected.Sha256) {
    throw "copied case file identity mismatch: $($expected.RelativePath)"
  }
}

$targetFiles = @(Get-TreeRows (Join-Path $rootFull 'case'))
Assert-ExactRows $targetFiles 'copied case'
if ((Get-TreeDigest $sourceFiles) -cne $ExpectedSourceTreeSha256 -or
    (Get-TreeDigest $targetFiles) -cne $ExpectedSourceTreeSha256) {
  throw 'source or copied case changed during preparation'
}

foreach ($name in @('home', 'appdata', 'system', 'temp', 'roaming', 'programdata')) {
  [void][IO.Directory]::CreateDirectory(
    (Get-ExtendedPath (Join-Path $rootFull "private\$name"))
  )
}
[void][IO.Directory]::CreateDirectory(
  (Get-ExtendedPath (Join-Path $rootFull 'private\appdata\临时\粘贴'))
)
[void][IO.Directory]::CreateDirectory(
  (Get-ExtendedPath (Join-Path $rootFull 'private\home\Desktop'))
)

$settings = [ordered]@{
  v = 1
  servers = [ordered]@{
    llm_base_url = 'http://127.0.0.1:65001/v1'
    prep_base_url = 'http://127.0.0.1:65002'
    llm_alt_base_url = 'http://127.0.0.1:65003/v1'
    prep_alt_base_url = 'http://127.0.0.1:65004'
  }
  defaults = [ordered]@{
    thinking = '中'
    window = '64K'
    max_tokens = 16384
    temperature = 0.6
  }
  skill_presets = [ordered]@{}
  templates = [ordered]@{ '文书' = $null; '合同' = $null }
  ocr_fallback_llm = $false
  profile = [ordered]@{ lawyer_name = $null }
  office = [ordered]@{ dir = $null; invoice_buyer = $null }
  converter = 'auto'
  external_llm = [ordered]@{
    enabled = $false
    base_url = $null
    model = $null
    context_window = $null
    supports_tools = $true
  }
}
$settingsPath = Join-Path $rootFull 'private\appdata\settings.json'
Write-JsonNoBom $settingsPath $settings
$markerPath = Join-Path $rootFull 'private\appdata\daily-case.json'
Write-JsonNoBom $markerPath ([ordered]@{ root = (Join-Path $rootFull 'case') })

$manifest = [ordered]@{
  format = $PreparedFormat
  task = 'A-T34-private-projection-observer-20261030-061810'
  createdAt = (Get-Date).ToString('o')
  expectedCaseId = $ExpectedCaseId
  sourceCaseRoot = $SourceCaseRoot
  sourceRunReport = [ordered]@{
    path = $SourceRunReport
    bytes = (Get-Item -LiteralPath $SourceRunReport).Length
    sha256 = $SourceRunReportSha256
    packetManifestSha256 = $SourceRunPacketManifestSha256
  }
  sourceTree = [ordered]@{
    algorithm = 'ordinal-path-tab-size-tab-sha256-lf-v1'
    files = $sourceFiles.Count
    bytes = [long](($sourceFiles | Measure-Object bytes -Sum).Sum)
    sha256 = $ExpectedSourceTreeSha256
  }
  sourceFiles = $sourceFiles
  targetFilesBeforeAdmission = $targetFiles
  targetLogs = @(
    [ordered]@{
      role = 'source'
      sessionId = 'session-97c67db2-b8a6-428b-be48-04b4144d10bd'
      bytes = 12059
      sha256 = 'e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee'
    },
    [ordered]@{
      role = 'child'
      sessionId = 'session-7fd6b82e-f361-456a-9c91-b6ba77991bb9'
      bytes = 16235
      sha256 = 'b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461'
    }
  )
  paths = [ordered]@{
    root = $rootFull
    case = (Join-Path $rootFull 'case')
    private = (Join-Path $rootFull 'private')
    home = (Join-Path $rootFull 'private\home')
    appdata = (Join-Path $rootFull 'private\appdata')
    system = (Join-Path $rootFull 'private\system')
    temp = (Join-Path $rootFull 'private\temp')
    roaming = (Join-Path $rootFull 'private\roaming')
    programdata = (Join-Path $rootFull 'private\programdata')
  }
  settings = [ordered]@{
    path = $settingsPath
    bytes = (Get-Item -LiteralPath $settingsPath).Length
    sha256 = (Get-Sha256 $settingsPath)
  }
  dailyMarker = [ordered]@{
    path = $markerPath
    bytes = (Get-Item -LiteralPath $markerPath).Length
    sha256 = (Get-Sha256 $markerPath)
    root = (Join-Path $rootFull 'case')
  }
  state = [ordered]@{
    runtimeArtifactsAbsent = $true
    sourceUnchanged = $true
    copiedBytesEqual = $true
    registered = $false
    guiStarted = $false
    deleteAttempted = $false
  }
}
$preparedPath = Join-Path $rootFull 'prepared.json'
Write-JsonNoBom $preparedPath $manifest

$rootEntries = @(Get-ChildItem -LiteralPath (Get-ExtendedPath $rootFull) -Force | ForEach-Object Name | Sort-Object)
$expectedRootEntries = @('case', 'prepared.json', 'private') | Sort-Object
if (($rootEntries -join ',') -cne ($expectedRootEntries -join ',')) {
  throw 'prepared root inventory mismatch'
}
foreach ($artifact in @(
  'admission.json', 'started.json', 'ready.json', 'final-metadata.json',
  'loop-closed.json', 'requests.ndjson', 'run-error.json'
)) {
  if (Test-Path -LiteralPath (Join-Path $rootFull $artifact)) {
    throw "fresh root unexpectedly contains: $artifact"
  }
}

[ordered]@{
  ok = $true
  runRoot = $rootFull
  prepared = $preparedPath
  preparedSha256 = (Get-Sha256 $preparedPath)
  sourceTreeSha256 = $ExpectedSourceTreeSha256
  sourceFiles = $sourceFiles.Count
  copiedBytesEqual = $true
  sourceUnchanged = $true
  registered = $false
  guiStarted = $false
  deleteAttempted = $false
} | ConvertTo-Json -Depth 5
