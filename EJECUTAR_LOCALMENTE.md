# ▶️ Ejecutar CDMX Museos Localmente

## Opción 1: Python (⭐ Recomendado - Más Simple)

### Windows
1. Abre PowerShell/CMD en la carpeta del proyecto
2. Ejecuta:
```powershell
python -m http.server 8000
```

### Mac/Linux
```bash
python3 -m http.server 8000
```

3. Abre en el navegador:
```
http://localhost:8000/visualizador.html
```

---

## Opción 2: Node.js (si tienes npm instalado)

```bash
npx http-server -p 8000
```

Luego abre:
```
http://localhost:8000/visualizador.html
```

---

## Opción 3: Usar el script Python incluido

```powershell
python servidor.py
```

Luego abre:
```
http://localhost:8000/visualizador.html
```

---

## ✅ Si todo funciona, deberías ver:
- Mapa con OpenStreetMap
- 198 museos marcados en azul
- Búsqueda y filtros funcionando
- Ruta óptima calculándose
- Punto rojo de inicio visible

---

## 🔧 Solución de Problemas

### "Error al cargar CSV"
- ✓ Verifica que `museos_cdmx_con_coordenadas.csv` esté en la raíz
- ✓ Asegúrate de usar `http://localhost` (no `file://`)
- ✓ Recarga la página (Ctrl+F5)

### "Puerto 8000 ya está en uso"
Usa otro puerto:
```powershell
python -m http.server 3000
# http://localhost:3000/visualizador.html
```

### "Python no reconocido"
Descarga desde: https://www.python.org/downloads/
(Marca "Add Python to PATH" durante instalación)

---

## 📍 Para GitHub Pages (después de pushear)

```bash
git add .
git commit -m "Fix CSV loading for GitHub Pages"
git push
```

Espera 2 minutos. Accede a:
```
https://thejorseman.github.io/CDMX-MUSEOS/visualizador.html
```

✨ **¡Listo!** La app funcionará correctamente.
