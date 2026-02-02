# 📚 GUÍA COMPLETA DE DESPLIEGUE

## 🎯 Objetivo

Publicar la app de museos en internet de forma **gratuita** y **automática**.

---

## 🚀 OPCIÓN RECOMENDADA: GitHub Pages

### ¿Por qué?
- ✅ Gratis
- ✅ Integrado con GitHub
- ✅ HTTPS automático
- ✅ Sin configuración compleja
- ✅ Dominio gratuito: username.github.io

### Pasos (2 minutos)

```bash
# 1. Push a GitHub
git add .
git commit -m "Publicar en GitHub Pages"
git push origin main

# O ejecuta el script
./deploy.bat        # Windows
./deploy.sh         # Linux/Mac
```

```
2. En GitHub → Settings → Pages
3. Selecciona "main" como source
4. ¡Listo! En 1-2 minutos estará en:
   https://TU_USUARIO.github.io/CDMX-MUSEOS/visualizador.html
```

---

## ✨ OTRAS OPCIONES

### Vercel (3 minutos)

```bash
# 1. Conecta en https://vercel.com
# 2. Importa tu repositorio GitHub
# 3. Haz clic en "Deploy"
# 4. Sitio en: https://tu-proyecto.vercel.app
```

**Ventajas:**
- Muy rápido
- Deploy automático en cada push
- Analytics incluido

---

### Netlify (3 minutos)

```bash
# 1. Ve a https://netlify.com
# 2. Haz clic en "New site from Git"
# 3. Selecciona tu repositorio
# 4. Deploy automático
# Sitio en: https://tu-sitio.netlify.app
```

**Ventajas:**
- Interfaz muy amigable
- Funciones serverless (gratis)
- Form handling

---

### Render (5 minutos)

```bash
# 1. Ve a https://render.com
# 2. Create → Static Site
# 3. Conecta GitHub
# 4. Deploy
# Sitio en: https://tu-sitio.onrender.com
```

**Ventajas:**
- Gratis con buena reputación
- Buen soporte
- Dashboard completo

---

## 📋 CHECKLIST PRE-DESPLIEGUE

- [ ] Archivos principales presentes:
  - [ ] visualizador.html
  - [ ] generar_pdf.html
  - [ ] js/app.js
  - [ ] museos_cdmx_con_coordenadas.csv

- [ ] Todo está en Git:
  - [ ] git add .
  - [ ] git commit
  - [ ] git push

- [ ] Plataforma configurada:
  - [ ] GitHub Pages habilitado
  - [ ] Rama main seleccionada

- [ ] DNS actualizado (si dominio personalizado)

---

## 🔍 VERIFICACIÓN POST-DESPLIEGUE

```bash
# 1. Abre tu sitio
https://TU_USUARIO.github.io/CDMX-MUSEOS/visualizador.html

# 2. Verifica que funcione:
✅ Página carga correctamente
✅ Mapa aparece
✅ Museos se cargan automáticamente
✅ Puedes hacer clic en museos
✅ Botón "Optimizar Ruta" funciona
✅ Se dibuja el grafo en el mapa
✅ Descargas funcionan (CSV)
✅ Generador de PDF se abre
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Página blanca o sin cargar"
```
1. Espera 2 minutos (GitHub tarda)
2. Recarga: Ctrl+R
3. Abre en navegador privado: Ctrl+Shift+P
4. Borra caché: Ctrl+Shift+Del
5. F12 → Console para ver errores
```

### "CSV no carga"
```
1. Verifica que CSV esté en raíz del proyecto
2. Nombre debe ser exacto: museos_cdmx_con_coordenadas.csv
3. Recarga la página
4. Sube nuevamente a GitHub
```

### "Mapa no aparece"
```
1. Verifica conexión a internet
2. OpenStreetMap debe estar accesible
3. Abre https://www.openstreetmap.org
4. Si no carga, es problema de internet
```

### "Estilo roto o desalineado"
```
1. Verifica que archivos CSS estén en la raíz
2. Todas las rutas deben ser relativas
3. NO usar C:\ruta\archivo
4. Usar /archivo.css o ./archivo.css
```

### "Error 404 en GitHub Pages"
```
1. Verifica que rama sea 'main'
2. Verifica carpeta sea '(root)'
3. Espera 2-3 minutos
4. Refresca después de esperar
```

---

## 📊 COMPARATIVA FINAL

| Aspecto | GitHub Pages | Vercel | Netlify | Render |
|---------|---|---|---|---|
| Setup | ⭐ (más fácil) | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Velocidad | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Gratuito | ✅ | ✅ | ✅ | ✅ |
| Dominio | github.io | vercel.app | netlify.app | onrender.com |
| HTTPS | ✅ | ✅ | ✅ | ✅ |
| Deploy Auto | ✅ | ✅ | ✅ | ✅ |

---

## 🎁 BONUS: Dominio Personalizado

Cualquier plataforma permite agregar un dominio personalizado:

```
1. Compra un dominio en:
   - GoDaddy
   - Namecheap
   - Google Domains
   
2. En plataforma: Add Custom Domain
   
3. Actualiza DNS records:
   - CNAME o A records
   - Sigue instrucciones de la plataforma

4. Espera 24-48 horas para propagación

5. ¡Tu sitio en: https://tu-dominio.com!
```

---

## ✅ RESUMEN

```
LOCAL:
http://localhost:8000/visualizador.html

ONLINE (GitHub Pages):
https://USERNAME.github.io/CDMX-MUSEOS/visualizador.html

ONLINE (Vercel):
https://tu-proyecto.vercel.app/visualizador.html

ONLINE (Netlify):
https://tu-sitio.netlify.app/visualizador.html
```

---

## 🎉 ¡HECHO!

Tu app está online y accesible desde cualquier lugar del mundo.

**Comparte el link con tus amigos y disfruta! 🏛️✨**

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Revisa los logs de GitHub Actions
3. Busca el error específico en Google
4. Abre un Issue en tu repositorio

---

## 📚 REFERENCIAS

- GitHub Pages Docs: https://pages.github.com
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs
