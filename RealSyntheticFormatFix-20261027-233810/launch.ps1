#requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Parent,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$ConsumerSha256
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$WindowTitle = 'Lawbench Synthetic Test - Private Key Input'
$ConsumerPath = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\consumer.py'
$PythonPath = 'C:/Users/morel/AppData/Local/Programs/Python/Python312/python.exe'
$PhaseNames = [string[]]@('ocr', 'refine', 'cancel')
$MaximumKeyCharacters = 4096
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$AllowedRunBase = [System.IO.Path]::GetFullPath(
    [System.IO.Path]::Combine($PSScriptRoot, 'runs')
)
$AllowedRunPrefix = $AllowedRunBase.TrimEnd([char[]]@('\', '/')) +
    [System.IO.Path]::DirectorySeparatorChar

$runStartedAtUtc = [DateTime]::UtcNow.ToString('o')
$summaryPath = $null
$summaryReady = $false
$secureKey = $null
$keyBstr = [IntPtr]::Zero
$plainKey = $null
$keyEntryAccepted = $false
$overallExitCode = 2
$overallStatus = 'SETUP_FAILED'
$currentFailureCode = 'SETUP_FAILED'
$phaseRecords = [System.Collections.Generic.List[object]]::new()

function Set-LauncherFailure {
    param([Parameter(Mandatory = $true)][string]$Code)

    $script:currentFailureCode = $Code
    throw [System.InvalidOperationException]::new($Code)
}

function Test-ReparsePoint {
    param([Parameter(Mandatory = $true)][System.IO.FileSystemInfo]$Item)

    return (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

function Assert-OrdinaryFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$FailureCode
    )

    $item = [System.IO.FileInfo]::new($Path)
    if (-not $item.Exists) {
        Set-LauncherFailure -Code $FailureCode
    }
    $isDirectory = (($item.Attributes -band [System.IO.FileAttributes]::Directory) -ne 0)
    if ($isDirectory -or (Test-ReparsePoint -Item $item)) {
        Set-LauncherFailure -Code $FailureCode
    }
}

function Assert-OrdinaryDirectoryChain {
    param([Parameter(Mandatory = $true)][string]$Path)

    $cursor = [System.IO.DirectoryInfo]::new($Path)
    while ($null -ne $cursor) {
        if ($cursor.Exists) {
            $isDirectory = (($cursor.Attributes -band [System.IO.FileAttributes]::Directory) -ne 0)
            if (-not $isDirectory -or (Test-ReparsePoint -Item $cursor)) {
                Set-LauncherFailure -Code 'PARENT_CHAIN_NOT_ORDINARY'
            }
        }
        elseif ([System.IO.File]::Exists($cursor.FullName)) {
            Set-LauncherFailure -Code 'PARENT_CHAIN_NOT_ORDINARY'
        }
        $cursor = $cursor.Parent
    }
}

function Test-DirectoryEmpty {
    param([Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$Directory)

    foreach ($ignored in $Directory.EnumerateFileSystemInfos()) {
        return $false
    }
    return $true
}

function Remove-CurrentSecret {
    param(
        [AllowNull()][string]$Text,
        [Parameter(Mandatory = $true)][string]$CurrentSecret
    )

    if ($null -eq $Text) {
        return ''
    }
    return $Text.Replace($CurrentSecret, '[REDACTED]', [System.StringComparison]::Ordinal)
}

function Write-NewTextFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [AllowEmptyString()][Parameter(Mandatory = $true)][string]$Text
    )

    if ([System.IO.File]::Exists($Path) -or [System.IO.Directory]::Exists($Path)) {
        Set-LauncherFailure -Code 'OUTPUT_PATH_ALREADY_EXISTS'
    }
    [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function New-NullProcessMetadata {
    return [pscustomobject][ordered]@{
        pid = $null
        executable_path = $null
        started_at_utc = $null
        finished_at_utc = $null
        natural_exit = $false
        start_error_type = $null
        stdin_error_type = $null
        stdout_error_type = $null
        stderr_error_type = $null
    }
}

function New-PhaseRecord {
    param([Parameter(Mandatory = $true)][string]$Phase)

    $processMetadata = New-NullProcessMetadata
    return [pscustomobject][ordered]@{
        phase = $Phase
        status = 'PENDING'
        exit_code = $null
        stdout_artifact = ('{0}.stdout.txt' -f $Phase)
        stderr_artifact = ('{0}.stderr.txt' -f $Phase)
        process = $processMetadata
    }
}

function Set-PendingPhasesNotRun {
    param([Parameter(Mandatory = $true)][string]$Status)

    foreach ($record in $phaseRecords) {
        if ($record.status -eq 'PENDING') {
            $record.status = $Status
        }
    }
}

function Write-LaunchSummary {
    if (-not $summaryReady -or $null -eq $summaryPath) {
        return
    }
    if ([System.IO.File]::Exists($summaryPath) -or [System.IO.Directory]::Exists($summaryPath)) {
        [Console]::Error.WriteLine('LAUNCH_SUMMARY_NOT_WRITTEN: output path already exists')
        return
    }

    $summary = [ordered]@{
        schema = 'lawbench-real-synthetic-secure-input-launch/1'
        status = $overallStatus
        exit_code = $overallExitCode
        started_at_utc = $runStartedAtUtc
        finished_at_utc = [DateTime]::UtcNow.ToString('o')
        credential_source = 'user_secure_console_stdin'
        redaction_enabled = $true
        phases = @($phaseRecords)
    }
    try {
        $json = $summary | ConvertTo-Json -Depth 8
        [System.IO.File]::WriteAllText($summaryPath, $json + [Environment]::NewLine, $Utf8NoBom)
    }
    catch {
        [Console]::Error.WriteLine(
            'LAUNCH_SUMMARY_NOT_WRITTEN: {0}' -f $_.Exception.GetType().FullName
        )
    }
}

foreach ($phase in $PhaseNames) {
    $phaseRecords.Add((New-PhaseRecord -Phase $phase))
}

try {
    if (-not [System.IO.Path]::IsPathFullyQualified($Parent)) {
        Set-LauncherFailure -Code 'PARENT_NOT_ABSOLUTE'
    }
    $parentFull = [System.IO.Path]::GetFullPath($Parent)
    if (-not $parentFull.StartsWith($AllowedRunPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        Set-LauncherFailure -Code 'PARENT_OUTSIDE_OWNED_RUN_BASE'
    }

    Assert-OrdinaryDirectoryChain -Path $parentFull
    $parentDirectory = [System.IO.DirectoryInfo]::new($parentFull)
    if ($parentDirectory.Exists) {
        if (Test-ReparsePoint -Item $parentDirectory) {
            Set-LauncherFailure -Code 'PARENT_NOT_ORDINARY'
        }
        if (-not (Test-DirectoryEmpty -Directory $parentDirectory)) {
            Set-LauncherFailure -Code 'PARENT_NOT_EMPTY'
        }
    }

    Assert-OrdinaryFile -Path $ConsumerPath -FailureCode 'CONSUMER_NOT_ORDINARY_FILE'
    Assert-OrdinaryFile -Path $PythonPath -FailureCode 'PYTHON_NOT_ORDINARY_FILE'

    if ($ConsumerSha256 -cnotmatch '^[0-9a-fA-F]{64}$') {
        Set-LauncherFailure -Code 'CONSUMER_SHA256_NOT_64_HEX'
    }
    $consumerHash = (Get-FileHash -LiteralPath $ConsumerPath -Algorithm SHA256).Hash
    if (-not [string]::Equals(
            $consumerHash,
            $ConsumerSha256,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        Set-LauncherFailure -Code 'CONSUMER_SHA256_MISMATCH'
    }

    foreach ($phase in $PhaseNames) {
        $phaseRoot = [System.IO.Path]::Combine($parentFull, $phase)
        if ([System.IO.File]::Exists($phaseRoot) -or [System.IO.Directory]::Exists($phaseRoot)) {
            Set-LauncherFailure -Code 'PHASE_ROOT_NOT_FRESH'
        }
    }

    $createdParent = [System.IO.Directory]::CreateDirectory($parentFull)
    if (-not $createdParent.Exists -or (Test-ReparsePoint -Item $createdParent)) {
        Set-LauncherFailure -Code 'PARENT_CREATE_FAILED'
    }
    if (-not (Test-DirectoryEmpty -Directory $createdParent)) {
        Set-LauncherFailure -Code 'PARENT_BECAME_NONEMPTY'
    }

    $summaryPath = [System.IO.Path]::Combine($parentFull, 'launch-summary.json')
    $summaryReady = $true

    try {
        [Console]::Title = $WindowTitle
    }
    catch {
        Set-LauncherFailure -Code 'CONSOLE_TITLE_FAILED'
    }

    $secureKey = Read-Host -Prompt 'BUSINESS TEST KEY ONLY: ' -AsSecureString
    $keyBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $plainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyBstr)

    if ([string]::IsNullOrWhiteSpace($plainKey)) {
        Set-LauncherFailure -Code 'KEY_EMPTY'
    }
    if ($plainKey.Length -gt $MaximumKeyCharacters) {
        Set-LauncherFailure -Code 'KEY_TOO_LONG'
    }
    foreach ($character in $plainKey.ToCharArray()) {
        $codePoint = [int]$character
        if ($codePoint -lt 0x20 -or $codePoint -gt 0x7e) {
            Set-LauncherFailure -Code 'KEY_NOT_PRINTABLE_ASCII'
        }
    }

    $keyEntryAccepted = $true
    [Console]::WriteLine('Key entry accepted from secure console input; authentication is not yet claimed.')

    $phaseIndex = 0
    $stopAfterPhase = $false
    $firstFailureExitCode = $null
    $overallStatus = 'COMPLETED_ALL_EXIT_0'

    while ($phaseIndex -lt $PhaseNames.Count) {
        $phase = $PhaseNames[$phaseIndex]
        $record = $phaseRecords[$phaseIndex]
        $phaseRoot = [System.IO.Path]::Combine($parentFull, $phase)

        if ([System.IO.File]::Exists($phaseRoot) -or [System.IO.Directory]::Exists($phaseRoot)) {
            $record.status = 'PHASE_ROOT_NOT_FRESH'
            Set-LauncherFailure -Code 'PHASE_ROOT_NOT_FRESH'
        }

        $processInfo = [System.Diagnostics.ProcessStartInfo]::new()
        $processInfo.FileName = $PythonPath
        $processInfo.ArgumentList.Add('-B')
        $processInfo.ArgumentList.Add('-X')
        $processInfo.ArgumentList.Add('utf8')
        $processInfo.ArgumentList.Add($ConsumerPath)
        $processInfo.ArgumentList.Add('--parent')
        $processInfo.ArgumentList.Add($phaseRoot)
        $processInfo.ArgumentList.Add('--phase')
        $processInfo.ArgumentList.Add($phase)
        $processInfo.ArgumentList.Add('--key-stdin')
        $processInfo.WorkingDirectory = $parentFull
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        $processInfo.RedirectStandardInput = $true
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.StandardInputEncoding = $Utf8NoBom
        $processInfo.StandardOutputEncoding = $Utf8NoBom
        $processInfo.StandardErrorEncoding = $Utf8NoBom

        $process = $null
        try {
            $process = [System.Diagnostics.Process]::Start($processInfo)
        }
        catch {
            $record.status = 'LAUNCH_FAILED'
            $record.process.start_error_type = $_.Exception.GetType().FullName
            Set-LauncherFailure -Code 'CHILD_START_FAILED'
        }

        $record.process.pid = [int]$process.Id
        try {
            $record.process.executable_path = $process.MainModule.FileName
        }
        catch {
            $record.process.executable_path = $null
        }
        try {
            $record.process.started_at_utc = $process.StartTime.ToUniversalTime().ToString('o')
        }
        catch {
            $record.process.started_at_utc = $null
        }

        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()

        [Console]::WriteLine(
            'PHASE {0}: process started; pid={1}' -f $phase, $record.process.pid
        )

        try {
            $process.StandardInput.WriteLine($plainKey)
            $process.StandardInput.Close()
        }
        catch {
            $record.process.stdin_error_type = $_.Exception.GetType().FullName
            try {
                $process.StandardInput.Close()
            }
            catch {
                $record.process.stdin_error_type = $_.Exception.GetType().FullName
            }
        }

        $waitErrorType = $null
        try {
            $process.WaitForExit()
            $record.process.natural_exit = $true
            $record.process.finished_at_utc = [DateTime]::UtcNow.ToString('o')
        }
        catch {
            $waitErrorType = $_.Exception.GetType().FullName
        }

        $stdoutRaw = ''
        $stderrRaw = ''
        try {
            $stdoutRaw = $stdoutTask.GetAwaiter().GetResult()
        }
        catch {
            $record.process.stdout_error_type = $_.Exception.GetType().FullName
        }
        try {
            $stderrRaw = $stderrTask.GetAwaiter().GetResult()
        }
        catch {
            $record.process.stderr_error_type = $_.Exception.GetType().FullName
        }

        $stdoutRedacted = Remove-CurrentSecret -Text $stdoutRaw -CurrentSecret $plainKey
        $stderrRedacted = Remove-CurrentSecret -Text $stderrRaw -CurrentSecret $plainKey
        $stdoutPath = [System.IO.Path]::Combine($parentFull, $record.stdout_artifact)
        $stderrPath = [System.IO.Path]::Combine($parentFull, $record.stderr_artifact)
        Write-NewTextFile -Path $stdoutPath -Text $stdoutRedacted
        Write-NewTextFile -Path $stderrPath -Text $stderrRedacted

        if ($stdoutRedacted.Length -gt 0) {
            [Console]::Out.Write($stdoutRedacted)
        }
        if ($stderrRedacted.Length -gt 0) {
            [Console]::Error.Write($stderrRedacted)
        }

        if ($record.process.natural_exit) {
            try {
                $record.exit_code = [int]$process.ExitCode
            }
            catch {
                $record.exit_code = $null
                $record.process.start_error_type = $_.Exception.GetType().FullName
            }
        }

        if (-not $record.process.natural_exit) {
            $record.status = 'WAIT_FAILED'
        }
        elseif ($null -ne $record.process.stdin_error_type) {
            $record.status = 'STDIN_FAILED'
        }
        elseif ($null -ne $record.process.stdout_error_type -or
            $null -ne $record.process.stderr_error_type) {
            $record.status = 'OUTPUT_CAPTURE_FAILED'
        }
        elseif ($null -eq $record.exit_code) {
            $record.status = 'EXIT_METADATA_UNAVAILABLE'
        }
        else {
            switch ($record.exit_code) {
                0 { $record.status = 'EXIT_0' }
                2 { $record.status = 'EXIT_2_ASSERTION' }
                3 { $record.status = 'EXIT_3_AUTH_BLOCKED' }
                4 { $record.status = 'EXIT_4_SETUP_ERROR' }
                5 { $record.status = 'EXIT_5_NOT_EXERCISED' }
                6 { $record.status = 'EXIT_6_INTERNAL' }
                default { $record.status = 'EXIT_{0}' -f $record.exit_code }
            }
        }

        [Console]::WriteLine(
            'PHASE {0}: exit={1}; status={2}; natural_exit={3}' -f
                $phase,
                $(if ($null -eq $record.exit_code) { 'NULL' } else { $record.exit_code }),
                $record.status,
                $record.process.natural_exit
        )

        if (-not $record.process.natural_exit -or $null -ne $waitErrorType -or
            $null -ne $record.process.stdin_error_type -or
            $null -ne $record.process.stdout_error_type -or
            $null -ne $record.process.stderr_error_type -or
            $null -eq $record.exit_code) {
            Set-PendingPhasesNotRun -Status 'NOT_RUN_AFTER_PROCESS_IO_FAILURE'
            $overallStatus = 'STOPPED_AFTER_PROCESS_IO_FAILURE'
            $overallExitCode = 2
            $stopAfterPhase = $true
        }
        elseif ($record.exit_code -eq 3) {
            Set-PendingPhasesNotRun -Status 'NOT_RUN_AFTER_AUTH_BLOCK'
            $overallStatus = 'STOPPED_AUTH_BLOCKED'
            $overallExitCode = 3
            $stopAfterPhase = $true
        }
        elseif ($record.exit_code -eq 4 -or $record.exit_code -eq 6 -or
            ($record.exit_code -ne 0 -and $record.exit_code -ne 2 -and $record.exit_code -ne 5)) {
            Set-PendingPhasesNotRun -Status 'NOT_RUN_AFTER_SETUP_OR_INTERNAL_FAILURE'
            $overallStatus = 'STOPPED_AFTER_SETUP_OR_INTERNAL_FAILURE'
            $overallExitCode = $record.exit_code
            $stopAfterPhase = $true
        }
        elseif ($record.exit_code -ne 0) {
            if ($null -eq $firstFailureExitCode) {
                $firstFailureExitCode = $record.exit_code
            }
            $overallStatus = 'COMPLETED_WITH_NONZERO_PHASE'
        }

        if ($stopAfterPhase) {
            break
        }
        $phaseIndex += 1
    }

    if (-not $stopAfterPhase -and $overallStatus -eq 'COMPLETED_ALL_EXIT_0') {
        $overallExitCode = 0
    }
    elseif (-not $stopAfterPhase -and $null -ne $firstFailureExitCode) {
        $overallExitCode = $firstFailureExitCode
    }

    [Console]::WriteLine('LAUNCH_RESULT: status={0}; exit={1}' -f $overallStatus, $overallExitCode)
    [Console]::WriteLine('Launcher metadata: {0}' -f $summaryPath)
}
catch {
    if ($keyEntryAccepted) {
        if ($phaseRecords | Where-Object { $_.status -eq 'PENDING' }) {
            Set-PendingPhasesNotRun -Status 'NOT_RUN_AFTER_SETUP_FAILURE'
        }
        if ($overallStatus -eq 'COMPLETED_ALL_EXIT_0') {
            $overallStatus = 'STOPPED_AFTER_SETUP_FAILURE'
        }
    }
    else {
        Set-PendingPhasesNotRun -Status 'NOT_RUN_KEY_ENTRY_NOT_ACCEPTED'
        $overallStatus = 'ABORTED_BEFORE_CHILD'
    }
    $overallExitCode = 2
    [Console]::Error.WriteLine(
        'LAUNCH_RESULT: status={0}; exit=2; failure={1}; exception_type={2}' -f
            $overallStatus,
            $currentFailureCode,
            $_.Exception.GetType().FullName
    )
}
finally {
    if ($keyBstr -ne [IntPtr]::Zero) {
        try {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyBstr)
        }
        catch {
            [Console]::Error.WriteLine(
                'KEY_BSTR_CLEANUP_FAILED: {0}' -f $_.Exception.GetType().FullName
            )
        }
    }
    if ($null -ne $secureKey) {
        try {
            $secureKey.Dispose()
        }
        catch {
            [Console]::Error.WriteLine(
                'SECURE_STRING_CLEANUP_FAILED: {0}' -f $_.Exception.GetType().FullName
            )
        }
    }
    $plainKey = $null
    $secureKey = $null
    $keyBstr = [IntPtr]::Zero

    Write-LaunchSummary
    [Console]::WriteLine('Secure input cleanup attempted (best effort; not a forensic memory-zero guarantee).')
}

exit $overallExitCode
