$ErrorActionPreference = "Stop"

Write-Host "Titan Zero Windows packaging preflight"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 20+ is required."
}
$nodeVersion = [Version]((node -v).TrimStart("v"))
if ($nodeVersion.Major -lt 20) {
  throw "Node.js 20+ is required. Found $nodeVersion."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Host "pnpm not found; activating project-pinned pnpm 9.12.0 through Corepack..."
    corepack enable
    corepack prepare pnpm@9.12.0 --activate
  }
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw "pnpm 9.12.0 is required. Enable Corepack or install pnpm."
}

$pnpmVersion = (pnpm --version).Trim()
Write-Host "Using pnpm $pnpmVersion"

# Electron/electron-builder are newly added by the desktop packaging layer, so the
# first Windows packaging run must refresh pnpm-lock.yaml. Subsequent source
# releases should commit that refreshed lockfile and may switch back to frozen mode.
pnpm install --no-frozen-lockfile
pnpm desktop:dist:win

Write-Host ""
Write-Host "Installer output:"
$installers = Get-ChildItem -Path "dist\windows" -Filter "Titan-Zero-Setup-*.exe" -Recurse
if (-not $installers) {
  throw "electron-builder completed without producing a Titan Zero installer."
}
$installers | Select-Object FullName, Length, LastWriteTime
