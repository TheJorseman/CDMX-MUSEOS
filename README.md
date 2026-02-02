# 🏛️ Museos CDMX Explorer | City Museum Navigator

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-2.0-orange)
![Visitors](https://img.shields.io/badge/demo-live-success)

---

## 🇪🇸 Español

### Descripción del Proyecto

**Museos CDMX Explorer** es una aplicación web interactiva que te ayuda a planificar rutas óptimas para visitar museos en Ciudad de México. Utiliza algoritmos de optimización de ruta (TSP - Traveling Salesman Problem) para calcular el camino más eficiente entre los museos seleccionados, ahorrándote tiempo y dinero en transporte.

Con más de **198 museos** categorizados (Historia, Arte, Ciencia, Antropología, Literatura y Otros), la aplicación te permite:
- 🗺️ **Explorar museos en mapa interactivo** con Leaflet.js y OpenStreetMap
- 🔍 **Filtrar por categoría** cultural o buscar por nombre
- ✅ **Seleccionar museos** específicos que desees visitar
- 🎯 **Optimizar ruta** automáticamente minimizando distancia/tiempo
- 📱 **Ver ruta en tiempo real** con polylines y marcadores numerados
- 📥 **Exportar plan** en PDF o CSV
- 🖱️ **Drag & drop** para mover el punto de inicio

### 🚀 Acceso Directo

**Ingresa a la aplicación:** https://thejorseman.github.io/CDMX-MUSEOS/visualizador.html

**Nota:** No requiere instalación. Funciona directamente en el navegador.

### ✨ Características Principales

| Característica | Descripción |
|---|---|
| 🗂️ **198 Museos** | Base de datos completa con horarios, costos y ubicación |
| 🎨 **6 Categorías** | Filtrar por Historia, Arte, Ciencia, Antropología, Literatura |
| 📍 **Mapa Interactivo** | Zoom, pan, y visualización de puntos de interés |
| 🎯 **Selección Múltiple** | Elige exactamente qué museos deseas visitar |
| ⚡ **Optimización TSP** | Calcula ruta mínima en segundos |
| 📊 **Ruta Detallada** | Duración, distancia, y orden de visita |
| 🖼️ **Visualización Clara** | Marcadores numerados, polylines de ruta |
| 📥 **Exportar Plan** | PDF y CSV con información de la ruta |
| 🎨 **Interfaz Moderna** | Responsive, animations fluidas, emojis |
| 🌐 **Sin Backend** | 100% cliente (no requiere servidor) |

### 📖 Cómo Explorar el Proyecto

#### Paso 1: Cargar Museos
1. Haz clic en **"Cargar CSV"** en el sidebar
2. Selecciona `museos_cdmx_con_categorias.csv`
3. Verás una barra de progreso mientras se cargan los datos
4. Los 198 museos aparecerán en la lista

#### Paso 2: Filtrar Museos
- **Por categoría:** Marca las categorías que te interesan
- **Por búsqueda:** Usa la barra de búsqueda (nombre o colonia)
- Los museos se filtran en tiempo real

#### Paso 3: Seleccionar Museos
- Marca los checkboxes de los museos que deseas visitar
- Mínimo 2 museos requeridos para optimizar ruta
- Los museos desseleccionados desaparecen del mapa

#### Paso 4: Optimizar Ruta
1. Haz clic en **"Optimizar Ruta"**
2. Verás una barra de progreso (25% - 100%)
3. La aplicación calcula la ruta más eficiente
4. Resultado muestra: Tiempo total, Distancia, Orden de visita

#### Paso 5: Visualizar en Mapa
- La ruta aparece con:
  - 🔴 Marcadores numerados (Punto de inicio → 1 → 2 → ...)
  - 🟠 Línea de polyline naranja conectando museos
  - 📝 Haz clic en cada marcador para detalles

#### Paso 6: Descargar Plan
- **Formato PDF:** Haz clic en "Descargar Plan Óptimo" (con screenshot de ruta)
- **Formato CSV:** Haz clic en "Descargar Plan (CSV)" (datos tabulares)

### 🔧 Instalación para Desarrollo Local

#### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (opcional, solo para utilidades)
- Git

#### Opción 1: Servidor Local Simple
```bash
# Clonar repositorio
git clone https://github.com/thejorseman/CDMX-MUSEOS.git
cd CDMX-MUSEOS

# Iniciar servidor (PowerShell en Windows)
powershell -ExecutionPolicy Bypass -File iniciar_servidor.ps1

# O en macOS/Linux
bash iniciar_servidor.sh

# Acceder a la aplicación
# Abre: http://localhost:8000/visualizador.html
```

#### Opción 2: Python Built-in
```bash
# Python 3.9+
python -m http.server 8000

# Python 2 (no recomendado)
python -m SimpleHTTPServer 8000
```

#### Opción 3: Node.js (http-server)
```bash
npm install -g http-server
http-server . -p 8000
```

Luego abre: `http://localhost:8000/visualizador.html`

### 📁 Estructura del Proyecto

```
CDMX-MUSEOS/
├── visualizador.html              # Aplicación principal
├── museos_cdmx_con_categorias.csv # Base de datos (198 museos)
├── README.md                      # Este archivo
├── ARQUITECTURA_TECNICA.md        # Documentación técnica
├── LICENSE                        # MIT License
│
├── js/
│   ├── app.js                     # Lógica principal (1544 líneas)
│   └── config.js                  # Configuración de ambiente
│
├── css/
│   └── animations.css             # Estilos y animations
│
└── python_utils/                  # Utilidades Python
    ├── add_coordinates.py         # Geocodificación
    ├── add_categories.py          # Clasificación de museos
    ├── download_data.py           # Descargar datos de APIs
    └── README.md                  # Instrucciones Python
```

### 📊 Estadísticas de Museos

**Total: 198 Museos en CDMX**

| Categoría | Cantidad | Porcentaje |
|-----------|----------|-----------|
| Otro | 67 | 33.8% |
| Historia | 61 | 30.8% |
| Arte | 48 | 24.2% |
| Ciencia | 14 | 7.1% |
| Antropología | 4 | 2.0% |
| Literatura | 2 | 1.0% |

### 🎯 Algoritmo de Optimización

**Tipo:** Traveling Salesman Problem (TSP) - Nearest Neighbor
**Tiempo:** O(n²)
**Aproximación:** ~125% del óptimo teórico
**Tiempo Real:** < 30 segundos para 50 museos

Ver [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) para detalles completos.

### 🌐 APIs Utilizadas

- **Nominatim** (OpenStreetMap): Geocodificación de direcciones
- **OSRM**: Cálculo de rutas y distancias reales
- **OpenStreetMap**: Tiles del mapa base

### 📸 Capturas de Pantalla

**Vista Principal - Mapa con Museos:**
```
[Mapa interactivo mostrando 198 museos como marcadores]
[Sidebar izquierdo con lista de museos y filtros]
[Tab "Museos" activo con búsqueda y categorías]
```

**Vista de Ruta Optimizada:**
```
[Mapa mostrando polyline naranja conectando museos]
[Marcadores numerados: Inicio (🔴) → 1 (🔴) → 2 (🔴) ...]
[Tab "Ruta" mostrando cada paso con duración y distancia]
```

### ⚙️ Configuración

Ver archivo `.env.example` para variables de ambiente disponibles.

```env
# Ambiente (producción o desarrollo)
ENVIRONMENT=production

# URLs de APIs (generalmente mantenidas por defecto)
NOMINATIM_API=https://nominatim.openstreetmap.org/search
OSRM_API=https://router.project-osrm.org/route/v1/driving
```

### 🚀 Despliegue

La aplicación está optimizada para GitHub Pages, Vercel y Netlify.

**GitHub Pages (Actual):**
- Branch: `main` o `gh-pages`
- URL: https://thejorseman.github.io/CDMX-MUSEOS/visualizador.html

Ver [python_utils/README.md](python_utils/README.md) para instrucciones de despliegue.

### 📝 Licencia

MIT License - Ver archivo [LICENSE](LICENSE) para detalles completos.

### 🤝 Contribuciones

Las contribuciones son bienvenidas:
1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/AmazingFeature`
3. Commit los cambios: `git commit -m 'Add AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

### 📞 Soporte

Para reportar bugs o sugerencias:
1. Abre un issue en GitHub
2. Incluye descripción del problema
3. Adjunta screenshot si es relevante

---

## 🇬🇧 English

### Project Description

**Museos CDMX Explorer** is an interactive web application that helps you plan optimal routes for visiting museums in Mexico City. It uses route optimization algorithms (TSP - Traveling Salesman Problem) to calculate the most efficient path among selected museums, saving you time and transportation costs.

With more than **198 categorized museums** (History, Art, Science, Anthropology, Literature and Others), the application allows you to:
- 🗺️ **Explore museums on interactive map** with Leaflet.js and OpenStreetMap
- 🔍 **Filter by cultural category** or search by name
- ✅ **Select specific museums** you want to visit
- 🎯 **Auto-optimize route** minimizing distance/time
- 📱 **View route in real-time** with polylines and numbered markers
- 📥 **Export plan** in PDF or CSV
- 🖱️ **Drag & drop** to move starting point

### 🚀 Direct Access

**Go to the application:** https://thejorseman.github.io/CDMX-MUSEOS/visualizador.html

**Note:** No installation required. Works directly in your browser.

### ✨ Key Features

| Feature | Description |
|---|---|
| 🗂️ **198 Museums** | Complete database with hours, costs and location |
| 🎨 **6 Categories** | Filter by History, Art, Science, Anthropology, Literature |
| 📍 **Interactive Map** | Zoom, pan, and points of interest visualization |
| 🎯 **Multiple Selection** | Choose exactly which museums you want to visit |
| ⚡ **TSP Optimization** | Calculates minimum route in seconds |
| 📊 **Detailed Route** | Duration, distance, and visit order |
| 🖼️ **Clear Visualization** | Numbered markers, route polylines |
| 📥 **Export Plan** | PDF and CSV with route information |
| 🎨 **Modern Interface** | Responsive, smooth animations, emojis |
| 🌐 **No Backend** | 100% client-side (no server required) |

### 📖 How to Explore the Project

#### Step 1: Load Museums
1. Click **"Load CSV"** in the sidebar
2. Select `museos_cdmx_con_categorias.csv`
3. You'll see a progress bar while data loads
4. All 198 museums will appear in the list

#### Step 2: Filter Museums
- **By category:** Check the categories you're interested in
- **By search:** Use the search bar (name or neighborhood)
- Museums filter in real-time

#### Step 3: Select Museums
- Check the checkboxes of museums you want to visit
- Minimum 2 museums required to optimize route
- Unselected museums disappear from the map

#### Step 4: Optimize Route
1. Click **"Optimize Route"**
2. You'll see a progress bar (25% - 100%)
3. The application calculates the most efficient route
4. Result shows: Total time, Distance, Visit order

#### Step 5: Visualize on Map
- The route appears with:
  - 🔴 Numbered markers (Start point → 1 → 2 → ...)
  - 🟠 Orange polyline connecting museums
  - 📝 Click each marker for details

#### Step 6: Download Plan
- **PDF Format:** Click "Download Optimal Plan" (with route screenshot)
- **CSV Format:** Click "Download Plan (CSV)" (tabular data)

### 🔧 Installation for Local Development

#### Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (optional, only for utilities)
- Git

#### Option 1: Simple Local Server
```bash
# Clone repository
git clone https://github.com/thejorseman/CDMX-MUSEOS.git
cd CDMX-MUSEOS

# Start server (PowerShell on Windows)
powershell -ExecutionPolicy Bypass -File iniciar_servidor.ps1

# Or on macOS/Linux
bash iniciar_servidor.sh

# Access the application
# Open: http://localhost:8000/visualizador.html
```

#### Option 2: Python Built-in
```bash
# Python 3.9+
python -m http.server 8000

# Python 2 (not recommended)
python -m SimpleHTTPServer 8000
```

#### Option 3: Node.js (http-server)
```bash
npm install -g http-server
http-server . -p 8000
```

Then open: `http://localhost:8000/visualizador.html`

### 📁 Project Structure

```
CDMX-MUSEOS/
├── visualizador.html              # Main application
├── museos_cdmx_con_categorias.csv # Database (198 museums)
├── README.md                      # This file
├── ARQUITECTURA_TECNICA.md        # Technical documentation
├── LICENSE                        # MIT License
│
├── js/
│   ├── app.js                     # Main logic (1544 lines)
│   └── config.js                  # Environment configuration
│
├── css/
│   └── animations.css             # Styles and animations
│
└── python_utils/                  # Python utilities
    ├── add_coordinates.py         # Geocoding
    ├── add_categories.py          # Museum classification
    ├── download_data.py           # Download data from APIs
    └── README.md                  # Python instructions
```

### 📊 Museum Statistics

**Total: 198 Museums in CDMX**

| Category | Quantity | Percentage |
|----------|----------|-----------|
| Other | 67 | 33.8% |
| History | 61 | 30.8% |
| Art | 48 | 24.2% |
| Science | 14 | 7.1% |
| Anthropology | 4 | 2.0% |
| Literature | 2 | 1.0% |

### 🎯 Optimization Algorithm

**Type:** Traveling Salesman Problem (TSP) - Nearest Neighbor
**Time Complexity:** O(n²)
**Approximation:** ~125% of theoretical optimum
**Real-time:** < 30 seconds for 50 museums

See [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) for full details.

### 🌐 APIs Used

- **Nominatim** (OpenStreetMap): Address geocoding
- **OSRM**: Route and distance calculation
- **OpenStreetMap**: Map tiles

### 📸 Screenshots

**Main View - Map with Museums:**
```
[Interactive map showing 198 museums as markers]
[Left sidebar with museum list and filters]
[Active "Museums" tab with search and categories]
```

**Optimized Route View:**
```
[Map showing orange polyline connecting museums]
[Numbered markers: Start (🔴) → 1 (🔴) → 2 (🔴) ...]
[Active "Route" tab showing each step with duration and distance]
```

### ⚙️ Configuration

See `.env.example` file for available environment variables.

```env
# Environment (production or development)
ENVIRONMENT=production

# API URLs (generally kept as default)
NOMINATIM_API=https://nominatim.openstreetmap.org/search
OSRM_API=https://router.project-osrm.org/route/v1/driving
```

### 🚀 Deployment

The application is optimized for GitHub Pages, Vercel and Netlify.

**GitHub Pages (Current):**
- Branch: `main` or `gh-pages`
- URL: https://thejorseman.github.io/CDMX-MUSEOS/visualizador.html

See [python_utils/README.md](python_utils/README.md) for deployment instructions.

### 📝 License

MIT License - See [LICENSE](LICENSE) file for full details.

### 🤝 Contributions

Contributions are welcome:
1. Fork the repository
2. Create a branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

### 📞 Support

To report bugs or suggestions:
1. Open an issue on GitHub
2. Include problem description
3. Attach screenshot if relevant

---

<div align="center">

**Made with ❤️ for Museum Lovers | Para los Amantes de los Museos**

*Last Updated: February 2, 2026 | Version: 2.0 (Production Ready)*

</div>