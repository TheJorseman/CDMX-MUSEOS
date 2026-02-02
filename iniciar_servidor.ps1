# Iniciar servidor HTTP local en PowerShell
# Ejecutar: .\iniciar_servidor.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor local..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$port = 8000
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $scriptPath

try {
    Write-Host "✓ Servidor iniciado en: http://localhost:$port" -ForegroundColor Green
    Write-Host "✓ Directorio: $scriptPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Abre tu navegador en: http://localhost:$port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Iniciar servidor
    python -m http.server $port
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Asegúrate de tener Python instalado" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
}
