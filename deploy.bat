@echo off
REM Script para desplegar en GitHub Pages desde Windows

echo.
echo ===============================================
echo 🚀 Desplegando a GitHub Pages
echo ===============================================
echo.

REM Verificar que estamos en un repositorio Git
if not exist ".git" (
    echo ❌ Error: No estás en un repositorio Git
    echo Ejecuta: git init
    pause
    exit /b 1
)

REM Verificar archivos necesarios
if not exist "visualizador.html" (
    echo ❌ Error: No encuentra visualizador.html
    pause
    exit /b 1
)

if not exist "museos_cdmx.csv" (
    if not exist "museos_cdmx_con_coordenadas.csv" (
        echo ❌ Error: No encuentra archivo CSV
        pause
        exit /b 1
    )
)

REM Agregar archivos
echo 📦 Preparando archivos...
git add .
git status

REM Commit
echo.
echo 💬 Creando commit...
git commit -m "📍 Despliegue automático en GitHub Pages"

REM Push
echo.
echo 🚀 Enviando a GitHub...
git push origin main

echo.
echo ===============================================
echo ✅ Despliegue completado!
echo ===============================================
echo.
echo Ahora configura GitHub Pages:
echo 1. Ve a Settings del repositorio
echo 2. Selecciona Pages
echo 3. Selecciona 'main' como source
echo 4. Espera 1-2 minutos
echo.
echo Tu sitio estará en:
echo https://TU_USUARIO.github.io/CDMX-MUSEOS
echo.
pause
