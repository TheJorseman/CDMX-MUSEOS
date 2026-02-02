# 🚀 Despliegue en GitHub Pages

## 1️⃣ Opción Más Fácil: GitHub Pages (GRATIS)

### Paso 1: Preparar el Repositorio

Asegúrate de que tu repositorio tenga:
```
CDMX-MUSEOS/
├── visualizador.html
├── generar_pdf.html
├── js/app.js
├── museos_cdmx_con_coordenadas.csv
├── museos_cdmx.csv
├── servidor.py
├── README.md
└── ...
```

### Paso 2: Habilitar GitHub Pages

1. Ve a **Settings** del repositorio
2. En el menú izquierdo: **Pages**
3. En "Source" selecciona: **main** (o tu rama)
4. Carpeta: **/root**
5. Haz clic en **Save**

### Paso 3: Esperar Despliegue

- GitHub Pages tardará 1-2 minutos
- Tu sitio estará en: `https://TU_USUARIO.github.io/CDMX-MUSEOS`

### Paso 4: Acceder

Abre en tu navegador:
```
https://TU_USUARIO.github.io/CDMX-MUSEOS/visualizador.html
```

---

## 2️⃣ Alternativa: Vercel (GRATIS)

### Paso 1: Registrarse
- Ve a https://vercel.com
- Haz clic en "Sign Up"
- Conecta tu cuenta de GitHub

### Paso 2: Importar Proyecto
1. Haz clic en "New Project"
2. Selecciona tu repositorio `CDMX-MUSEOS`
3. Haz clic en "Import"
4. Vercel detectará automáticamente la configuración
5. Haz clic en "Deploy"

### Paso 3: Acceder
Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 3️⃣ Alternativa: Netlify (GRATIS)

### Paso 1: Registrarse
- Ve a https://netlify.com
- Haz clic en "Sign up"
- Conecta GitHub

### Paso 2: Nuevo Sitio
1. Haz clic en "New site from Git"
2. Selecciona tu repositorio
3. Mantén la configuración por defecto
4. Haz clic en "Deploy"

### Paso 3: Acceder
Tu app estará disponible en: `https://tu-sitio.netlify.app`

---

## 4️⃣ Alternativa: Render (GRATIS)

### Paso 1: Crear Servidor
1. Ve a https://render.com
2. Haz clic en "New +"
3. Selecciona "Static Site"
4. Conecta tu repositorio GitHub
5. Llena los campos:
   - **Name**: cdmx-museos
   - **Build Command**: (dejar vacío)
   - **Publish directory**: . (punto)

### Paso 2: Deploy
Haz clic en "Create Static Site"

Tu app estará en: `https://tu-sitio.onrender.com`

---

## 📋 Comparativa

| Plataforma | Tiempo | Facilidad | Personalización |
|-----------|--------|-----------|-----------------|
| GitHub Pages | 1-2 min | ⭐⭐⭐⭐⭐ | Limitada |
| Vercel | < 1 min | ⭐⭐⭐⭐⭐ | Excelente |
| Netlify | 1-2 min | ⭐⭐⭐⭐ | Muy buena |
| Render | 2-5 min | ⭐⭐⭐ | Buena |

---

## ✅ Verificación Post-Despliegue

1. Abre `https://tu-sitio.com/visualizador.html`
2. Verifica que los museos aparezcan en el mapa
3. Prueba la carga automática del CSV
4. Haz clic en "Optimizar Ruta"
5. Descarga el plan en CSV

---

## 🔧 Configuración Específica

### GitHub Pages con Carpeta Personalizada

Si quieres que esté en `/` en lugar de `/CDMX-MUSEOS`:

1. Renombra tu rama a `gh-pages`
2. En Settings → Pages: selecciona `gh-pages`
3. Tu sitio estará en: `https://TU_USUARIO.github.io`

### Dominio Personalizado

Cualquier plataforma permite agregar un dominio personalizado:

1. Compra un dominio (GoDaddy, Namecheap, etc.)
2. En configuración de la plataforma: agrega dominio
3. Configura los DNS records
4. ¡Listo!

---

## 🐛 Troubleshooting

### "CSV no carga en GitHub Pages"
- Asegúrate que `museos_cdmx_con_coordenadas.csv` esté en la raíz
- Haz commit y push nuevamente
- Borra el caché del navegador (Ctrl+Shift+Del)

### "Estilo se ve roto"
- Verifica que las rutas de archivos sean relativas
- Usa `/archivo.css` en lugar de `C:\ruta\archivo.css`

### "JavaScript no funciona"
- Revisa la consola del navegador (F12 → Console)
- Busca errores de rutas o CORS

### "Página blanca"
- Recarga (Ctrl+R)
- Verifica que `visualizador.html` esté en la raíz
- Revisa que los scripts estén en `js/app.js`

---

## 📝 Checklist de Despliegue

- [ ] Todo está en Git
- [ ] CSV está en la raíz del proyecto
- [ ] Rutas de archivos son relativas
- [ ] Plataforma está configurada
- [ ] DNS está apuntando (si dominio personalizado)
- [ ] HTTPS está habilitado
- [ ] App carga correctamente
- [ ] CSV se autocarga
- [ ] Mapa funciona
- [ ] Rutas se optimizan

---

## 🎉 ¡Listo!

Tu app de museos está online y accesible desde cualquier lugar del mundo. ¡Comparte el link con tus amigos! 🏛️✨

---

## Copiar Link

```
GitHub Pages:
https://TU_USUARIO.github.io/CDMX-MUSEOS/visualizador.html

Vercel:
https://tu-proyecto.vercel.app

Netlify:
https://tu-sitio.netlify.app

Render:
https://tu-sitio.onrender.com
```
