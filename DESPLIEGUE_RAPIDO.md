# 🌐 Despliegue en Plataformas Gratuitas

## ⚡ 3 Minutos para Publicar

### ✅ Opción 1: GitHub Pages (RECOMENDADO)

```bash
# 1. Push a tu repositorio
git add .
git commit -m "Publicar en GitHub Pages"
git push origin main

# 2. Ve a Settings → Pages
# 3. Selecciona: main / (root)
# 4. ¡Listo! En 1 minuto estará en:
# https://TU_USUARIO.github.io/CDMX-MUSEOS
```

### ✅ Opción 2: Vercel

```bash
# 1. Instala Vercel CLI (opcional)
npm i -g vercel

# 2. Deploy
vercel

# 3. Sigue las instrucciones
# Tu sitio estará en: https://tu-proyecto.vercel.app
```

### ✅ Opción 3: Netlify

```bash
# 1. Conecta tu repositorio GitHub
# https://netlify.com → New site from Git

# 2. Selecciona tu repo
# 3. Deploy automático

# Tu sitio estará en: https://tu-sitio.netlify.app
```

---

## 🎯 ¿Cuál Elegir?

| Característica | GitHub Pages | Vercel | Netlify |
|---|---|---|---|
| Más Fácil | ✅ (todo GitHub) | ⭕ | ⭕ |
| Dominio Gratis | github.io | vercel.app | netlify.app |
| Velocidad | Rápida | Muy rápida | Rápida |
| Builds | N/A | Sí | Sí |
| Serverless | No | Sí | Sí |

---

## 📋 Características Soportadas

✅ Carga automática de CSV
✅ Mapa interactivo (OpenStreetMap)
✅ Ruta optimizada (algoritmo TSP)
✅ Descargas (CSV, PDF)
✅ Responsive design
✅ Funciona offline (después de cargar)

---

## 🔗 URL Final

Después de desplegar:

```
GitHub Pages:
https://TU_USUARIO.github.io/CDMX-MUSEOS/visualizador.html

Vercel:
https://tu-proyecto.vercel.app/visualizador.html

Netlify:
https://tu-sitio.netlify.app/visualizador.html
```

---

## ✨ Lo que se Publica

```
Tu Sitio Web/
├── visualizador.html       ← App principal
├── generar_pdf.html        ← Generador de PDF
├── js/
│   ├── app.js              ← Lógica principal
│   └── config.js           ← Configuración
├── museos_cdmx_con_coordenadas.csv  ← Datos
├── museos_cdmx.csv
└── README.md
```

---

## 🐛 Si Algo Falla

### CSV no carga
- Verifica que `museos_cdmx_con_coordenadas.csv` esté en la raíz
- Recarga la página (Ctrl+R)
- Abre consola (F12) para ver errores

### Página blanca
- Espera 2 minutos (GitHub Pages tarda)
- Borra caché (Ctrl+Shift+Del)
- Abre URL en privado (Ctrl+Shift+P)

### Mapa no aparece
- Verifica conexión a internet
- OpenStreetMap debe estar accesible

---

## 📚 Documentación Completa

Ver [DESPLIEGUE_GITHUB_PAGES.md](DESPLIEGUE_GITHUB_PAGES.md) para:
- Instrucciones paso a paso
- Solución de problemas
- Configuración avanzada
- Dominio personalizado

---

## 🚀 ¡Tu App está Lista!

```
Local: http://localhost:8000
Online: https://TU_USUARIO.github.io/CDMX-MUSEOS
```

¡Comparte el link! 🏛️✨
