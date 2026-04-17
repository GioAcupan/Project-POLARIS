param(
  [string]$ApiHost = "127.0.0.1",
  [int]$ApiPort = 8000,
  [string]$FrontendHost = "127.0.0.1",
  [int]$FrontendPort = 4173
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot "frontend"
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
  $pythonCmd = $venvPython
} else {
  $pythonCmd = "python"
}

$apiArgs = @(
  "-m", "uvicorn", "api.main:app",
  "--host", $ApiHost,
  "--port", "$ApiPort"
)

Write-Host "Starting backend on http://$ApiHost`:$ApiPort ..."
$backendProc = Start-Process -FilePath $pythonCmd -ArgumentList $apiArgs -WorkingDirectory $repoRoot -PassThru

try {
  Push-Location $frontendDir
  try {
    Write-Host "Building frontend ..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Frontend build failed."
    }

    Write-Host "Starting frontend on http://$FrontendHost`:$FrontendPort ..."
    # Call Vite directly so host/port flags are preserved exactly.
    & npx vite preview --host "$FrontendHost" --port "$FrontendPort"
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($null -ne $backendProc -and -not $backendProc.HasExited) {
    Write-Host "Stopping backend process ..."
    Stop-Process -Id $backendProc.Id -Force
  }
}
