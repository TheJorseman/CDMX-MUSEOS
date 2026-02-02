# 🏛️ Visualizador de Museos CDMX - Guía Completa

## 📋 Características

- **🗺️ Mapa Interactivo**: Visualiza todos los museos en OpenStreetMap
- **🧭 Ruta Óptima**: Algoritmo TSP para minimizar tiempo y distancia
- **📊 Información Detallada**: Acceso a datos de cada museo
- **📱 Panel de Control**: Busca, filtra y selecciona museos
- **⏱️ Cálculos Inteligentes**: Tiempo de traslado, visita y descanso
- **📥 Descarga de Itinerarios**: CSV con plan completo
- **🎫 Generador de PDF**: Pasaporte con sellos y fotos

---

## 🚀 Cómo Usar

### 1. Opción A: Usar CSV con Coordenadas

Si ya ejecutaste `add_coordinates.py`:

1. Abre `visualizador.html` en tu navegador
2. Haz clic en **"Cargar CSV"**
3. Selecciona `museos_cdmx_con_coordenadas.csv`
4. Los museos aparecerán en el mapa

### 2. Opción B: Geocodificación Automática

Si tu CSV no tiene coordenadas:

1. Abre `visualizador.html`
2. Haz clic en **"Cargar CSV"**
3. Selecciona `museos_cdmx.csv`
4. El script geocodificará automáticamente usando Nominatim (OpenStreetMap)
5. ⏳ Espera a que se completen todas las búsquedas

> **Nota**: La geocodificación toma tiempo (aprox. 30-60 segundos para 198 museos)

---

## 📍 Configuración

Haz clic en **"⚙️ Configurar"** para:

### Punto de Inicio
- Ubicación personalizada (latitud, longitud)
- O haz clic en el mapa mientras el modal esté abierto

### Parámetros de Tiempo
- **Tiempo por museo**: 30-300 minutos (default: 90)
- **Tiempo de descanso**: 0-120 minutos (default: 15)

### Transporte
- Automóvil (auto)
- Conducción (driving)
- A pie (walking)

---

## 🧭 Optimizar Ruta

1. Carga los museos desde el CSV
2. (Opcional) Ajusta configuración
3. Haz clic en **"🧭 Optimizar"**
4. El algoritmo calcula la mejor ruta:
   - Usa Nearest Neighbor (TSP aproximado)
   - Calcula distancias reales con OSRM
   - Considera tiempos de visita y descanso

---

## 📊 Información de la Ruta

Después de optimizar, verás:

- **⏱️ Tiempo total**: Incluyendo traslados, visitas y descansos
- **📏 Distancia total**: En kilómetros
- **🏛️ Cantidad de museos**: Total a visitar
- **Detalles por museo**:
  - Tiempo de traslado
  - Duración de visita
  - Distancia desde museo anterior
  - Hora aproximada de llegada
  - Costo de entrada

---

## 💾 Descargar Plan

### Opción 1: Plan en CSV
1. Optimiza una ruta
2. Haz clic en **"📥 Descargar Plan"**
3. Se descarga `plan_visita_museos.csv` con:
   - Paso a paso de cada museo
   - Tiempos y distancias
   - Información de costos
   - Resumen general

### Opción 2: Pasaporte PDF
1. Haz clic en **"🎫 PDF Sellos"**
2. Se abre `generar_pdf.html`
3. Carga el mismo CSV
4. Generador PDF con:
   - Portada personalizada
   - Tarjeta para cada museo
   - Espacios para sellos
   - Áreas para fotos
   - Sección de notas

---

## 📄 Generador de PDF (Pasaporte)

### Características

**Por cada museo incluye:**
- ✓ Nombre oficial
- ✓ Ubicación y dirección
- ✓ Costo de entrada
- ✓ Horarios
- ✓ Teléfono y sitio web

**Espacios para:**
- 🎫 Sello del museo (pega aquí tu sello)
- 📷 Foto de tu visita
- ✏️ Notas personales

**Pasos:**
1. Abre `generar_pdf.html`
2. Carga el CSV
3. Haz clic en **"📄 Generar PDF"**
4. Se descarga `Pasaporte_Museos_CDMX.pdf`

---

## 🗺️ Tecnologías Utilizadas

### Mapas
- **Leaflet.js**: Librería de mapas
- **OpenStreetMap**: Fuente de datos de mapas
- **Nominatim**: Geocodificación

### Rutas
- **OSRM (Open Source Routing Machine)**: Cálculo de rutas reales
- **Haversine**: Fallback para distancia en línea recta

### Generación de Documentos
- **html2pdf.js**: Generador de PDF
- **Papa Parse**: Parser de CSV

---

## ⚙️ APIs Utilizadas

### Nominatim (Geocodificación)
- **URL**: `https://nominatim.openstreetmap.org/`
- **Límite**: 1 request/segundo
- **Costo**: Gratuito (sin API key requerida)

### OSRM (Routing)
- **URL**: `https://router.project-osrm.org/`
- **Límite**: 600 requests/minuto
- **Costo**: Gratuito (público, no requiere autenticación)

### OpenStreetMap Tiles
- **URL**: `https://tile.openstreetmap.org/`
- **Costo**: Gratuito

---

## 📊 Algoritmo TSP (Problema del Viajante)

### Implementación: Nearest Neighbor

```
1. Comenzar en punto de inicio
2. Mientras haya museos sin visitar:
   a. Encontrar museo más cercano
   b. Agregar a la ruta
   c. Calcular tiempo de traslado (OSRM)
   d. Marcar como visitado
   e. Esperar 100ms (rate limit)
```

**Ventajas:**
- ✓ Rápido (O(n²))
- ✓ Buena aproximación
- ✓ Sin configuración compleja

**Limitaciones:**
- No es óptimo global (puede no ser mejor ruta posible)
- Depende del punto de inicio

---

## 🐛 Troubleshooting

### "Nominatim: No encontrados resultados"
**Problema**: Dirección muy vaga
**Solución**: Verifica que el CSV tenga calle, colonia y CP correctos

### "OSRM: Error de conectividad"
**Problema**: Servicio no disponible
**Solución**: Usa distancia Haversine (automático)

### "El mapa no carga"
**Problema**: Conexión de internet o bloqueador
**Solución**: Verifica que OpenStreetMap.org no esté bloqueado

### PDF no se genera
**Problema**: Popup bloqueado o memoria insuficiente
**Solución**: Usa "Imprimir" → PDF en su lugar

### Búsqueda muy lenta
**Problema**: Muchos museos + computadora lenta
**Solución**: Espera o reduce cantidad de museos

---

## 📱 Compatibilidad

✅ **Chrome/Chromium**: Full support
✅ **Firefox**: Full support
✅ **Safari**: Full support (excepto algumas APIs)
✅ **Edge**: Full support
⚠️ **Mobile**: Interfaz adaptable pero óptimo en desktop

---

## 💡 Consejos

1. **Antes de salir:**
   - Descarga el plan en CSV
   - Genera el pasaporte PDF
   - Imprime ambos

2. **En la ruta:**
   - Abre `visualizador.html` en tu móvil
   - Usa la búsqueda para localizar museos
   - Los horarios están disponibles

3. **Optimización:**
   - Cambia el punto de inicio según tu ubicación actual
   - Ajusta tiempo por museo según tus preferencias
   - Experimenta con diferentes transportes

4. **Para maestros/guías:**
   - Personaliza tiempos por museo
   - Crea múltiples rutas (entrada y almuerzo)
   - Descarga planes para grupos

---

## 🔄 Flujo Recomendado

```
1. Cargar CSV
   ↓
2. Explorar museos en mapa
   ↓
3. Configurar punto de inicio
   ↓
4. Optimizar ruta
   ↓
5. Revisar itinerario
   ↓
6. Descargar Plan (CSV)
   ↓
7. Generar Pasaporte (PDF)
   ↓
8. Imprimir y ¡Listo!
```

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que el navegador sea moderno (2022+)
2. Limpia caché del navegador
3. Asegúrate de tener conexión a internet
4. Intenta en otro navegador

---

## 📄 Archivos del Proyecto

```
CDMX-MUSEOS/
├── visualizador.html          # App principal
├── generar_pdf.html           # Generador de PDF
├── js/
│   └── app.js                 # Lógica de la app
├── museos_cdmx.csv            # CSV original (sin coords)
├── museos_cdmx_con_coordenadas.csv  # CSV con coords (generado)
├── add_coordinates.py          # Script de geocodificación
└── README.md                   # Este archivo
```

---

## 🎉 ¡Disfruta tu viaje!

```
Explorar la cultura de la Ciudad de México nunca fue tan fácil.
Con esta herramienta tendrás una ruta optimizada para visitar
todos los museos en el menor tiempo posible.

¡Buen viaje! 🏛️✨
```
