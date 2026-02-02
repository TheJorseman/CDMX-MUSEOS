# 🎉 Solución del Error CORS

## El Problema

Error: `Access to fetch at 'file://...' from origin 'null' has been blocked by CORS policy`

**Causa**: El navegador no permite hacer `fetch()` a archivos locales por razones de seguridad.

---

## ✅ La Solución

Para que la aplicación funcione, **NECESITAS un servidor HTTP local**.

### Opción Recomendada: Script Batch (Más Fácil)

1. **Abre el archivo**: `iniciar_servidor.bat`
2. Se abrirá una ventana de comandos
3. **Abre tu navegador** en: `http://localhost:8000`
4. ¡La app cargará correctamente!

Para detener: Cierra la ventana

---

### Opción 2: Python Direct

1. Abre PowerShell/Terminal en esta carpeta
2. Ejecuta:
   ```powershell
   python servidor.py
   ```
3. Abre: `http://localhost:8000`

---

### Opción 3: PowerShell Script

```powershell
.\iniciar_servidor.ps1
```

---

## 📂 Archivos Creados

| Archivo | Función |
|---------|---------|
| `iniciar_servidor.bat` | Script Windows (doble clic) |
| `iniciar_servidor.ps1` | Script PowerShell |
| `servidor.py` | Servidor Python avanzado |

---

## 🔍 Cómo Funciona

### ❌ **NO HACER**: Abrir HTML directamente
```
C:\...\visualizador.html  ← No funciona (file://)
```

### ✅ **HACER**: Usar servidor local
```
http://localhost:8000  ← Funciona perfectamente
```

El servidor:
- Sirve `visualizador.html` por HTTP
- Carga el CSV sin errores de CORS
- Permite todas las APIs (Leaflet, Nominatim, etc.)

---

## 📊 Flujo Correcto

```
1. Ejecuta servidor
   ↓
2. Abre http://localhost:8000
   ↓
3. App carga automáticamente
   ↓
4. CSV se carga sin errores
   ↓
5. Museos aparecen en el mapa ✓
```

---

## 🐛 Troubleshooting

### "Puerto 8000 en uso"
```powershell
# Otro puerto
python -m http.server 9000
# Luego abre: http://localhost:9000
```

### "Python no encontrado"
- Instala Python desde https://python.org
- Marca "Add Python to PATH"

### "Servidor no responde"
- Verifica que no esté bloqueado por firewall
- Intenta: `http://127.0.0.1:8000`

---

## 🎯 Resumen

**Para que funcione:**
1. ✓ Tener Python instalado
2. ✓ Usar un servidor (batch, PowerShell o Python)
3. ✓ Abrir `http://localhost:8000`
4. ✓ NO abrir archivo HTML directamente

¡Listo! 🏛️✨
