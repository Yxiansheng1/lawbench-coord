[CmdletBinding(DefaultParameterSetName = 'ValidateOnly')]
param(
    [Parameter(Mandatory = $true, ParameterSetName = 'ValidateOnly')]
    [switch]$ValidateOnly,

    [Parameter(Mandatory = $true, ParameterSetName = 'ManifestOnly')]
    [switch]$ManifestOnly,

    [Parameter(Mandatory = $true, ParameterSetName = 'Run')]
    [ValidatePattern('^[0-9]{8}-[0-9]{6}$')]
    [string]$RunStamp,

    [Parameter(Mandatory = $true, ParameterSetName = 'Run')]
    [string]$ApprovedSourceManifestPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:Root = $PSScriptRoot
$script:ConfigPath = Join-Path $script:Root 'builder.config.json'
$script:BuilderPath = Join-Path $script:Root 'build-private.mjs'
$script:BuildConfigPath = Join-Path $script:Root 'build-config.mjs'
$script:ChildAuditPath = $null
$script:RunRoot = $null
$script:Environment = $null

function Stop-Gate {
    param([Parameter(Mandatory = $true)][string]$Message)
    throw $Message
}

function Assert-True {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) {
        Stop-Gate $Message
    }
}

function Get-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath($Path)
}

function Assert-Within {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$Candidate,
        [Parameter(Mandatory = $true)][string]$Label,
        [switch]$AllowEqual
    )

    $rootFull = (Get-FullPath $Root).TrimEnd('\', '/')
    $candidateFull = (Get-FullPath $Candidate).TrimEnd('\', '/')
    $equal = [string]::Equals($rootFull, $candidateFull, [System.StringComparison]::OrdinalIgnoreCase)
    $inside = $candidateFull.StartsWith($rootFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
    Assert-True ($inside -or ($AllowEqual.IsPresent -and $equal)) "$Label escapes $rootFull`: $candidateFull"
}

function Assert-NoReparsePath {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [switch]$AllowMissingTail
    )

    $full = Get-FullPath $Path
    $pathRoot = [System.IO.Path]::GetPathRoot($full)
    $current = $pathRoot
    $tail = $full.Substring($pathRoot.Length)
    foreach ($segment in ($tail -split '[\\/]+' | Where-Object { $_ -ne '' })) {
        $current = Join-Path $current $segment
        if (-not (Test-Path -LiteralPath $current)) {
            if ($AllowMissingTail.IsPresent) {
                continue
            }
            Stop-Gate "Required path component is missing: $current"
        }
        $attributes = [System.IO.File]::GetAttributes($current)
        Assert-True (($attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) "Reparse point refused: $current"
    }
}

function Assert-RegularFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Leaf) "Required regular file is missing: $Path"
    $attributes = [System.IO.File]::GetAttributes($Path)
    Assert-True (($attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) "Reparse-point file refused: $Path"
}

function Assert-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    Assert-True (Test-Path -LiteralPath $Path -PathType Container) "Required directory is missing: $Path"
    $attributes = [System.IO.File]::GetAttributes($Path)
    Assert-True (($attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) "Reparse-point directory refused: $Path"
}

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $sha = [System.Security.Cryptography.SHA256]::Create()
        try {
            return [Convert]::ToHexString($sha.ComputeHash($stream)).ToLowerInvariant()
        }
        finally {
            $sha.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

function Assert-PinnedFile {
    param(
        [Parameter(Mandatory = $true)]$Pin,
        [Parameter(Mandatory = $true)][string]$Label,
        [switch]$MetadataOnly
    )

    $path = [string]$Pin.path
    Assert-RegularFile $path
    $item = Get-Item -LiteralPath $path -Force
    $pinNames = @($Pin.PSObject.Properties.Name)
    if ($pinNames -contains 'bytes') {
        Assert-True ($item.Length -eq [long]$Pin.bytes) "$Label size changed: $path"
    }
    if (-not $MetadataOnly.IsPresent) {
        $actual = Get-Sha256 $path
        Assert-True ($actual -ceq [string]$Pin.sha256) "$Label hash changed: $path"
    }
}

function Get-DeniedExtensionSet {
    param($Config)
    $set = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($extension in $Config.payloadPolicy.deniedExtensions) {
        [void]$set.Add([string]$extension)
    }
    return $set
}

function Get-DeniedSegmentSet {
    param($Config)
    $set = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($segment in $Config.payloadPolicy.deniedDirectorySegments) {
        [void]$set.Add([string]$segment)
    }
    return $set
}

function Get-EngineExtensionSet {
    param($Config)
    $set = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($extension in $Config.payloadPolicy.engineAllowedExtensions) {
        [void]$set.Add([string]$extension)
    }
    return $set
}

function Test-SafePayloadRelativePath {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][string]$Selector,
        [Parameter(Mandatory = $true)]$Config
    )

    $relative = $RelativePath.Replace('\', '/')
    $parts = @($relative.Split('/'))
    $deniedSegments = Get-DeniedSegmentSet $Config
    foreach ($part in $parts) {
        if ($deniedSegments.Contains($part)) {
            return $false
        }
    }

    $name = $parts[$parts.Count - 1]
    $lowerName = $name.ToLowerInvariant()
    $extension = [System.IO.Path]::GetExtension($lowerName)
    $deniedExtensions = Get-DeniedExtensionSet $Config
    $isProductDocument = ($Selector -eq 'service-safe' -and @($Config.payloadPolicy.productDocumentAllowlist) -contains $relative) -or
        ($Selector -eq 'engine-safe' -and $relative.StartsWith('retainer/resources/templates/') -and $extension -eq '.docx') -or
        ($Selector -eq 'all-safe' -and $relative -eq 'COPYING.rtf')
    if ($deniedExtensions.Contains($extension) -and -not $isProductDocument) {
        return $false
    }
    if ($lowerName -eq '.env' -or $lowerName.Contains('.env.') -or $lowerName.EndsWith('.env')) {
        return $false
    }
    foreach ($forbiddenNamePrefix in @('credential', 'secret', 'password', 'passwd')) {
        if ($lowerName.StartsWith($forbiddenNamePrefix, [System.StringComparison]::Ordinal) -and $extension -notin @('.js', '.mjs', '.cjs', '.ts', '.py')) {
            return $false
        }
    }

    switch ($Selector) {
        'all-safe' {
            return $true
        }
        'service-safe' {
            if ($parts.Count -eq 1) {
                return $extension -eq '.py'
            }
            $allowed = @('api', 'archive', 'calc', 'case', 'checks', 'export', 'ingest', 'invoice', 'llm', 'ocr', 'office', 'pipeline', 'retainer', 'search', 'tools', 'wiki')
            return $allowed -contains $parts[0]
        }
        'contracts-safe' {
            if ($parts.Count -eq 1) {
                $allowed = @('VERSION', 'common.schema.json', 'README.md', 'formats.md', 'check_examples.py', 'case_db.sql')
                return $allowed -contains $parts[0]
            }
            $allowed = @('api', 'core', 'files', 'prep395', 'skill', 'tools')
            return $allowed -contains $parts[0]
        }
        'skills-approved' {
            if ($parts.Count -eq 1) {
                $allowed = @('capsules.default.json', 'README.md')
                return $allowed -contains $parts[0]
            }
            $allowed = @(
                '_scripts', '_shared', 'bid-drafting', 'case-archiving', 'case-reading-notes',
                'case-wiki-build', 'contract-draft', 'contract-review', 'criminal-applications',
                'criminal-evidence-review', 'criminal-reading-notes', 'cross-exam-opinion',
                'defense-opinion', 'doc-revise', 'general-drafting', 'legal-workflow',
                'litigation-docs', 'pre-issue-check', 'sentence-calc', 'tender-review'
            )
            return $allowed -contains $parts[0]
        }
        'engine-safe' {
            return $isProductDocument -or (Get-EngineExtensionSet $Config).Contains($extension)
        }
        default {
            Stop-Gate "Unknown safe selector: $Selector"
        }
    }
}

function Get-SafeFileList {
    param(
        [Parameter(Mandatory = $true)][string]$SafeRoot,
        [Parameter(Mandatory = $true)][string]$Selector,
        [Parameter(Mandatory = $true)]$Config
    )

    Assert-Directory $SafeRoot
    $rootFull = (Get-FullPath $SafeRoot).TrimEnd('\', '/')
    $files = [System.Collections.Generic.List[object]]::new()
    $deniedSegments = Get-DeniedSegmentSet $Config

    function Visit-Directory {
        param([Parameter(Mandatory = $true)][string]$Directory)

        Assert-NoReparsePath $Directory
        foreach ($child in (Get-ChildItem -LiteralPath $Directory -Force | Sort-Object Name)) {
            $attributes = $child.Attributes
            Assert-True (($attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) "Reparse point refused in safe payload: $($child.FullName)"
            if ($child.PSIsContainer) {
                if ($deniedSegments.Contains($child.Name)) {
                    continue
                }
                Visit-Directory $child.FullName
                continue
            }
            Assert-True ($child -is [System.IO.FileInfo]) "Non-regular payload entry refused: $($child.FullName)"
            $relative = [System.IO.Path]::GetRelativePath($rootFull, $child.FullName).Replace('\', '/')
            if (Test-SafePayloadRelativePath -RelativePath $relative -Selector $Selector -Config $Config) {
                $files.Add([pscustomobject]@{
                    FullName = $child.FullName
                    Relative = $relative
                    Bytes = [long]$child.Length
                })
            }
        }
    }

    Visit-Directory $rootFull
    return $files.ToArray()
}

function Get-SortedTreeManifest {
    param(
        [Parameter(Mandatory = $true)][string]$SafeRoot,
        [Parameter(Mandatory = $true)][string]$Selector,
        [Parameter(Mandatory = $true)]$Config
    )

    $files = @(Get-SafeFileList -SafeRoot $SafeRoot -Selector $Selector -Config $Config)
    $byRelative = @{}
    foreach ($file in $files) {
        $byRelative[$file.Relative] = $file
    }
    $paths = [string[]]$byRelative.Keys
    [Array]::Sort($paths, [System.StringComparer]::Ordinal)

    $rows = [System.Collections.Generic.List[string]]::new()
    $bytes = [long]0
    foreach ($path in $paths) {
        $file = $byRelative[$path]
        $bytes += $file.Bytes
        $hash = Get-Sha256 $file.FullName
        $rows.Add("$path`t$($file.Bytes)`t$hash")
    }
    $material = if ($rows.Count -eq 0) { "`n" } else { ($rows -join "`n") + "`n" }
    $sha = [System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::UTF8.GetBytes($material))
    return [pscustomobject]@{
        files = $paths.Count
        bytes = $bytes
        sha256 = [Convert]::ToHexString($sha).ToLowerInvariant()
    }
}

function Copy-SafeTree {
    param(
        [Parameter(Mandatory = $true)][string]$SafeRoot,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$Selector,
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot
    )

    Assert-Within $RunRoot $Destination 'safe-copy destination'
    $files = @(Get-SafeFileList -SafeRoot $SafeRoot -Selector $Selector -Config $Config)
    foreach ($file in $files) {
        $target = Join-Path $Destination $file.Relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        Assert-Within $RunRoot $target 'safe-copy file destination'
        $parent = [System.IO.Path]::GetDirectoryName($target)
        [void][System.IO.Directory]::CreateDirectory($parent)
        [System.IO.File]::Copy($file.FullName, $target, $false)
        Assert-True ((Get-Item -LiteralPath $target).Length -eq $file.Bytes) "Safe-copy size mismatch: $target"
    }
    return $files.Count
}

function Remove-ScopedDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$RunRoot
    )
    Assert-Within $RunRoot $Path 'scoped directory removal'
    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
}

function Get-CleanProcessEnvironment {
    param([Parameter(Mandatory = $true)][string]$RunRoot)

    $privateRoot = Join-Path $RunRoot 'private-environment'
    $temp = Join-Path $privateRoot 'temp'
    $appData = Join-Path $privateRoot 'appdata'
    $localAppData = Join-Path $privateRoot 'local-appdata'
    $userProfile = Join-Path $privateRoot 'userprofile'
    $cache = Join-Path $RunRoot 'cache'
    [void][System.IO.Directory]::CreateDirectory($temp)
    [void][System.IO.Directory]::CreateDirectory($appData)
    [void][System.IO.Directory]::CreateDirectory($localAppData)
    [void][System.IO.Directory]::CreateDirectory($userProfile)
    [void][System.IO.Directory]::CreateDirectory($cache)

    $nodeDirectory = [System.IO.Path]::GetDirectoryName([string]$script:Config.literalPins.nodeExecutable.executable)
    $pathParts = @(
        $nodeDirectory,
        'E:\Git\cmd',
        (Join-Path $env:SystemRoot 'System32'),
        (Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0'),
        $env:SystemRoot
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    $environment = [System.Collections.Generic.Dictionary[string,string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $environment['PATH'] = $pathParts -join [System.IO.Path]::PathSeparator
    $environment['PATHEXT'] = '.COM;.EXE;.BAT;.CMD'
    $environment['SystemRoot'] = $env:SystemRoot
    $environment['WINDIR'] = $env:SystemRoot
    $environment['SystemDrive'] = $env:SystemDrive
    $environment['ComSpec'] = $env:ComSpec
    $environment['TEMP'] = $temp
    $environment['TMP'] = $temp
    $environment['APPDATA'] = $appData
    $environment['LOCALAPPDATA'] = $localAppData
    $environment['USERPROFILE'] = $userProfile
    $environment['HOME'] = $userProfile
    $environment['XDG_CACHE_HOME'] = Join-Path $cache 'xdg-cache'
    $environment['XDG_CONFIG_HOME'] = Join-Path $cache 'xdg-config'
    $environment['XDG_STATE_HOME'] = Join-Path $cache 'xdg-state'
    $environment['ELECTRON_BUILDER_CACHE'] = Join-Path $cache 'electron-builder'
    $environment['ELECTRON_CACHE'] = Join-Path $cache 'electron'
    $environment['electron_config_cache'] = Join-Path $cache 'electron'
    $environment['CSC_IDENTITY_AUTO_DISCOVERY'] = 'false'
    $environment['ELECTRON_SKIP_BINARY_DOWNLOAD'] = '1'
    $environment['npm_config_offline'] = 'true'
    $environment['NPM_CONFIG_OFFLINE'] = 'true'
    $environment['HTTP_PROXY'] = 'http://127.0.0.1:9'
    $environment['HTTPS_PROXY'] = 'http://127.0.0.1:9'
    $environment['ALL_PROXY'] = 'http://127.0.0.1:9'
    $environment['NO_PROXY'] = ''
    $environment['NODE_ENV'] = 'production'
    $environment['PYTHONDONTWRITEBYTECODE'] = '1'
    return $environment
}

function Write-ChildAudit {
    param([Parameter(Mandatory = $true)]$Record)
    if ($null -ne $script:ChildAuditPath) {
        $Record | ConvertTo-Json -Compress | Add-Content -LiteralPath $script:ChildAuditPath -Encoding utf8
    }
}

function Invoke-ScopedProcess {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][int]$TimeoutSeconds,
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$RunRoot
    )

    Assert-Within $RunRoot $WorkingDirectory 'child working directory' -AllowEqual
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $FilePath
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    foreach ($argument in $Arguments) {
        [void]$psi.ArgumentList.Add([string]$argument)
    }
    $psi.Environment.Clear()
    foreach ($entry in $script:Environment.GetEnumerator()) {
        $psi.Environment[$entry.Key] = $entry.Value
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $psi
    $requestedAt = [DateTimeOffset]::UtcNow
    $started = $process.Start()
    Assert-True $started "Failed to start child: $Label"
    $process.Refresh()
    $actualExe = '(unavailable)'
    $birth = $null
    try {
        $actualExe = $process.MainModule.FileName
        $birth = $process.StartTime.ToUniversalTime()
    }
    catch {
        $actualExe = $FilePath
    }
    $record = [pscustomobject]@{
        label = $Label
        pid = $process.Id
        requestedFile = $FilePath
        actualExe = $actualExe
        birthUtc = if ($null -eq $birth) { $null } else { $birth.ToString('o') }
        requestedAtUtc = $requestedAt.ToString('o')
        timeoutSeconds = $TimeoutSeconds
    }
    Write-ChildAudit $record

    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
        $process.Refresh()
        Assert-True ($null -ne $birth -and $process.StartTime.ToUniversalTime() -eq $birth) 'Timeout process identity changed.'
        Assert-True ([string]::Equals($process.MainModule.FileName, $actualExe, [System.StringComparison]::OrdinalIgnoreCase)) 'Timeout executable identity changed.'
        $process.Kill($true)
        $process.WaitForExit(15000) | Out-Null
        throw "$Label timed out after $TimeoutSeconds seconds (pid $($process.Id), exe $actualExe)"
    }

    $stdout = $stdoutTask.GetAwaiter().GetResult()
    $stderr = $stderrTask.GetAwaiter().GetResult()
    $logDirectory = Join-Path $RunRoot 'logs'
    [void][System.IO.Directory]::CreateDirectory($logDirectory)
    $safeLabel = $Label -replace '[^0-9A-Za-z._-]', '-'
    [System.IO.File]::WriteAllText((Join-Path $logDirectory "$safeLabel.stdout.log"), $stdout)
    [System.IO.File]::WriteAllText((Join-Path $logDirectory "$safeLabel.stderr.log"), $stderr)
    $record | Add-Member -NotePropertyName exitCode -NotePropertyValue $process.ExitCode
    $record | Add-Member -NotePropertyName finishedAtUtc -NotePropertyValue ([DateTimeOffset]::UtcNow.ToString('o'))
    Write-ChildAudit $record
    if ($process.ExitCode -ne 0) {
        throw "$Label failed with exit code $($process.ExitCode). See $logDirectory"
    }
    return [pscustomobject]@{
        ExitCode = $process.ExitCode
        StdOut = $stdout
        StdErr = $stderr
        Pid = $record.pid
        Exe = $actualExe
    }
}

function Assert-ConfigShape {
    param([Parameter(Mandatory = $true)]$Config)

    Assert-True ([int]$Config.schemaVersion -eq 2) 'Unexpected builder config schemaVersion.'
    Assert-True ([string]$Config.job -eq 'WindowsP1RootTarget-20261102-032101') 'Unexpected builder job.'
    Assert-True ([string]$Config.status -eq 'PREPARED_SOURCE_ONLY_NOT_EXECUTED') 'Unexpected source-only status.'
    Assert-True ([string]$Config.target.platform -eq 'win32') 'Target must be win32.'
    Assert-True ([string]$Config.target.arch -eq 'x64') 'Target must be x64.'
    Assert-True ([string]$Config.target.installer -eq 'nsis') 'Target installer must be nsis.'
    Assert-True (-not [bool]$Config.target.signed) 'Signing must be disabled.'
    Assert-True ([string]$Config.literalPins.contractsVersion -eq '1.7') 'B contracts version must be 1.7.'
    Assert-True ([string]$Config.literalPins.officeRuntimeVersion -eq '0.2.2') 'Office runtime version must be 0.2.2.'
    Assert-True ([int]$Config.literalPins.officeAssetCount -eq 21) 'Office asset count must be 21.'
    Assert-True ([int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.privateBuild -eq 300) 'Private build timeout must be 300s.'
    Assert-True ([int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.stageAndRepack -eq 180) 'Stage/repack timeout must be 180s.'
    Assert-True ([int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.nsis -eq 240) 'NSIS timeout must be 240s.'
    Assert-True ([bool]$Config.payloadPolicy.prefilterBeforeOpen) 'Payload bytes must be filtered before open.'
    Assert-True ([bool]$Config.payloadPolicy.refuseReparsePoints) 'Payload reparse points must be refused.'
    Assert-True (-not [bool]$Config.buildPolicy.gitWritesAllowed) 'Git writes must remain disabled.'
    Assert-True (-not [bool]$Config.buildPolicy.networkAllowed) 'Network must remain disabled.'
    Assert-True (-not [bool]$Config.buildPolicy.installerExecutionAllowed) 'Installer execution must remain disabled.'
    Assert-True (-not [bool]$Config.buildPolicy.npmInstallAllowed) 'npm install must remain disabled.'

    $nodeNames = @($Config.literalPins.nodeExecutable.PSObject.Properties.Name)
    Assert-True ($nodeNames -contains 'executable') 'NODE_PIN.executable is required by the original builder schema.'
    Assert-True (-not ($nodeNames -contains 'path')) 'Legacy NODE_PIN.path is not permitted.'

    $engine = @($Config.payloadTrees | Where-Object id -eq 'a-engines-safe')
    Assert-True ($engine.Count -eq 1) 'Exactly one safe engine payload pin is required.'
    Assert-True ([string]$engine[0].selector -eq 'engine-safe') 'Engine payload must use engine-safe.'
    Assert-True ([string]$engine[0].safeManifestStatus -eq 'ROOT_TO_PRODUCE_AFTER_SAFE_SELECTOR_REVIEW') 'Engine needs Root-approved safe manifest.'
    Assert-True ([bool]$engine[0].priorAllSelectorDigestRejected) 'The forbidden all-selector engine digest must be rejected.'

    foreach ($tree in $Config.privateBuildTrees) {
        Assert-True ([string]$tree.selector -eq 'all') "Private plugin build pin must use all: $($tree.id)"
        Assert-True (-not ([string]$tree.root).EndsWith('\engines', [System.StringComparison]::OrdinalIgnoreCase)) 'Engine tree must not enter private plugin build pins.'
        Assert-True (-not ([string]$tree.root).EndsWith('\service\lawbench', [System.StringComparison]::OrdinalIgnoreCase)) 'B service must not enter private plugin build pins.'
    }
}

function Assert-KnownPaths {
    param([Parameter(Mandatory = $true)]$Config)

    Assert-RegularFile $script:ConfigPath
    Assert-RegularFile $script:BuilderPath
    Assert-RegularFile $script:BuildConfigPath
    Assert-RegularFile ([string]$Config.literalPins.nodeExecutable.executable)
    Assert-RegularFile ([string]$Config.roots.aRoot + '\dsh-ext\scripts\contracts-source.mjs')
    Assert-RegularFile ([string]$Config.roots.coordRoot + '\T18-current-closure-state.json')
    Assert-RegularFile ([string]$Config.resourceChecks.officeAssetsIndex)
    Assert-RegularFile ([string]$Config.resourceChecks.officeWorker.path)
    Assert-RegularFile ([string]$Config.resourceChecks.officePackageJson.path)
    Assert-RegularFile ([string]$Config.resourceChecks.officePackageLock.path)
    Assert-Directory ([string]$Config.roots.installedBaselineRoot)
    Assert-Directory (Join-Path ([string]$Config.roots.installedBaselineRoot) 'resources\app.asar.unpacked\dsh')
    Assert-Directory (Join-Path ([string]$Config.roots.installedBaselineRoot) 'resources\runtime')
    Assert-Directory (Join-Path ([string]$Config.roots.installedBaselineRoot) 'python')
    foreach ($name in @('libreoffice', 'pandoc', 'splitter', 'convert')) {
        Assert-Directory (Join-Path ([string]$Config.roots.installedBaselineRoot) "tools\$name")
    }
    foreach ($tree in $Config.privateBuildTrees) {
        Assert-Directory ([string]$tree.root)
    }
    foreach ($tree in $Config.payloadTrees) {
        Assert-Directory ([string]$tree.root)
    }
    foreach ($pin in $Config.files) {
        Assert-PinnedFile $pin 'known source file' -MetadataOnly
    }
    foreach ($pin in $Config.baselineFiles) {
        Assert-PinnedFile $pin 'known baseline file' -MetadataOnly
    }
    foreach ($pin in $Config.assets) {
        Assert-PinnedFile $pin 'known packaging asset' -MetadataOnly
    }
}

function Assert-ImplementationMarkers {
    $builderText = [System.IO.File]::ReadAllText($script:BuilderPath)
    Assert-True ($builderText.Contains('CONTRACTS_SOURCE_DIR')) 'Private builder lacks B contracts directory binding.'
    Assert-True ($builderText.Contains('contracts.loadContracts(CONTRACTS_SOURCE_DIR)')) 'Private builder provenance does not bind B contracts.'
    Assert-True ($builderText.Contains('contracts.contractsModuleSource(CONTRACTS_SOURCE_DIR)')) 'Private builder embedding does not bind B contracts.'
    Assert-True ($builderText.Contains('samePath(dirname(runRoot), RUNS_ROOT)')) 'Private builder lacks fresh run-root output containment.'
    Assert-True ($builderText.Contains('dsh-ext/agent/index.ts')) 'Closure pin 1 label is missing.'
    Assert-True ($builderText.Contains('dsh-ext/agent/grounding-review.ts')) 'Closure pin 2 label is missing.'
    Assert-True ($builderText.Contains('native-grounding-review-20261102-000134.spec.ts')) 'Closure pin 3 label is missing.'
}

function Invoke-ValidateOnly {
    $Config = Get-Content -LiteralPath $script:ConfigPath -Raw | ConvertFrom-Json
    Assert-ConfigShape $Config
    Assert-KnownPaths $Config
    Assert-ImplementationMarkers

    foreach ($name in @('builder.config.json', 'build-config.mjs', 'build-private.mjs', 'build-windows-candidate.ps1')) {
        Assert-RegularFile (Join-Path $script:Root $name)
    }

    $contractsVersion = (Get-Content -LiteralPath (Join-Path ([string]$Config.roots.bRoot) 'contracts\VERSION') -Raw).Trim()
    Assert-True ($contractsVersion -eq '1.7') "B contracts VERSION changed: $contractsVersion"

    Write-Output 'VALIDATE_ONLY_PASS'
    Write-Output 'Known source/config/baseline/tool paths and literal schema are present.'
    Write-Output 'Forbidden workbook/CSV/DB parsing, hashing, copying, private build, asar, installer, app launch, HTTP, model, and Git writes were NOT executed.'
    Write-Output 'Payload exact-source manifests remain pending Root safe-selector review.'
}

function Read-ApprovedSourceManifest {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$EvidenceRoot
    )

    Assert-Within $EvidenceRoot $Path 'approved source manifest'
    Assert-RegularFile $Path
    $manifest = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    Assert-True ([int]$manifest.schemaVersion -eq 1) 'Approved source manifest schemaVersion must be 1.'
    Assert-True ([string]$manifest.job -eq 'WindowsP1RootTarget-20261102-032101') 'Approved source manifest job mismatch.'
    Assert-True ($null -ne $manifest.trees) 'Approved source manifest trees are missing.'
    $copy = Join-Path $RunRoot 'inputs\approved-source-manifest.json'
    [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($copy))
    [System.IO.File]::Copy($Path, $copy, $false)
    return $manifest
}

function Assert-PayloadManifests {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)]$ApprovedManifest
    )

    $approved = @{}
    foreach ($entry in $ApprovedManifest.trees) {
        $approved[[string]$entry.id] = $entry
    }
    $actualRows = [System.Collections.Generic.List[object]]::new()
    foreach ($tree in $Config.payloadTrees) {
        $id = [string]$tree.id
        $selector = [string]$tree.selector
        $actual = Get-SortedTreeManifest -SafeRoot ([string]$tree.root) -Selector $selector -Config $Config
        Assert-True $approved.ContainsKey($id) "Root-approved safe manifest lacks $id"
        $expected = $approved[$id]
        Assert-True ([int]$actual.files -eq [int]$expected.files) "Safe payload file count changed: $id"
        Assert-True ([long]$actual.bytes -eq [long]$expected.bytes) "Safe payload byte count changed: $id"
        Assert-True ([string]$actual.sha256 -ceq [string]$expected.sha256) "Safe payload digest changed: $id"
        $actualRows.Add([pscustomobject]@{
            id = $id
            root = [string]$tree.root
            selector = $selector
            files = [int]$actual.files
            bytes = [long]$actual.bytes
            sha256 = [string]$actual.sha256
        })
    }
    return @($actualRows.ToArray())
}

function Assert-RunRoot {
    param([Parameter(Mandatory = $true)]$Config)
    $runsRoot = [string]$Config.roots.runsRoot
    $runRoot = Join-Path $runsRoot $RunStamp
    Assert-Within $runsRoot $runRoot 'fresh run root'
    Assert-True (-not (Test-Path -LiteralPath $runRoot)) "Fresh run root required; already exists: $runRoot"
    [void][System.IO.Directory]::CreateDirectory($runRoot)
    Assert-NoReparsePath $runRoot
    return $runRoot
}

function Resolve-LocalTool {
    param([Parameter(Mandatory = $true)][string]$Name)
    $candidate = Join-Path $env:SystemRoot "System32\$Name"
    Assert-RegularFile $candidate
    return $candidate
}

function Extract-TarArchive {
    param(
        [Parameter(Mandatory = $true)][string]$Tar,
        [Parameter(Mandatory = $true)][string]$Archive,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$Label
    )
    Assert-Within $RunRoot $Destination 'tar destination'
    [void][System.IO.Directory]::CreateDirectory($Destination)
    $arguments = @(
        '-xzf', $Archive, '-C', $Destination,
        '--exclude=*.xlsx', '--exclude=*.xls', '--exclude=*.xlsm', '--exclude=*.xlsb',
        '--exclude=*.ods', '--exclude=*.csv', '--exclude=*.tsv', '--exclude=*.db',
        '--exclude=*.sqlite', '--exclude=*.sqlite3', '--exclude=*.log',
        '--exclude=*.doc', '--exclude=*.docx', '--exclude=*.pdf', '--exclude=*.rtf',
        '--exclude=*.key', '--exclude=*.pem', '--exclude=*.p12', '--exclude=*.pfx',
        '--exclude=*/.env', '--exclude=*/.env.*', '--exclude=*/tests/*', '--exclude=*/test/*',
        '--exclude=*/test-results/*', '--exclude=*/fixtures/*', '--exclude=*/docs/*',
        '--exclude=*/userdata/*', '--exclude=*/user-data/*', '--exclude=*/outputs/*',
        '--exclude=*/results/*'
    )
    [void](Invoke-ScopedProcess -FilePath $Tar -Arguments $arguments `
        -WorkingDirectory $RunRoot -TimeoutSeconds 60 -Label $Label -RunRoot $RunRoot)
}

function Expand-SevenArchiveIntoDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$SevenZip,
        [Parameter(Mandatory = $true)][string]$Archive,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$Label
    )

    $temp = Join-Path $RunRoot "cache\_seven-extract\$Label"
    [void][System.IO.Directory]::CreateDirectory($temp)
    [void](Invoke-ScopedProcess -FilePath $SevenZip `
        -Arguments @('x', '-y', "-o$temp", $Archive) `
        -WorkingDirectory $RunRoot -TimeoutSeconds 60 -Label $Label -RunRoot $RunRoot)
    $top = @(Get-ChildItem -LiteralPath $temp -Force)
    $source = $temp
    if ($top.Count -eq 1 -and $top[0].PSIsContainer) {
        $source = $top[0].FullName
    }
    [void](Copy-SafeTree -SafeRoot $source -Destination $Destination -Selector 'all-safe' -Config $Config -RunRoot $RunRoot)
    Remove-ScopedDirectory -Path $temp -RunRoot $RunRoot
}

function Prepare-ElectronBuilderCache {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$Tar
    )

    $cacheRoot = Join-Path $RunRoot 'cache\electron-builder'
    $sevenRoot = Join-Path $cacheRoot '_sevenzip'
    Extract-TarArchive -Tar $Tar -Archive ([string]$Config.assets[5].path) -Destination $sevenRoot `
        -RunRoot $RunRoot -Label 'extract-local-7zip'
    $sevenZip = Get-ChildItem -LiteralPath $sevenRoot -Recurse -File -Filter '7za.exe' | Select-Object -First 1
    Assert-True ($null -ne $sevenZip) 'Pinned local 7za.exe was not found after extraction.'

    $nsisRoot = Join-Path $cacheRoot 'nsis\nsis-3.0.4.1'
    $nsisResourcesRoot = Join-Path $cacheRoot 'nsis\nsis-resources-3.4.1'
    $signRoot = Join-Path $cacheRoot 'winCodeSign\winCodeSign-2.6.0'
    [void][System.IO.Directory]::CreateDirectory($nsisRoot)
    [void][System.IO.Directory]::CreateDirectory($nsisResourcesRoot)
    [void][System.IO.Directory]::CreateDirectory($signRoot)

    Expand-SevenArchiveIntoDirectory -SevenZip $sevenZip.FullName -Archive ([string]$Config.assets[2].path) `
        -Destination $nsisRoot -RunRoot $RunRoot -Config $Config -Label 'extract-local-nsis'
    Expand-SevenArchiveIntoDirectory -SevenZip $sevenZip.FullName -Archive ([string]$Config.assets[3].path) `
        -Destination $nsisResourcesRoot -RunRoot $RunRoot -Config $Config -Label 'extract-local-nsis-resources'
    Expand-SevenArchiveIntoDirectory -SevenZip $sevenZip.FullName -Archive ([string]$Config.assets[4].path) `
        -Destination $signRoot -RunRoot $RunRoot -Config $Config -Label 'extract-local-wincodesign'
    $iconsRoot = Join-Path $cacheRoot 'icons'
    Extract-TarArchive -Tar $Tar -Archive ([string]$Config.assets[6].path) -Destination $iconsRoot -RunRoot $RunRoot -Label 'extract-local-icons'
    $script:Environment['ELECTRON_BUILDER_NSIS_DIR'] = $nsisRoot
    $script:Environment['ELECTRON_BUILDER_NSIS_RESOURCES_DIR'] = $nsisResourcesRoot
    $script:Environment['ELECTRON_BUILDER_7ZIP_PATH'] = $sevenZip.FullName
    $script:Environment['ELECTRON_BUILDER_RCEDIT_PATH'] = $signRoot
    $script:Environment['ELECTRON_BUILDER_ICONS_TOOLSET_DIR'] = Join-Path $iconsRoot 'icons-bundle'
    return $cacheRoot
}

function Stage-BaselineShell {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot
    )

    $stageApp = Join-Path $RunRoot 'stage\app'
    [void][System.IO.Directory]::CreateDirectory($stageApp)
    foreach ($pin in $Config.baselineFiles) {
        $source = [string]$pin.path
        Assert-PinnedFile $pin 'selected baseline file'
        $relative = [System.IO.Path]::GetRelativePath([string]$Config.roots.installedBaselineRoot, $source)
        $destination = Join-Path $stageApp $relative
        Assert-Within $RunRoot $destination 'baseline file destination'
        [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination))
        [System.IO.File]::Copy($source, $destination, $false)
    }
    foreach ($directory in @('locales', 'python', 'tools\libreoffice', 'tools\pandoc', 'tools\splitter', 'tools\convert', 'resources\runtime', 'resources\app.asar.unpacked\dsh')) {
        $source = Join-Path ([string]$Config.roots.installedBaselineRoot) $directory
        $destination = Join-Path $stageApp $directory
        [void](Copy-SafeTree -SafeRoot $source -Destination $destination -Selector 'all-safe' -Config $Config -RunRoot $RunRoot)
    }
    return $stageApp
}

function Build-PrivatePlugin {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot
    )

    $node = [string]$Config.literalPins.nodeExecutable.executable
    $privateOutput = Join-Path $RunRoot "private-output-$RunStamp"
    $result = Invoke-ScopedProcess -FilePath $node `
        -Arguments @($script:BuilderPath, '--out', $privateOutput, '--stamp', $RunStamp) `
        -WorkingDirectory $RunRoot `
        -TimeoutSeconds ([int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.privateBuild) `
        -Label 'private-plugin-build' -RunRoot $RunRoot
    $manifestPath = Join-Path $privateOutput 'manifest.json'
    Assert-RegularFile $manifestPath
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    Assert-True ([string]$manifest.status -eq 'SOURCE_BUILT_RUNTIME_NOT_EXERCISED') 'Private builder did not produce the source-built status.'
    Assert-True ([string]$manifest.contractsProvenance.version -eq '1.7') 'Private output did not embed B contracts 1.7.'
    Assert-True (-not [bool]$manifest.claims.appLaunchExecuted) 'Private builder unexpectedly launched the app.'
    Assert-True (-not [bool]$manifest.claims.installerExecuted) 'Private builder unexpectedly executed an installer.'
    return [pscustomobject]@{
        Path = $privateOutput
        Manifest = $manifest
        Stdout = $result.StdOut
    }
}

function Stage-PayloadTrees {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$StageApp
    )

    $destinations = @{
        'b-service-safe' = Join-Path $StageApp 'service\lawbench'
        'b-contracts-safe' = Join-Path $StageApp 'contracts'
        'b-skills-approved' = Join-Path $StageApp 'skills'
        'a-engines-safe' = Join-Path $StageApp 'engines'
    }
    $counts = @{}
    foreach ($tree in $Config.payloadTrees) {
        $id = [string]$tree.id
        Assert-True $destinations.ContainsKey($id) "Unexpected payload tree: $id"
        $counts[$id] = Copy-SafeTree -SafeRoot ([string]$tree.root) -Destination $destinations[$id] `
            -Selector ([string]$tree.selector) -Config $Config -RunRoot $RunRoot
    }
    return $counts
}

function Stage-OfficeRuntime {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$StageApp,
        [Parameter(Mandatory = $true)][string]$Tar
    )

    $index = Get-Content -LiteralPath ([string]$Config.resourceChecks.officeAssetsIndex) -Raw | ConvertFrom-Json
    Assert-True (@($index).Count -eq 21) 'office-assets-index.json must contain exactly 21 packages.'
    $officeStage = Join-Path $StageApp 'office-runtime'
    $modulesStage = Join-Path $officeStage 'node_modules'
    [void][System.IO.Directory]::CreateDirectory($modulesStage)
    foreach ($pin in @($Config.resourceChecks.officeWorker, $Config.resourceChecks.officePackageJson, $Config.resourceChecks.officePackageLock)) {
        Assert-PinnedFile $pin 'office source manifest/worker'
        $destination = Join-Path $officeStage ([System.IO.Path]::GetFileName([string]$pin.path))
        [System.IO.File]::Copy([string]$pin.path, $destination, $false)
    }

    $extractRoot = Join-Path $RunRoot 'office-extract'
    [void][System.IO.Directory]::CreateDirectory($extractRoot)
    $packageCount = 0
    foreach ($entry in @($index)) {
        Assert-True ([bool]$entry.accepted) "Office package was not accepted: $($entry.key)"
        $lock = Get-Content -LiteralPath ([string]$Config.resourceChecks.officePackageLock.path) -Raw | ConvertFrom-Json
        $lockEntry = $lock.packages.PSObject.Properties[[string]$entry.key].Value
        Assert-True ($null -ne $lockEntry -and [string]$entry.version -ceq [string]$lockEntry.version -and [string]$entry.integrity -ceq [string]$lockEntry.integrity) "Office package lock mismatch: $($entry.key)"
        $archive = [string]$entry.path
        Assert-Within ([string]$Config.roots.resourceRoot) $archive 'office tarball source'
        Assert-RegularFile $archive
        Assert-True ((Get-Item -LiteralPath $archive).Length -eq [long]$entry.bytes) "Office tarball size mismatch: $archive"
        Assert-True ((Get-Sha256 $archive) -ceq [string]$entry.sha256) "Office tarball hash mismatch: $archive"

        $key = [string]$entry.key
        $prefix = 'node_modules/'
        Assert-True $key.StartsWith($prefix, [System.StringComparison]::Ordinal) "Unexpected Office package key: $key"
        $relativePackage = $key.Substring($prefix.Length)
        $extractName = 'pkg-{0:D2}' -f $packageCount
        $oneExtract = Join-Path $extractRoot $extractName
        Extract-TarArchive -Tar $Tar -Archive $archive -Destination $oneExtract -RunRoot $RunRoot `
            -Label ("extract-office-{0:D2}" -f $packageCount)
        $packageDir = Join-Path $oneExtract 'package'
        $packageJson = Join-Path $packageDir 'package.json'
        Assert-RegularFile $packageJson
        $manifest = Get-Content -LiteralPath $packageJson -Raw | ConvertFrom-Json
        Assert-True ([string]$manifest.name -eq $relativePackage) "Extracted Office package name mismatch: $relativePackage"
        Assert-True ([string]$manifest.version -ceq [string]$entry.version) "Extracted Office package version mismatch: $relativePackage"
        $destination = Join-Path $modulesStage $relativePackage.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        [void](Copy-SafeTree -SafeRoot $packageDir -Destination $destination -Selector 'all-safe' -Config $Config -RunRoot $RunRoot)
        $packageCount += 1
    }
    Assert-True ($packageCount -eq 21) 'Not all 21 Office packages were staged.'
    Assert-RegularFile (Join-Path $modulesStage '@deepseek-ai\libreoffice-kit\package.json')
    Assert-RegularFile (Join-Path $modulesStage '@deepseek-ai\libreoffice-kit-win32-x64\package.json')
    Assert-RegularFile (Join-Path $modulesStage '@deepseek-ai\libreoffice-kit-win32-x64\bin\dsoffice.exe')
    return $packageCount
}

function Stage-PrivateAsar {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$StageApp,
        [Parameter(Mandatory = $true)][string]$PrivateOutput,
        [Parameter(Mandatory = $true)][string]$Node,
        [Parameter(Mandatory = $true)][string]$AsarCli
    )

    $extract = Join-Path $RunRoot 'asar-extract'
    $baselineAsar = Join-Path ([string]$Config.roots.installedBaselineRoot) 'resources\app.asar'
    [void][System.IO.Directory]::CreateDirectory($extract)
    [void](Invoke-ScopedProcess -FilePath $Node -Arguments @($AsarCli, 'extract', $baselineAsar, $extract) `
        -WorkingDirectory $RunRoot -TimeoutSeconds 90 -Label 'asar-extract-baseline' -RunRoot $RunRoot)

    $replacements = @(
        @{ id = 'lawbench-dsh'; source = 'lawbench-dsh'; destination = 'lawbench-dsh' },
        @{ id = '@deepseek-ai/dsh-client-ui-conversation'; source = '@deepseek-ai\dsh-client-ui-conversation'; destination = '@deepseek-ai\dsh-client-ui-conversation' },
        @{ id = '@deepseek-ai/dsh-api-session-controller'; source = '@deepseek-ai\dsh-api-session-controller'; destination = '@deepseek-ai\dsh-api-session-controller' }
    )
    $privatePackages = Join-Path $PrivateOutput 'profile-node_modules'
    foreach ($replacement in $replacements) {
        $source = Join-Path $privatePackages $replacement.source
        $destination = Join-Path (Join-Path $extract 'dsh\node_modules') $replacement.destination
        Assert-Directory $source
        Remove-ScopedDirectory -Path $destination -RunRoot $RunRoot
        [void](Copy-SafeTree -SafeRoot $source -Destination $destination -Selector 'all-safe' -Config $Config -RunRoot $RunRoot)
    }

    $replacementRoot = Join-Path $StageApp 'resources\app.asar'
    [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($replacementRoot))
    if (Test-Path -LiteralPath $replacementRoot) {
        Remove-ScopedDirectory -Path $replacementRoot -RunRoot $RunRoot
    }
    [void](Invoke-ScopedProcess -FilePath $Node -Arguments @($AsarCli, 'pack', $extract, $replacementRoot) `
        -WorkingDirectory $RunRoot -TimeoutSeconds 90 -Label 'asar-pack-private' -RunRoot $RunRoot)
    Assert-RegularFile $replacementRoot
    return [pscustomobject]@{
        path = $replacementRoot
        bytes = (Get-Item -LiteralPath $replacementRoot).Length
        sha256 = (Get-Sha256 $replacementRoot)
        replaced = @('lawbench-dsh', '@deepseek-ai/dsh-client-ui-conversation', '@deepseek-ai/dsh-api-session-controller')
    }
}

function Write-ElectronBuilderConfig {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$StageApp
    )

    $output = Join-Path $RunRoot 'out'
    [void][System.IO.Directory]::CreateDirectory($output)
    $builderConfigPath = Join-Path $RunRoot 'electron-builder-private-acceptance.json'
    $builderConfig = [ordered]@{
        appId = 'cn.lianyue.lawbench.private.acceptance.p1repair1'
        productName = '连越律师工作台 P1验收候选'
        artifactName = 'LawBench-PRIVATE-ACCEPTANCE-CANDIDATE-${version}-win-x64.${ext}'
        extraMetadata = [ordered]@{
            name = 'lawbench-private-acceptance-p1repair1'
            version = '0.1.0'
            description = 'PRIVATE ACCEPTANCE CANDIDATE - NOT A PUBLISHED RELEASE'
        }
        directories = [ordered]@{ output = $output }
        asar = $true
        publish = $null
        win = [ordered]@{
            executableName = '连越律师工作台'
            target = @('nsis')
            forceCodeSigning = $false
            icon = (Join-Path $StageApp 'resources\icon.png')
        }
        nsis = [ordered]@{
            oneClick = $false
            perMachine = $false
            allowElevation = $false
            allowToChangeInstallationDirectory = $false
            createDesktopShortcut = $true
            createStartMenuShortcut = $true
            runAfterFinish = $false
            deleteAppDataOnUninstall = $false
            differentialPackage = $false
            guid = '8f58ac85-527d-4c7c-97be-8f4c8d84aa17'
            shortcutName = '连越律师工作台 P1验收候选'
        }
    }
    $projectMetadata = [ordered]@{ name='lawbench-private-acceptance-p1repair1'; version='0.1.0'; description='PRIVATE ACCEPTANCE CANDIDATE'; author='LawBench'; main='index.js' }
    [System.IO.File]::WriteAllText((Join-Path $RunRoot 'package.json'), ($projectMetadata | ConvertTo-Json) + "`n", [System.Text.UTF8Encoding]::new($false))
    $json = $builderConfig | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($builderConfigPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
    return $builderConfigPath
}

function Invoke-PrivateNsis {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$RunRoot,
        [Parameter(Mandatory = $true)][string]$StageApp,
        [Parameter(Mandatory = $true)][string]$Node,
        [Parameter(Mandatory = $true)][string]$BuilderCli,
        [Parameter(Mandatory = $true)][string]$BuilderConfig
    )

    [void](Invoke-ScopedProcess -FilePath $Node `
        -Arguments @($BuilderCli, '--prepackaged', $StageApp, '--win', 'nsis', '--x64', '--publish', 'never', '--config', $BuilderConfig) `
        -WorkingDirectory $RunRoot `
        -TimeoutSeconds ([int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.nsis) `
        -Label 'private-nsis-build' -RunRoot $RunRoot)

    $artifacts = @(Get-ChildItem -LiteralPath (Join-Path $RunRoot 'out') -File -Filter '*.exe')
    Assert-True ($artifacts.Count -eq 1) "Expected exactly one private NSIS artifact, found $($artifacts.Count)."
    return [pscustomobject]@{
        path = $artifacts[0].FullName
        bytes = $artifacts[0].Length
        sha256 = Get-Sha256 $artifacts[0].FullName
    }
}

function Invoke-Run {
    param([Parameter(Mandatory = $true)][string]$ApprovedManifestPath)

    $Config = Get-Content -LiteralPath $script:ConfigPath -Raw | ConvertFrom-Json
    Assert-ConfigShape $Config
    Assert-KnownPaths $Config
    Assert-ImplementationMarkers
    $script:Config = $Config

    $script:RunRoot = Assert-RunRoot $Config
    $script:ChildAuditPath = Join-Path $script:RunRoot 'child-processes.jsonl'
    $script:Environment = Get-CleanProcessEnvironment $script:RunRoot
    $stageTimer = [System.Diagnostics.Stopwatch]::new()
    $stageDeadline = [int]$Config.buildPolicy.finiteCommandTimeoutsSeconds.stageAndRepack

    $approved = Read-ApprovedSourceManifest -Path $ApprovedManifestPath -RunRoot $script:RunRoot `
        -EvidenceRoot ([string]$Config.roots.evidenceRoot)
    $safePayloadPins = Assert-PayloadManifests -Config $Config -ApprovedManifest $approved

    foreach ($pin in $Config.closureState.pins) {
        Assert-PinnedFile $pin 'T18 closure pin'
    }
    foreach ($pin in $Config.files) {
        Assert-PinnedFile $pin 'private build source file'
    }
    foreach ($pin in $Config.baselineFiles) {
        Assert-PinnedFile $pin 'baseline static file'
    }
    foreach ($pin in $Config.assets) {
        Assert-PinnedFile $pin 'packaging asset'
    }
    foreach ($pin in $Config.resourceChecks.installedTools) {
        Assert-PinnedFile $pin 'installed tool binary'
    }

    $private = Build-PrivatePlugin -Config $Config -RunRoot $script:RunRoot
    $stageTimer.Start()
    $tar = Resolve-LocalTool 'tar.exe'
    [void](Prepare-ElectronBuilderCache -Config $Config -RunRoot $script:RunRoot -Tar $tar)
    $stageApp = Stage-BaselineShell -Config $Config -RunRoot $script:RunRoot
    $payloadCounts = Stage-PayloadTrees -Config $Config -RunRoot $script:RunRoot -StageApp $stageApp
    $officeCount = Stage-OfficeRuntime -Config $Config -RunRoot $script:RunRoot -StageApp $stageApp -Tar $tar

    $node = [string]$Config.literalPins.nodeExecutable.executable
    $asarCli = Join-Path ([string]$Config.roots.aRoot) 'dsh\node_modules\.pnpm\@electron+asar@3.4.1\node_modules\@electron\asar\bin\asar.js'
    $builderCli = Join-Path ([string]$Config.roots.aRoot) 'dsh\apps\desktop\node_modules\electron-builder\out\cli\cli.js'
    Assert-RegularFile $asarCli
    Assert-RegularFile $builderCli
    $asar = Stage-PrivateAsar -Config $Config -RunRoot $script:RunRoot -StageApp $stageApp `
        -PrivateOutput $private.Path -Node $node -AsarCli $asarCli

    $stageTimer.Stop()
    Assert-True ($stageTimer.Elapsed.TotalSeconds -le $stageDeadline) `
        "Stage/repack exceeded $stageDeadline seconds: $($stageTimer.Elapsed.TotalSeconds)"

    $builderConfig = Write-ElectronBuilderConfig -Config $Config -RunRoot $script:RunRoot -StageApp $stageApp
    $artifact = Invoke-PrivateNsis -Config $Config -RunRoot $script:RunRoot -StageApp $stageApp `
        -Node $node -BuilderCli $builderCli -BuilderConfig $builderConfig

    $privateManifestPath = Join-Path $private.Path 'manifest.json'
    $privateManifest = Get-Content -LiteralPath $privateManifestPath -Raw | ConvertFrom-Json
    $result = [ordered]@{
        format = 'WindowsPackageP1Repair1-candidate-v1'
        job = 'WindowsP1RootTarget-20261102-032101'
        generatedAt = [DateTimeOffset]::UtcNow.ToString('o')
        status = 'PRIVATE_ACCEPTANCE_CANDIDATE_BUILT_NOT_INSTALLED_NOT_PUBLISHED'
        label = 'PRIVATE ACCEPTANCE CANDIDATE - NOT A PUBLISHED RELEASE'
        runRoot = $script:RunRoot
        runStamp = $RunStamp
        target = [ordered]@{ platform = 'win32'; arch = 'x64'; installer = 'nsis'; signed = $false }
        baseline = [ordered]@{
            kind = 'declared read-only installed Electron 44 static shell/runtime and static tools baseline'
            notClaimedCurrentShellRebuild = $true
            installedRoot = [string]$Config.roots.installedBaselineRoot
        }
        source = [ordered]@{
            contractsVersion = '1.7'
            closureThree = @(
                'dsh-ext/agent/index.ts',
                'dsh-ext/agent/grounding-review.ts',
                'dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts'
            )
            safePayloadPins = $safePayloadPins
            privateBuildPins = @($Config.privateBuildTrees)
        }
        stage = [ordered]@{
            safePayloadFileCounts = $payloadCounts
            officePackageCount = $officeCount
            appAsar = $asar
            stageApp = $stageApp
        }
        privateBuildManifest = $privateManifestPath
        privateBuildManifestSha256 = Get-Sha256 $privateManifestPath
        artifact = $artifact
        workerGap = [ordered]@{
            item = 'invoice master/template configuration'
            disposition = 'deployment/P5 gap'
            workbookReadHashedCopiedOrReplaced = $false
            wholePackagingBlocker = $false
        }
        claims = [ordered]@{
            candidateBuilt = $true
            installerExecuted = $false
            appLaunched = $false
            cleanDirectoryInstallTested = $false
            serviceStarted = $false
            caseCreated = $false
            materialImported = $false
            invoicePageTested = $false
            delegationPageTested = $false
            archiveRun = $false
            fullTestsRun = $false
            published = $false
            allP1AcceptancePass = $false
        }
    }
    $manifestPath = Join-Path $script:RunRoot 'private-acceptance-candidate-manifest.json'
    [System.IO.File]::WriteAllText(
        $manifestPath,
        ($result | ConvertTo-Json -Depth 16) + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Output 'PRIVATE_ACCEPTANCE_CANDIDATE_BUILT'
    Write-Output "Artifact: $($artifact.path)"
    Write-Output "Manifest: $manifestPath"
    Write-Output 'NOT INSTALLED, NOT LAUNCHED, NOT TESTED FOR P1 ACCEPTANCE, NOT PUBLISHED.'
}

try {
    if ($PSCmdlet.ParameterSetName -eq 'ValidateOnly') {
        Invoke-ValidateOnly
    }
    elseif ($PSCmdlet.ParameterSetName -eq 'ManifestOnly') {
        $Config = Get-Content -LiteralPath $script:ConfigPath -Raw | ConvertFrom-Json
        Assert-ConfigShape $Config
        $trees = foreach ($tree in $Config.payloadTrees) {
            $m = Get-SortedTreeManifest -SafeRoot ([string]$tree.root) -Selector ([string]$tree.selector) -Config $Config
            [ordered]@{ id=$tree.id; files=$m.files; bytes=$m.bytes; sha256=$m.sha256 }
        }
        $manifest = [ordered]@{ schemaVersion=1; job=$Config.job; trees=@($trees) }
        $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $script:Root 'approved-source-manifest.json') -Encoding utf8
        Write-Output 'SAFE_SOURCE_MANIFEST_WRITTEN_NO_BUILD'
    }
    else {
        Invoke-Run -ApprovedManifestPath $ApprovedSourceManifestPath
    }
}
catch {
    Write-Error ("Repair1 packaging gate refused/failed: " + $_.Exception.Message)
    exit 1
}
