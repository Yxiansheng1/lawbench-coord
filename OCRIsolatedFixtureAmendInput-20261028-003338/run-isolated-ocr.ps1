[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$StageDir,

  [switch]$ProbeExistingHealth
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ExpectedSchema = "lawbench-isolated-synthetic-ocr-input/1"
$BinaryPath = "C:\prep395\llama\llama-server.exe"
$BinaryBytes = [long]-1
$BinarySha256 = "9d7ec1f038329210f6be353a889752ea4a762f9defa80560d37102ccce7b09a06"
$ModelPath = "C:\prep395\models\Xiaomi-OCR-0.BF16.gguf"
$ModelBytes = [long]1516744960
$ModelSha256 = "d796fa2cd211ba39a40f37691fc0046aa49f59c7968ec844eb9e81f2ae476a52"
$MmprojPath = "C:\prep395\models\Xiaomi-OCR-0.mmproj-bf16.gguf"
$MmprojBytes = [long]207346624
$MmprojSha256 = "634d6bc95781ebf4a3f06570a59859fa5082d488db540fd474bc6b4061aec90e"
$FixtureName = ([string][char]0x8F6C) + ([char]0x8D26) + ([char]0x622A) + ([char]0x56FE) + ".jpg"
$FixturePath = Join-Path "D:\Lawbeach\lawbench-B\tests\fixtures\criminal-01" $FixtureName
$FixtureBytes = [long]47379
$FixtureSha256 = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
$RenderBytes = [long]132843
$RenderSha256 = "6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a"
$ExpectedPrompt = (
  'Extract all information from the main body of the document image and represent it ' +
  'in markdown format, ignoring headers and footers. Tables should be expressed in OTSL ' +
  'format, formulas in the document should be represented using LATEX format, and the ' +
  'parsing should be organized according to the reading order.'
)
$ExpectedSourcePins = [ordered]@{
  "D:\Lawbeach\lawbench-C\prep395\prep395\app.py" = @(
    [long]17514,
    "011cf2e510d1ed03fe8dc8b14cc10feef5aa012e1a22e119a819fb6f8fecc5f1"
  )
  "D:\Lawbeach\lawbench-C\prep395\prep395\backends.py" = @(
    [long]10931,
    "5cd1446577b7a61b60146d42a56e8778ecda0623dd2a5490b4b27e7138fc6200"
  )
  "D:\Lawbeach\lawbench-C\prep395\prep395\dewatermark.py" = @(
    [long]5347,
    "1defd385791fbec594e9b09a9dcd6b6ec06ee0c019554dbc85185398b904748a"
  )
  "D:\Lawbeach\lawbench-B\service\lawbench\ocr\render.py" = @(
    [long]2892,
    "600fbb3c368c6a0dbc71fd173c94ba5455af8518717284b852ccee8b72849ae3"
  )
}

# 120 seconds is the unchanged product OCR request bound (config.py).
# 130 seconds is LlamaServerBackend(timeout_s=ocr_timeout_s + 10).
# 3 seconds is the unchanged product backend health timeout.
$ReadinessBoundSeconds = 120
$InferenceBoundSeconds = 130
$HealthRequestTimeoutSeconds = 3
$StopWaitSeconds = 15
$ProductionPorts = @(9000, 9101, 9102)

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

function Write-JsonNoBom([string]$Path, $Value) {
  $json = $Value | ConvertTo-Json -Depth 24
  Write-Utf8NoBom $Path ($json + [Environment]::NewLine)
}

function Get-BytesSha256([byte[]]$Bytes) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace("-", "").ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Assert-PropertySet($Object, [string[]]$Expected, [string]$What) {
  $actual = @($Object.PSObject.Properties.Name | Sort-Object)
  $wanted = @($Expected | Sort-Object)
  if ((Compare-Object -ReferenceObject $wanted -DifferenceObject $actual).Count -ne 0) {
    throw "$What has unexpected fields"
  }
}

function Assert-NoReparseComponents([string]$Path, [string]$StopAt) {
  $full = [System.IO.Path]::GetFullPath($Path).TrimEnd("\")
  $stop = [System.IO.Path]::GetFullPath($StopAt).TrimEnd("\")
  if (-not $full.StartsWith($stop + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is outside the required root: $full"
  }
  $cursor = $full
  while ($cursor.Length -gt $stop.Length) {
    $item = Get-Item -LiteralPath $cursor -Force
    if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Reparse point is not allowed: $cursor"
    }
    $cursor = Split-Path -LiteralPath $cursor -Parent
  }
}

function Assert-FixedFile([string]$Path, [long]$ExpectedBytes, [string]$ExpectedSha256) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing fixed file: $Path"
  }
  $item = Get-Item -LiteralPath $Path -Force
  if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "Fixed file is a reparse point: $Path"
  }
  if ($ExpectedBytes -ge 0 -and $item.Length -ne $ExpectedBytes) {
    throw "Fixed file byte count differs: $Path actual=$($item.Length) expected=$ExpectedBytes"
  }
  $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $ExpectedSha256.ToLowerInvariant()) {
    throw "Fixed file SHA-256 differs: $Path actual=$actual expected=$ExpectedSha256"
  }
  return [ordered]@{
    path = $Path
    bytes = [long]$item.Length
    sha256 = $actual
  }
}

function Get-OwnedIdentity($Process) {
  $Process.Refresh()
  $birth = $Process.StartTime.ToUniversalTime().ToString("o")
  $path = $Process.Path
  return [ordered]@{
    pid = [int]$Process.Id
    executable = $path
    birth_utc = $birth
  }
}

function Assert-OwnedIdentity($Process, [int]$ExpectedPid, [string]$ExpectedBirthUtc) {
  if ($null -eq $Process) {
    throw "No owned process object"
  }
  $Process.Refresh()
  if ($Process.HasExited) {
    throw "Owned process already exited; refusing a blind stop"
  }
  $identity = Get-OwnedIdentity $Process
  if ($identity.pid -ne $ExpectedPid -or
      $identity.birth_utc -ne $ExpectedBirthUtc -or
      -not [string]::Equals($identity.executable, $BinaryPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Owned process identity differs; refusing to stop"
  }
  return $identity
}

function Get-ProductionSnapshot {
  $os = Get-CimInstance -ClassName Win32_OperatingSystem |
    Select-Object LastBootUpTime, TotalVisibleMemorySize, FreePhysicalMemory, FreeVirtualMemory
  $listeners = @()
  foreach ($port in $ProductionPorts) {
    $connections = @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
    if ($connections.Count -eq 0) {
      throw "Required existing production listener is absent before/after diagnostic: port $port"
    }
    foreach ($connection in $connections) {
      $process = Get-Process -Id $connection.OwningProcess -ErrorAction Stop
      $listeners += [ordered]@{
        port = [int]$port
        local_address = [string]$connection.LocalAddress
        pid = [int]$connection.OwningProcess
        executable = [string]$process.Path
        birth_utc = $process.StartTime.ToUniversalTime().ToString("o")
        working_set_bytes = [long]$process.WorkingSet64
        cpu_seconds = [double]$process.CPU
      }
    }
  }
  return [ordered]@{
    at_utc = [DateTime]::UtcNow.ToString("o")
    os = [ordered]@{
      last_boot_utc = $os.LastBootUpTime.ToUniversalTime().ToString("o")
      total_visible_memory_kib = [long]$os.TotalVisibleMemorySize
      free_physical_memory_kib = [long]$os.FreePhysicalMemory
      free_virtual_memory_kib = [long]$os.FreeVirtualMemory
    }
    production_listeners = @($listeners | Sort-Object port, local_address, pid)
  }
}

function Get-ListenerSet([int]$Port) {
  return @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess |
    Sort-Object LocalAddress, LocalPort, OwningProcess)
}

function Get-FreeLoopbackPort {
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    try {
      $port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    } finally {
      $listener.Stop()
    }
    if ($ProductionPorts -notcontains $port -and (Get-ListenerSet $port).Count -eq 0) {
      return [int]$port
    }
  }
  throw "Could not obtain a private loopback port"
}

function New-HttpClient([int]$TimeoutSeconds) {
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.UseProxy = $false
  $handler.AllowAutoRedirect = $false
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
  return $client
}

function Complete-StreamTask($Task) {
  if ($null -eq $Task) {
    return ""
  }
  try {
    return [string]$Task.GetAwaiter().GetResult()
  } catch {
    return "[capture-error] $($_.Exception.GetType().FullName): $($_.Exception.Message)"
  }
}

$now = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmssfff")
$stageRoot = [System.IO.Path]::GetFullPath($StageDir).TrimEnd("\")
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd("\")
$runDir = Join-Path $stageRoot ("run-$now-parentpid-$PID")

$status = "SETUP_ERROR"
$exitCode = 20
$result = [ordered]@{
  artifact_schema = "lawbench-isolated-synthetic-ocr-run/1"
  status = $status
  author_executed = $false
  started_at_utc = [DateTime]::UtcNow.ToString("o")
  stage_dir = $stageRoot
  run_dir = $runDir
  request_attempts = 0
  health_attempts = 0
  private_process = $null
  production_snapshot_before = $null
  production_snapshot_after = $null
  production_listeners_preserved = $false
  response = $null
  invoking_identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  errors = @()
  forced_stop = $false
  forced_stop_note = "No private process was stopped."
}

$privateProcess = $null
$stdoutTask = $null
$stderrTask = $null
$stdoutText = ""
$stderrText = ""
$ownedPid = 0
$ownedBirthUtc = $null
$privateStarted = $false
$healthClient = $null
$requestClient = $null
$responseBytes = $null

try {
  if (-not (Test-Path -LiteralPath $stageRoot -PathType Container)) {
    throw "StageDir does not exist: $stageRoot"
  }
  if (-not $stageRoot.StartsWith($tempRoot + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "StageDir must be a fresh private directory under the current user's TEMP: $stageRoot"
  }
  Assert-NoReparseComponents $stageRoot $tempRoot
  New-Item -ItemType Directory -Path $runDir | Out-Null

  $manifestPath = Join-Path $stageRoot "manifest.json"
  $preprocessedPath = Join-Path $stageRoot "preprocessed-page1.png"
  $requestPath = Join-Path $stageRoot "request.json"
  foreach ($inputPath in @($manifestPath, $preprocessedPath, $requestPath)) {
    if (-not (Test-Path -LiteralPath $inputPath -PathType Leaf)) {
      throw "Missing prepared input: $inputPath"
    }
    $inputItem = Get-Item -LiteralPath $inputPath -Force
    if (($inputItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Prepared input is a reparse point: $inputPath"
    }
  }

  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ($manifest.artifact_schema -ne $ExpectedSchema -or $manifest.status -ne "PREPARED_NOT_RUN") {
    throw "Prepared manifest schema/status is unexpected"
  }
  if ($manifest.fixture.path -ne $FixturePath -or
      [long]$manifest.fixture.bytes -ne $FixtureBytes -or
      $manifest.fixture.sha256 -ne $FixtureSha256 -or
      $manifest.fixture.mutation -ne "none") {
    throw "Prepared manifest fixture identity is unexpected"
  }
  if ([long]$manifest.production_render.bytes -ne $RenderBytes -or
      $manifest.production_render.sha256 -ne $RenderSha256 -or
      [int]$manifest.production_render.width -ne 750 -or
      [int]$manifest.production_render.height -ne 1334) {
    throw "Prepared manifest render identity is unexpected"
  }
  if ($manifest.production_payload.model -ne "Xiaomi-OCR-0.BF16.gguf" -or
      $manifest.production_payload.template -ne "xiaomi-ocr-0" -or
      $manifest.production_payload.image_first -ne $true -or
      [int]$manifest.production_payload.temperature -ne 0 -or
      [int]$manifest.production_payload.max_tokens -ne 4096 -or
      $manifest.production_payload.stream -ne $false -or
      $manifest.production_payload.enable_thinking -ne $false -or
      $manifest.production_payload.prompt_sha256 -ne (Get-BytesSha256 ([Text.Encoding]::UTF8.GetBytes($ExpectedPrompt)))) {
    throw "Prepared manifest production payload semantics are unexpected"
  }
  foreach ($sourcePath in $ExpectedSourcePins.Keys) {
    $pin = $manifest.source_pins.PSObject.Properties[$sourcePath].Value
    $expectedPin = $ExpectedSourcePins[$sourcePath]
    if ($null -eq $pin -or
        [long]$pin.bytes -ne [long]$expectedPin[0] -or
        $pin.sha256 -ne [string]$expectedPin[1]) {
      throw "Prepared manifest source pin differs: $sourcePath"
    }
  }

  [byte[]]$preprocessed = [System.IO.File]::ReadAllBytes($preprocessedPath)
  [byte[]]$requestBytes = [System.IO.File]::ReadAllBytes($requestPath)
  $preprocessedSha = Get-BytesSha256 $preprocessed
  $requestSha = Get-BytesSha256 $requestBytes
  if ([long]$preprocessed.Length -ne [long]$manifest.production_preprocess.bytes -or
      $preprocessedSha -ne [string]$manifest.production_preprocess.sha256) {
    throw "Preprocessed PNG identity differs from manifest"
  }
  if ([long]$requestBytes.Length -ne [long]$manifest.production_payload.request_json_bytes -or
      $requestSha -ne [string]$manifest.production_payload.request_json_sha256) {
    throw "Request JSON identity differs from manifest"
  }

  $requestText = [System.Text.Encoding]::UTF8.GetString($requestBytes)
  if ($requestText -match '(?i)businesskey|business_key|apikey|api_key|authorization|credential|password|secret') {
    throw "Prepared request contains a forbidden credential-like field"
  }
  $request = $requestText | ConvertFrom-Json
  Assert-PropertySet $request @(
    "model", "messages", "temperature", "max_tokens", "stream", "chat_template_kwargs"
  ) "Request root"
  if ($request.model -ne "Xiaomi-OCR-0.BF16.gguf" -or
      [int]$request.temperature -ne 0 -or
      [int]$request.max_tokens -ne 4096 -or
      $request.stream -ne $false -or
      $request.chat_template_kwargs.enable_thinking -ne $false) {
    throw "Prepared request does not match the fixed production backend body"
  }
  if ($request.messages.Count -ne 1 -or $request.messages[0].content.Count -ne 2 -or
      $request.messages[0].content[0].type -ne "image_url" -or
      $request.messages[0].content[1].type -ne "text") {
    throw "Prepared request is not image-first Xiaomi content"
  }
  Assert-PropertySet $request.messages[0] @("role", "content") "Request message"
  Assert-PropertySet $request.messages[0].content[0] @("type", "image_url") "Request image item"
  Assert-PropertySet $request.messages[0].content[0].image_url @("url") "Request image_url"
  Assert-PropertySet $request.messages[0].content[1] @("type", "text") "Request text item"
  Assert-PropertySet $request.chat_template_kwargs @("enable_thinking") "Request chat_template_kwargs"
  if ($request.messages[0].role -ne "user" -or
      $request.messages[0].content[1].text -cne $ExpectedPrompt) {
    throw "Prepared request role or Xiaomi prompt differs from the fixed source"
  }
  $dataUrl = [string]$request.messages[0].content[0].image_url.url
  $prefix = "data:image/png;base64,"
  if (-not $dataUrl.StartsWith($prefix, [System.StringComparison]::Ordinal)) {
    throw "Prepared request does not contain a PNG data URL"
  }
  [byte[]]$decodedImage = [Convert]::FromBase64String($dataUrl.Substring($prefix.Length))
  if ([long]$decodedImage.Length -ne [long]$preprocessed.Length -or
      (Get-BytesSha256 $decodedImage) -ne $preprocessedSha) {
    throw "Request image differs from prepared preprocessed PNG"
  }
  $decodedImage = $null

  $result.private_process = [ordered]@{
    binary = Assert-FixedFile $BinaryPath $BinaryBytes $BinarySha256
    model = Assert-FixedFile $ModelPath $ModelBytes $ModelSha256
    mmproj = Assert-FixedFile $MmprojPath $MmprojBytes $MmprojSha256
  }

  $before = Get-ProductionSnapshot
  $result.production_snapshot_before = $before
  $beforeListeners = $before.production_listeners |
    Select-Object port, local_address, pid, executable, birth_utc |
    ConvertTo-Json -Depth 8 -Compress

  $homeDir = Join-Path $runDir "home"
  $profileDir = Join-Path $runDir "profile"
  $appDataDir = Join-Path $runDir "appdata"
  $localAppDataDir = Join-Path $runDir "localappdata"
  $tempDir = Join-Path $runDir "temp"
  New-Item -ItemType Directory -Path $homeDir, $profileDir, $appDataDir, $localAppDataDir, $tempDir | Out-Null

  $ownedPort = Get-FreeLoopbackPort
  $arguments = (
    '-m "{0}" --mmproj "{1}" --port {2} -np 2 -c 32768 --host 127.0.0.1 ' +
    '-ngl 99 --no-webui'
  ) -f $ModelPath, $MmprojPath, $ownedPort

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $BinaryPath
  $psi.Arguments = $arguments
  $psi.WorkingDirectory = $runDir
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $psi.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
  $psi.EnvironmentVariables.Clear()
  foreach ($name in @("SystemRoot", "SystemDrive", "ComSpec", "PATHEXT", "PATH", "WINDIR")) {
    $value = [Environment]::GetEnvironmentVariable($name)
    if ($value) {
      $psi.EnvironmentVariables[$name] = $value
    }
  }
  $psi.EnvironmentVariables["HOME"] = $homeDir
  $psi.EnvironmentVariables["USERPROFILE"] = $profileDir
  $psi.EnvironmentVariables["APPDATA"] = $appDataDir
  $psi.EnvironmentVariables["LOCALAPPDATA"] = $localAppDataDir
  $psi.EnvironmentVariables["TEMP"] = $tempDir
  $psi.EnvironmentVariables["TMP"] = $tempDir
  $psi.EnvironmentVariables["HOMEDRIVE"] = [System.IO.Path]::GetPathRoot($profileDir).TrimEnd("\")
  $psi.EnvironmentVariables["HOMEPATH"] = $profileDir.Substring([System.IO.Path]::GetPathRoot($profileDir).Length - 1)

  $privateProcess = New-Object System.Diagnostics.Process
  $privateProcess.StartInfo = $psi
  if (-not $privateProcess.Start()) {
    throw "Private llama-server process did not start"
  }
  $privateStarted = $true
  $ownedIdentity = Get-OwnedIdentity $privateProcess
  $ownedPid = [int]$ownedIdentity.pid
  $ownedBirthUtc = [string]$ownedIdentity.birth_utc
  if (-not [string]::Equals($ownedIdentity.executable, $BinaryPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Private process executable differs from pinned binary"
  }
  $stdoutTask = $privateProcess.StandardOutput.ReadToEndAsync()
  $stderrTask = $privateProcess.StandardError.ReadToEndAsync()
  $result.private_process.owned_pid = $ownedPid
  $result.private_process.owned_birth_utc = $ownedBirthUtc
  $result.private_process.loopback_port = $ownedPort
  $result.private_process.arguments = $arguments
  $result.private_process.flags_note = "Current install.ps1 has no --no-warmup; --log-disable is omitted only to capture private stdout/stderr."
  $result.private_process.environment_note = "Only SystemRoot/SystemDrive/ComSpec/PATHEXT/PATH/WINDIR plus private HOME, USERPROFILE, APPDATA, LOCALAPPDATA and TEMP/TMP; proxy variables are absent."
  $result.private_process.forced_stop_expected_after_evidence = $true

  $healthClient = New-HttpClient $HealthRequestTimeoutSeconds
  $healthUri = "http://127.0.0.1:$ownedPort/health"
  $healthClock = [System.Diagnostics.Stopwatch]::StartNew()
  $healthy = $false
  $lastHealthError = $null
  $lastHealthStatus = $null
  while ($healthClock.Elapsed.TotalSeconds -lt $ReadinessBoundSeconds) {
    $privateProcess.Refresh()
    if ($privateProcess.HasExited) {
      break
    }
    try {
      $result.health_attempts = [int]$result.health_attempts + 1
      $healthResponse = $healthClient.GetAsync($healthUri).GetAwaiter().GetResult()
      try {
        $lastHealthStatus = [int]$healthResponse.StatusCode
        if ($healthResponse.StatusCode -eq [System.Net.HttpStatusCode]::OK) {
          $healthy = $true
          break
        }
      } finally {
        $healthResponse.Dispose()
      }
    } catch {
      $lastHealthError = "$($_.Exception.GetType().FullName): $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 1000
  }
  $healthClock.Stop()
  $result.readiness = [ordered]@{
    healthy = $healthy
    elapsed_ms = [long]$healthClock.ElapsedMilliseconds
    product_bound_seconds = $ReadinessBoundSeconds
    product_health_timeout_seconds = $HealthRequestTimeoutSeconds
    last_status = $lastHealthStatus
    last_error = $lastHealthError
  }

  if (-not $healthy) {
    $privateProcess.Refresh()
    if ($privateProcess.HasExited) {
      $status = "NATIVE_PROCESS_EXITED_BEFORE_HEALTHY"
      $exitCode = 10
      $result.natural_exit_code = [int]$privateProcess.ExitCode
    } else {
      $status = "READINESS_BOUND_EXCEEDED"
      $exitCode = 11
    }
  } else {
    $requestClient = New-HttpClient $InferenceBoundSeconds
    $content = [System.Net.Http.ByteArrayContent]::new($requestBytes)
    $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("application/json")
    $requestUri = "http://127.0.0.1:$ownedPort/v1/chat/completions"
    $requestClock = [System.Diagnostics.Stopwatch]::StartNew()
    $response = $null
    try {
      $result.request_attempts = [int]$result.request_attempts + 1
      $response = $requestClient.PostAsync($requestUri, $content).GetAwaiter().GetResult()
      $responseBytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
      $responseText = [System.Text.Encoding]::UTF8.GetString($responseBytes)
      $result.response = [ordered]@{
        status_code = [int]$response.StatusCode
        reason_phrase = [string]$response.ReasonPhrase
        bytes = [long]$responseBytes.Length
        sha256 = Get-BytesSha256 $responseBytes
        body = $responseText
        elapsed_ms = 0
      }
      if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300) {
        $status = "SYNTHETIC_RESPONSE_RECEIVED"
        $exitCode = 0
      } else {
        $status = "SYNTHETIC_RESPONSE_NON_2XX"
        $exitCode = 14
      }
    } catch {
      $privateProcess.Refresh()
      $result.request_exception = [ordered]@{
        type = $_.Exception.GetType().FullName
        message = $_.Exception.Message
      }
      if ($privateProcess.HasExited) {
        $status = "NATIVE_PROCESS_EXITED_ON_REQUEST"
        $exitCode = 12
        $result.natural_exit_code = [int]$privateProcess.ExitCode
      } else {
        $status = "REQUEST_FAILED_PROCESS_ALIVE"
        $exitCode = 13
      }
    } finally {
      $requestClock.Stop()
      if ($null -ne $response) {
        if ($null -ne $result.response) {
          $result.response.elapsed_ms = [long]$requestClock.ElapsedMilliseconds
        }
        $response.Dispose()
      }
      $content.Dispose()
      $requestClient.Dispose()
      $requestClient = $null
    }
  }
} catch {
  $result.errors += [ordered]@{
    phase = if ($privateStarted) { "runtime" } else { "preflight" }
    type = $_.Exception.GetType().FullName
    message = $_.Exception.Message
  }
  if ($privateStarted) {
    $status = "RUNTIME_ERROR"
    $exitCode = 13
  } else {
    $status = "SETUP_OR_IDENTITY_ERROR"
    $exitCode = 20
  }
} finally {
  $result.status = $status

  if ($null -ne $privateProcess) {
    try {
      $privateProcess.Refresh()
      if (-not $privateProcess.HasExited) {
        $null = Assert-OwnedIdentity $privateProcess $ownedPid $ownedBirthUtc
        $result.forced_stop = $true
        $result.forced_stop_note = "Owned standalone process remained after evidence capture; stopped by exact Process object after PID/path/birth check."
        $privateProcess.Kill()
        if (-not $privateProcess.WaitForExit($StopWaitSeconds * 1000)) {
          throw "Owned process did not exit within the technical cleanup wait"
        }
      } else {
        $result.forced_stop_note = "Owned process exited naturally; no kill was sent."
      }
      $privateProcess.WaitForExit()
    } catch {
      $result.errors += [ordered]@{
        phase = "owned_cleanup"
        type = $_.Exception.GetType().FullName
        message = $_.Exception.Message
      }
      if ($exitCode -eq 0) {
        $exitCode = 21
        $result.status = "OWNED_CLEANUP_ERROR"
      }
    }
  }

  try {
    if ($null -ne $healthClient) {
      $healthClient.Dispose()
      $healthClient = $null
    }
    if ($null -ne $requestClient) {
      $requestClient.Dispose()
      $requestClient = $null
    }
  } catch {
    $result.errors += [ordered]@{
      phase = "http_cleanup"
      type = $_.Exception.GetType().FullName
      message = $_.Exception.Message
    }
  }

  if ($privateStarted) {
    $stdoutText = Complete-StreamTask $stdoutTask
    $stderrText = Complete-StreamTask $stderrTask
  }

  if (Test-Path -LiteralPath $runDir -PathType Container) {
    $stdoutPath = Join-Path $runDir "llama-server.stdout.log"
    $stderrPath = Join-Path $runDir "llama-server.stderr.log"
    Write-Utf8NoBom $stdoutPath $stdoutText
    Write-Utf8NoBom $stderrPath $stderrText
    $result.private_process_logs = [ordered]@{
      stdout = [ordered]@{
        path = $stdoutPath
        bytes = [long](Get-Item -LiteralPath $stdoutPath).Length
        sha256 = (Get-FileHash -LiteralPath $stdoutPath -Algorithm SHA256).Hash.ToLowerInvariant()
      }
      stderr = [ordered]@{
        path = $stderrPath
        bytes = [long](Get-Item -LiteralPath $stderrPath).Length
        sha256 = (Get-FileHash -LiteralPath $stderrPath -Algorithm SHA256).Hash.ToLowerInvariant()
      }
    }

    try {
      $ownListenersAfter = Get-ListenerSet $ownedPort
      $result.own_listener_after = @($ownListenersAfter)
      $result.own_listener_closed = ($ownListenersAfter.Count -eq 0)
    } catch {
      $result.own_listener_after_error = $_.Exception.Message
      $result.own_listener_closed = $false
    }
  }

  try {
    $after = Get-ProductionSnapshot
    $result.production_snapshot_after = $after
    $afterListeners = $after.production_listeners |
      Select-Object port, local_address, pid, executable, birth_utc |
      ConvertTo-Json -Depth 8 -Compress
    $result.production_listeners_preserved = (
      $null -ne $result.production_snapshot_before -and
      $beforeListeners -eq $afterListeners
    )
  } catch {
    $result.errors += [ordered]@{
      phase = "production_after_snapshot"
      type = $_.Exception.GetType().FullName
      message = $_.Exception.Message
    }
    $result.production_listeners_preserved = $false
  }

  if (-not $result.production_listeners_preserved -and $exitCode -eq 0) {
    $exitCode = 21
    $result.status = "PRODUCTION_LISTEN_CHANGED_OR_UNVERIFIED"
  }

  if ($ProbeExistingHealth) {
    $probeClient = $null
    try {
      $probeClient = New-HttpClient 10
      $probeResponse = $probeClient.GetAsync("http://127.0.0.1:9000/health").GetAwaiter().GetResult()
      try {
        [byte[]]$probeBytes = $probeResponse.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $result.existing_health_probe = [ordered]@{
          requested = $true
          status_code = [int]$probeResponse.StatusCode
          body = [System.Text.Encoding]::UTF8.GetString($probeBytes)
          inference_inferred = $false
        }
      } finally {
        $probeResponse.Dispose()
      }
    } catch {
      $result.existing_health_probe = [ordered]@{
        requested = $true
        error = $_.Exception.Message
        inference_inferred = $false
      }
    } finally {
      if ($null -ne $probeClient) {
        $probeClient.Dispose()
      }
    }
  } else {
    $result.existing_health_probe = [ordered]@{
      requested = $false
      inference_inferred = $false
    }
  }

  $result.ended_at_utc = [DateTime]::UtcNow.ToString("o")
  $result.exit_code = $exitCode

  if (Test-Path -LiteralPath $runDir -PathType Container) {
    $resultPath = Join-Path $runDir "result.json"
    $summaryPath = Join-Path $runDir "summary.json"
    Write-JsonNoBom $resultPath $result
    $summary = [ordered]@{
      artifact_schema = "lawbench-isolated-synthetic-ocr-summary/1"
      status = $result.status
      exit_code = $exitCode
      health_attempts = $result.health_attempts
      request_attempts = $result.request_attempts
      response_status = if ($null -ne $result.response) { $result.response.status_code } else { $null }
      natural_exit_code = if ($result.Contains("natural_exit_code")) { $result.natural_exit_code } else { $null }
      forced_stop = $result.forced_stop
      own_listener_closed = if ($result.Contains("own_listener_closed")) { $result.own_listener_closed } else { $false }
      production_listeners_preserved = $result.production_listeners_preserved
      private_process = $result.private_process
      logs = if ($result.Contains("private_process_logs")) { $result.private_process_logs } else { $null }
      errors = $result.errors
    }
    Write-JsonNoBom $summaryPath $summary
    Write-Host ("{0} exit={1} evidence={2}" -f $result.status, $exitCode, $runDir)
  } else {
    Write-Host ("{0} exit={1} evidence_dir_not_created" -f $result.status, $exitCode)
  }
}

exit $exitCode
