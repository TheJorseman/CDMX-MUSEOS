#!/bin/bash
# Script para desplegar automáticamente en GitHub Pages

echo "🚀 Desplegando a GitHub Pages..."
echo ""

# Verificar que estamos en un repositorio Git
if [ ! -d ".git" ]; then
    echo "❌ Error: No estás en un repositorio Git"
    echo "Ejecuta: git init"
    exit 1
fi

# Verificar archivos necesarios
if [ ! -f "visualizador.html" ]; then
    echo "❌ Error: No encuentra visualizador.html"
    exit 1
fi

if [ ! -f "museos_cdmx.csv" ] && [ ! -f "museos_cdmx_con_coordenadas.csv" ]; then
    echo "❌ Error: No encuentra archivo CSV"
    exit 1
fi

# Agregar archivos
echo "📦 Preparando archivos..."
git add .
git status

# Commit
echo ""
echo "💬 Commit:"
git commit -m "📍 Despliegue automático en GitHub Pages"

# Push
echo ""
echo "🚀 Push a GitHub..."
git push origin main

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "Ahora configura GitHub Pages:"
echo "1. Ve a Settings del repositorio"
echo "2. Selecciona Pages"
echo "3. Selecciona 'main' como source"
echo "4. Espera 1-2 minutos"
echo ""
echo "Tu sitio estará en:"
echo "https://TU_USUARIO.github.io/CDMX-MUSEOS"
