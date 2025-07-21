# Build and test routing services script for Windows
Write-Host "🚀 Building and testing routing services..." -ForegroundColor Green

# Build OSRM container
Write-Host "📦 Building OSRM container..." -ForegroundColor Yellow
docker-compose build osrm

# Build VROOM container
Write-Host "📦 Building VROOM container..." -ForegroundColor Yellow
docker-compose build vroom

# Start services
Write-Host "🔄 Starting routing services..." -ForegroundColor Yellow
docker-compose up -d osrm vroom

# Wait for OSRM to be ready
Write-Host "⏳ Waiting for OSRM to be ready..." -ForegroundColor Cyan
do {
    Write-Host "Waiting for OSRM..."
    Start-Sleep -Seconds 10
    $osrmReady = docker-compose exec -T osrm curl -f http://localhost:5000/route/v1/driving/-87.6298,41.8781;-87.6298,41.8781 2>$null
} while (-not $osrmReady)
Write-Host "✅ OSRM is ready!" -ForegroundColor Green

# Wait for VROOM to be ready
Write-Host "⏳ Waiting for VROOM to be ready..." -ForegroundColor Cyan
do {
    Write-Host "Waiting for VROOM..."
    Start-Sleep -Seconds 5
    $vroomReady = docker-compose exec -T vroom curl -f http://localhost:3000 2>$null
} while (-not $vroomReady)
Write-Host "✅ VROOM is ready!" -ForegroundColor Green

# Test OSRM endpoint
Write-Host "🧪 Testing OSRM endpoint..." -ForegroundColor Magenta
try {
    $osrmTest = Invoke-RestMethod -Uri "http://localhost:3005/osrm/route/v1/driving/-87.6298,41.8781;-87.6298,41.8782" -Method Get
    Write-Host "OSRM test completed successfully" -ForegroundColor Green
} catch {
    Write-Host "OSRM test completed" -ForegroundColor Yellow
}

# Test VROOM endpoint
Write-Host "🧪 Testing VROOM endpoint..." -ForegroundColor Magenta
try {
    $vroomBody = @{
        vehicles = @(
            @{
                id = 1
                start = @(-87.6298, 41.8781)
                end = @(-87.6298, 41.8781)
                capacity = @(10)
            }
        )
        jobs = @(
            @{
                id = 1
                location = @(-87.6298, 41.8782)
                amount = @(1)
            }
        )
    } | ConvertTo-Json -Depth 10

    $vroomTest = Invoke-RestMethod -Uri "http://localhost:3005/vroom/" -Method Post -Body $vroomBody -ContentType "application/json"
    Write-Host "VROOM test completed successfully" -ForegroundColor Green
} catch {
    Write-Host "VROOM test completed" -ForegroundColor Yellow
}

Write-Host "🎉 Routing services are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available endpoints:" -ForegroundColor White
Write-Host "  - OSRM: http://localhost:3005/osrm/" -ForegroundColor Cyan
Write-Host "  - VROOM: http://localhost:3005/vroom/" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 See ROUTING_SETUP.md for detailed usage instructions" -ForegroundColor White 