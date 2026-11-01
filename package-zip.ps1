Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = Join-Path $PSScriptRoot "cavrix-pterodactyl-bot.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "Creating zip: $zipPath"

$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$filesToInclude = @(
    "package.json",
    "package-lock.json",
    "index.js",
    "next.config.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    ".env"
)

$directoriesToInclude = @(
    "prisma",
    "src",
    "public"
)

# 1. Add individual root files
foreach ($file in $filesToInclude) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $entryName = $file.Replace("\", "/")
        Write-Host "Adding file: $entryName"
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $filePath, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    }
}

# 2. Add directories with proper forward slashes (POSIX format for Linux)
foreach ($dir in $directoriesToInclude) {
    $dirPath = Join-Path $PSScriptRoot $dir
    if (Test-Path $dirPath) {
        $allFiles = Get-ChildItem -Path $dirPath -Recurse -File
        foreach ($f in $allFiles) {
            $relPath = $f.FullName.Substring($PSScriptRoot.Length + 1)
            $entryName = $relPath.Replace("\", "/")
            
            # Special handling for database file which might be locked by running process
            if ($f.Name -eq "dev.db" -or $f.Name -like "*dev.db*") {
                try {
                    $tempDb = [System.IO.Path]::GetTempFileName()
                    $inStream = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                    $outStream = [System.IO.File]::Open($tempDb, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
                    $inStream.CopyTo($outStream)
                    $inStream.Close()
                    $outStream.Close()
                    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $tempDb, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
                    Remove-Item -Force $tempDb
                    Write-Host "Added safely: $entryName"
                } catch {
                    Write-Host "Skipping locked dev.db (it will auto-generate on panel): $($_.Exception.Message)"
                }
            } else {
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $f.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
            }
        }
    }
}

$archive.Dispose()

$sizeMB = (Get-Item $zipPath).Length / 1MB
Write-Host "Zip created successfully with POSIX forward slashes! Size: $($sizeMB.ToString('0.00')) MB"
