param (
    [string]$version
)

Write-Host ""
Write-Host "Generating changelog for $version" -ForegroundColor Cyan

$date = Get-Date -Format "yyyy-MM-dd"
$header = "## $version — $date"

$commits = git log --pretty=format:"- %s" HEAD~20..HEAD

$content = "$header`n`n$commits`n"

if (!(Test-Path CHANGELOG.md)) {
    New-Item CHANGELOG.md -ItemType File | Out-Null
}

$content + (Get-Content CHANGELOG.md -Raw) | Set-Content CHANGELOG.md

Write-Host "CHANGELOG updated" -ForegroundColor Green
