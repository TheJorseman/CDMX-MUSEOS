# 🚀 INICIO RÁPIDO

## Opción 1: Usar el Script Batch (Windows)

1. **Abre el archivo `iniciar_servidor.bat`** (doble clic)
2. Se abrirá una ventana de comandos
3. **Abre tu navegador** en: `http://localhost:8000`
4. ¡Listo! El visualizador cargará automáticamente

Para detener: Cierra la ventana de comandos o presiona `Ctrl+C`

---

## Opción 2: Usar Python directamente

1. Abre Terminal/PowerShell en esta carpeta
2. Ejecuta:
   ```
   python servidor.py
   ```
3. Abre tu navegador en: `http://localhost:8000`

---

## Opción 3: Usar Node.js

Si tienes Node.js instalado:
```
npx http-server -c-1 -p 8000
```

---

## Opción 4: Usar Python (alternativa)

```
python -m http.server 8000
```

---

## ⚠️ IMPORTANTE

**NO abras el archivo HTML directamente haciendo doble clic.**

Eso causa error CORS (Cross-Origin) porque el navegador no permite cargar archivos locales.

**SIEMPRE abre mediante un servidor local:**
- `http://localhost:8000` ✅ Correcto
- `file:///C:/Users/...` ❌ No funciona

---

## 🔍 ¿Qué hace el servidor?

- Sirve los archivos HTML, CSS, JS
- Permite cargar el CSV sin problemas de CORS
- Acceso desde `http://localhost:8000`
- Port 8000 (configurable)

---

## 💡 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Puerto 8000 en uso" | Usa otro puerto: `python servidor.py -p 9000` |
| "Python no encontrado" | Instala Python desde python.org |
| "Página blanca" | Recarga el navegador (Ctrl+R) |
| "CSV no carga" | Verifica que el archivo CSV esté en la carpeta |

---

¡Disfruta! 🏛️✨
