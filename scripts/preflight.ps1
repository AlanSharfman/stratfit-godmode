Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STRATFIT ENGINEERING PREFLIGHT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# helper
function Step($msg) {
    Write-Host ""
    Write-Host "🔹 $msg" -ForegroundColor Yellow
}

# 1️⃣ Git Status
Step "Checking git status"
git status

# 2️⃣ Diffs
Step "Checking unstaged changes"
git diff

Step "Checking staged changes"
git diff --staged

# 3️⃣ Remote Sync
Step "Fetching latest remote"
git fetch

Step "Branch tracking"
git branch -vv

# 4️⃣ TypeScript
Step "TypeScript validation"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors detected" -ForegroundColor Red
    exit 1
}

# 5️⃣ Lint (only if script exists)
if (Test-Path package.json) {
    $pkg = Get-Content package.json | ConvertFrom-Json
    if ($pkg.scripts.lint) {
        Step "Running linter"
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Lint errors detected" -ForegroundColor Red
            exit 1
        }
    }
}

# 6️⃣ Tests (optional)
if (Test-Path package.json) {
    if ($pkg.scripts.test) {
        Step "Running tests"
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Tests failed" -ForegroundColor Red
            exit 1
        }
    }
}

# 7️⃣ Build timing
Step "Running production build"
$start = Get-Date
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
$end = Get-Date
$duration = $end - $start
Write-Host "Build time: $($duration.TotalSeconds) seconds" -ForegroundColor Cyan

# 8️⃣ Commit hygiene
Step "Checking latest commit message"
$commitMsg = git log -1 --pretty=%B
Write-Host "Latest commit: $commitMsg"

# 9️⃣ Final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ PREFLIGHT PASSED — SAFE TO PUSH" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green