# Fix Prisma Build Error Script
# This script stops node processes and clears Prisma cache

Write-Host "Fixing Prisma Build Error..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all node processes
Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"} -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node process(es). Stopping..." -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $($_.Id)" -ForegroundColor Green
        } catch {
            Write-Host "  Could not stop process $($_.Id)" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No Node processes running" -ForegroundColor Green
}

# Step 2: Clear Prisma cache
Write-Host ""
Write-Host "Step 2: Clearing Prisma cache..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    try {
        # Try to remove the query engine file first
        $queryEnginePath = "$prismaPath\client\query_engine-windows.dll.node"
        if (Test-Path $queryEnginePath) {
            Remove-Item -Path $queryEnginePath -Force -ErrorAction SilentlyContinue
        }
        
        # Remove temp files
        $tempFiles = Get-ChildItem -Path "$prismaPath\client" -Filter "*.tmp*" -ErrorAction SilentlyContinue
        if ($tempFiles) {
            $tempFiles | Remove-Item -Force -ErrorAction SilentlyContinue
        }
        
        # Remove the entire .prisma folder
        Remove-Item -Recurse -Force $prismaPath -ErrorAction SilentlyContinue
        Write-Host "  Prisma cache cleared" -ForegroundColor Green
    } catch {
        Write-Host "  Some files could not be deleted (may be in use)" -ForegroundColor Yellow
        Write-Host "  Try closing all terminals and IDEs, then run this script again" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Prisma cache folder not found" -ForegroundColor Green
}

# Step 3: Regenerate Prisma Client
Write-Host ""
Write-Host "Step 3: Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host ""
    Write-Host "Prisma Client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "Try the following:" -ForegroundColor Yellow
    Write-Host "  1. Close all terminals and IDEs" -ForegroundColor Yellow
    Write-Host "  2. Restart your computer" -ForegroundColor Yellow
    Write-Host "  3. Run: npx prisma generate" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "All done! You can now run 'npm run build'" -ForegroundColor Green
