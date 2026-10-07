# Deploy backend to MonsterASP via Web Deploy
param(
    [string]$Password = "w?8M=3CbkP!5"
)

Write-Host "Deploying HealthAlert.Api to MonsterASP..." -ForegroundColor Cyan
dotnet publish src/backend/HealthAlert.Api/HealthAlert.Api.csproj -c Release /p:PublishProfile=MonsterASP /p:Password=$Password

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Verifying endpoint http://health-alert-api.runasp.net/api/locations..." -ForegroundColor Cyan
    try {
        $res = Invoke-RestMethod -Uri "http://health-alert-api.runasp.net/api/locations" -Method Get
        Write-Host "API is LIVE and responding! Location count: $($res.Count)" -ForegroundColor Green
    } catch {
        Write-Host "Endpoint response: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "Deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
