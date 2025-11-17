param(
    [switch]$ApplyReplace
)

$root = Join-Path (Get-Location) 'frontend\src'
$files = Get-ChildItem -Path $root -Recurse -Include *.tsx, *.ts, *.jsx, *.js -File |
Where-Object { $_.FullName -notmatch '\\figma\\' }

$sizeMap = @{
    'text-[28px]' = 'text-[1.75rem]'
    'text-[15px]' = 'text-[0.9375rem]'
}

$colorMap = @{
    'text-[#4C6EF5]'         = 'text-primary'
    'hover:text-[#3B5EE5]'   = 'hover:text-primary-600'
    'border-[#4C6EF5]'       = 'border-primary'
    'ring-[#4C6EF5]'         = 'ring-primary'
    'focus:ring-blue-500/20' = 'focus:ring-primary/20'
}

Write-Host "Preview mode. Files that would be changed:"
foreach ($f in $files) {
    try {
        $t = Get-Content -Path $f.FullName -Raw -Encoding UTF8 -ErrorAction Stop
    }
    catch {
        Write-Host "  SKIP (read error): $($f.FullName)"
        continue
    }

    if ([string]::IsNullOrEmpty($t)) {
        continue
    }

    $orig = $t

    foreach ($k in $sizeMap.Keys) {
        $escaped = [regex]::Escape($k)
        $t = [regex]::Replace($t, $escaped, $sizeMap[$k])
    }
    foreach ($k in $colorMap.Keys) {
        $escaped = [regex]::Escape($k)
        $t = [regex]::Replace($t, $escaped, $colorMap[$k])
    }

    if ($t -ne $orig) {
        Write-Host "  WILL CHANGE: $($f.FullName)"
        if ($ApplyReplace) {
            Set-Content -Path $f.FullName -Value $t -Encoding UTF8
            Write-Host "  UPDATED: $($f.FullName)"
        }
    }
}

if (-not $ApplyReplace) {
    Write-Host ""
    Write-Host "Run this script again with the -ApplyReplace flag to write the changes:"
    Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File .\script.ps1 -ApplyReplace"
}