@echo off
REM Iniciar servidor HTTP local en el puerto 8000
echo.
echo ========================================
echo Iniciando servidor local en puerto 8000
echo ========================================
echo.
echo Abre tu navegador en: http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python -m http.server 8000

pause
