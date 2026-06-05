# Render deployment script
$apiKey = 'rnd_JljznP2OiN2In556weQXXmkT3MIM'
$headers = @{ Authorization = "Bearer $apiKey" }

$ownerId = 'tea-d8h843b7uimc73cml4a0'

$payload = @{

    type = 'web_service'
    name = 'ai-gym'
    ownerId = $ownerId
    repo = 'https://github.com/nijjukrr/-AI-Gym-Fitness-Assistant.git'
    branch = 'main'
    autoDeploy = 'yes'
    serviceDetails = @{
    env = 'python'
    runtime = 'python'
    envSpecificDetails = @{
        webServiceDetails = @{
            buildCommand = 'pip install -r requirements.txt'
            startCommand = 'uvicorn server:app --host 0.0.0.0 --port $PORT'
        }
    }
}
    envVars = @(
        @{ key = 'MONGODB_URI'; value = '' }
        @{ key = 'OPENAI_API_KEY'; value = '' }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Payload JSON:"
Write-Host $payload

try {
    $response = Invoke-RestMethod -Method POST -Uri 'https://api.render.com/v1/services' -Headers $headers -ContentType 'application/json' -Body $payload
    Write-Host "✅ Service created successfully!"
    Write-Host "Service ID: $($response.id)"
    Write-Host "URL: $($response.serviceDetails.webService.url)"
} catch {
    Write-Error "❌ Deployment failed: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Error response: $errorResponse"
    }
}
