Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STRATFIT RELEASE MODE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

function Fail($msg) {
    Write-Host "❌ $msg" -ForegroundColor Red
    exit 1
}

function Step($msg) {
    Write-Host ""
    Write-Host "🔹 $msg" -ForegroundColor Yellow
}

# 1️⃣ Run CI preflight first
Step "Running preflight checks"
./scripts/preflight.ps1
if ($LASTEXITCODE -ne 0) { Fail "Preflight failed — aborting release" }

# 2️⃣ Choose version bump
Write-Host ""
Write-Host "Select version bump:"
Write-Host "1 = patch (0.0.X)"
Write-Host "2 = minor (0.X.0)"
Write-Host "3 = major (X.0.0)"

$choice = Read-Host "Enter 1, 2, or 3"

switch ($choice) {
    "1" { npm version patch }
    "2" { npm version minor }
    "3" { npm version major }
    default { Fail "Invalid choice" }
}

# 3️⃣ Capture version
$version = (git describe --tags)
Write-Host "New version: $version" -ForegroundColor Cyan

# Generate changelog
Step "Generating changelog"
./scripts/generate-changelog.ps1 -version $version

git add CHANGELOG.md
git commit -m "docs: update changelog for $version"

# 4️⃣ Push commit + tag
Step "Pushing version commit"
git push

Step "Pushing tags"
git push --tags

# 5️⃣ Optional deploy trigger
Write-Host ""
$deploy = Read-Host "Trigger Vercel deploy? (y/n)"
if ($deploy -eq "y") {
    Write-Host "Triggering deploy..." -ForegroundColor Yellow
    # Placeholder for Vercel CLI or webhook
    # Example:
    # npx vercel --prod
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🚀 RELEASE COMPLETE — $version" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
