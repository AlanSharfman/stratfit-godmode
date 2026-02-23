Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STRATFIT PREFLIGHT CHECK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-Host "`n1️⃣ Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`n2️⃣ Checking unstaged changes..." -ForegroundColor Yellow
git diff

Write-Host "`n3️⃣ Checking staged changes..." -ForegroundColor Yellow
git diff --staged

Write-Host "`n4️⃣ Fetching latest remote..." -ForegroundColor Yellow
git fetch

Write-Host "`n5️⃣ Branch tracking info..." -ForegroundColor Yellow
git branch -vv

Write-Host "`n6️⃣ TypeScript check..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors detected" -ForegroundColor Red
    exit 1
}

Write-Host "`n7️⃣ Running build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n8️⃣ Latest commit..." -ForegroundColor Yellow
git log -1 --oneline

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ PREFLIGHT PASSED — SAFE TO PUSH" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"