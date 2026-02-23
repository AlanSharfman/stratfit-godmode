Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STRATFIT CI PREFLIGHT + PUSH GATE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

function Fail($msg) {
    Write-Host "❌ $msg" -ForegroundColor Red
    exit 1
}

function Step($msg) {
    Write-Host ""
    Write-Host "🔹 $msg" -ForegroundColor Yellow
}

# 1️⃣ Git status
Step "Checking git status"
git status
if ($LASTEXITCODE -ne 0) { Fail "Git status failed" }

# Ensure clean working tree
$changes = git status --porcelain
if ($changes) { Fail "Working tree not clean — commit or stash changes" }

# 2️⃣ Branch check
Step "Checking branch"
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $branch"

if ($branch -eq "main") {
    Write-Host "⚠️ You are pushing to MAIN" -ForegroundColor Yellow
}

# 3️⃣ Fetch remote
Step "Fetching remote"
git fetch

# 4️⃣ TypeScript
Step "TypeScript validation"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Fail "TypeScript errors detected" }

# 5️⃣ Lint (optional)
if (Test-Path package.json) {
    $pkg = Get-Content package.json | ConvertFrom-Json
    if ($pkg.scripts.lint) {
        Step "Running linter"
        npm run lint
        if ($LASTEXITCODE -ne 0) { Fail "Lint failed" }
    }
}

# 6️⃣ Tests (optional)
if ($pkg.scripts.test) {
    Step "Running tests"
    npm test
    if ($LASTEXITCODE -ne 0) { Fail "Tests failed" }
}

# 7️⃣ Build
Step "Production build"
$start = Get-Date
npm run build
if ($LASTEXITCODE -ne 0) { Fail "Build failed" }
$end = Get-Date
Write-Host "Build time: $((($end - $start).TotalSeconds))s" -ForegroundColor Cyan

# 8️⃣ Commit check
Step "Latest commit"
git log -1 --oneline

# 9️⃣ Confirm push
Write-Host ""
$confirm = Read-Host "Push to origin/$branch ? (y/n)"
if ($confirm -ne "y") {
    Fail "Push cancelled"
}

# 🔟 Push
Step "Pushing to remote"
git push

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🚀 PUSH SUCCESSFUL — ALL CHECKS PASSED" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"