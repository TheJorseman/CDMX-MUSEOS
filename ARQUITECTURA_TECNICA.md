# 📐 Arquitectura Técnica - Museos CDMX Explorer

## Índice
- [Visión General](#visión-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Algoritmos Principales](#algoritmos-principales)
- [Flujo de Datos](#flujo-de-datos)
- [Base de Datos](#base-de-datos)
- [APIs Externas](#apis-externas)

---

## Visión General

**Museos CDMX Explorer** es una aplicación web 100% client-side que optimiza rutas de visita a museos en Ciudad de México. La aplicación permite:
- Cargar dinámicamente datos de museos desde CSV
- Filtrar por categoría cultural
- Seleccionar museos específicos
- Optimizar rutas minimizando tiempo de desplazamiento
- Visualizar rutas en tiempo real en mapa interactivo
- Exportar planes de visita en PDF y CSV

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ visualizador.html + css/animations.css               │  │
│  │ - Interfaz responsiva con Leaflet Map               │  │
│  │ - Sidebar con lista de museos y filtros             │  │
│  │ - Tabs para Museos/Ruta                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE LÓGICA (Frontend)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ js/app.js (1544 líneas)                              │  │
│  │ - Gestión de estado (museums, selectedMuseums)      │  │
│  │ - Lógica de filtrado y búsqueda                     │  │
│  │ - Algoritmo TSP para optimización de ruta           │  │
│  │ - Generación de PDF y CSV                           │  │
│  │ - Gestión del mapa interactivo                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ js/config.js                                         │  │
│  │ - Detección de ambiente (GitHub Pages, Localhost)   │  │
│  │ - URLs dinámicas según plataforma                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE DATOS & SERVICIOS                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CSV Local (museos_cdmx_con_categorias.csv)          │  │
│  │ - 198 museos con coordenadas y categorías           │  │
│  │ - Carga automática o manual                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ APIs REST Externas (asincrónicas)                   │  │
│  │ - Nominatim (OpenStreetMap): Geocodificación        │  │
│  │ - OSRM: Cálculo de distancias y rutas               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE VISUALIZACIÓN                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Leaflet.js v1.9.4 + OpenStreetMap                   │  │
│  │ - Mapa interactivo con tiles base                   │  │
│  │ - Marcadores personalizados (SVG/divIcon)          │  │
│  │ - Polylines para rutas                             │  │
│  │ - Popups informativos                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Leaflet.js** | 1.9.4 | Mapeo interactivo |
| **OpenStreetMap** | - | Tiles base del mapa |
| **PapaParse** | 5.4.1 | Parsing de CSV |
| **html2pdf.js** | 0.10.1 | Generación de PDF |
| **Font Awesome** | 6.4.0 | Iconografía |
| **HTML5/CSS3** | - | Estructura y estilos |
| **JavaScript ES6+** | - | Lógica de aplicación |

### Backend (Utilidades)
| Tecnología | Propósito |
|-----------|----------|
| **Python 3** | Utilidades de procesamiento |
| **Requests** | Llamadas a APIs (Nominatim) |
| **Pandas** | Manipulación de datos CSV |

### APIs Externas
| API | Propósito | Límites |
|-----|----------|---------|
| **Nominatim** | Geocodificación (dirección → coordenadas) | Sin límite específico |
| **OSRM** | Cálculo de rutas y distancias | 30 req/min (pública) |

### Plataformas de Despliegue
- **GitHub Pages** (producción)
- **Vercel** (alternativa)
- **Netlify** (alternativa)
- **Localhost** (desarrollo)

---

## Algoritmos Principales

### 1. **Traveling Salesman Problem (TSP) - Nearest Neighbor**

#### Objetivo
Encontrar una ruta optimizada que visite todos los museos seleccionados minimizando la distancia total.

#### Implementación
```
algoritmo NearestNeighbor(museos[], puntoInicio):
    ruta = []
    nodosNoVisitados = museos.copia()
    puntoActual = puntoInicio
    
    mientras nodosNoVisitados no esté vacío:
        museoMasCercano = encontrar(nodosNoVisitados, mínima_distancia(puntoActual))
        
        obtenerDistancia(puntoActual, museoMasCercano) [API OSRM]
        
        ruta.agregar({
            museo: museoMasCercano,
            travelTime: duracion_minutos,
            travelDistance: distancia_km,
            geometry: ruta_OSRM
        })
        
        nodosNoVisitados.remover(museoMasCercano)
        puntoActual = museoMasCercano
    
    // Retorno a casa
    ruta.agregar(retorno_a_hogar())
    
    retornar ruta
```

#### Complejidad
- **Temporal:** O(n²) donde n = número de museos
- **Espacial:** O(n)
- **Aproximación:** ~125% del óptimo teórico

#### Ventajas
✅ Rápido (tiempo real)
✅ Greedy (siempre elige mejor opción local)
✅ Determinístico

#### Desventajas
❌ No garantiza óptimo global
❌ Sensible a orden de exploración

### 2. **Haversine Distance**

Calcula distancia euclidiana entre dos puntos geográficos (lat, lng).

```javascript
function calculateHaversine(point1, point2) {
    const R = 6371; // Radio terrestre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2)² + 
              Math.cos(point1.lat * π/180) * 
              Math.cos(point2.lat * π/180) * 
              Math.sin(dLng/2)²;
    
    const c = 2 * Math.atan2(√a, √(1-a));
    return R * c;
}
```

**Uso:** Encontrar museo más cercano en cada iteración (pre-filtro antes de OSRM)

### 3. **Filtrado Dinámico**

#### Filtrado por Categoría
```
categorías_seleccionadas = [checkbox.checked]
museos_visibles = museos.filter(m => categorías_seleccionadas.includes(m.categoría))
selectedMuseums.clear()
selectedMuseums.addAll(museos_visibles.indices)
```

#### Filtrado por Búsqueda
```
query = searchInput.toLowerCase()
museos_visibles = museos.filter(m => 
    m.nombre.includes(query) || 
    m.colonia.includes(query)
)
```

### 4. **Selección de Museos**

Utiliza un `Set<number>` para rastrear índices de museos seleccionados:
```javascript
selectedMuseums: Set<number> // Índices de museos en array global
toggleMuseumSelection(index) // Añade/quita del Set
```

---

## Flujo de Datos

### Flujo 1: Carga de Datos
```
Usuario → [Botón Cargar CSV] → FileReader API
    ↓
PapaParse.parse(csvText)
    ↓
Validar estructura (nombre_oficial, coordenadas)
    ↓
[Geocodificación opcional] (Nominatim API)
    ↓
museums[] = datos procesados
selectedMuseums = todos los índices
    ↓
displayMuseums() → Renderizar lista + checkboxes
drawMuseumsOnMap() → Marcadores en mapa
```

### Flujo 2: Optimización de Ruta
```
Usuario → [Botón Optimizar Ruta]
    ↓
validateSelection() → ¿Al menos 2 museos?
    ↓
showProgress(0%) → Barra visual
    ↓
calculateOptimalRoute() → Nearest Neighbor + OSRM
    ├─ Iteración 1: Buscar museo más cercano
    ├─ API OSRM: Obtener ruta, distancia, tiempo
    ├─ updateProgress() → 33%
    ├─ Iteración 2: Desde museo 1 → museo 2
    ├─ updateProgress() → 66%
    └─ Retorno a hogar: updateProgress() → 100%
    ↓
optimizedRoute = {
    steps: [...],
    totalTime: minutos,
    totalDistance: km
}
    ↓
displayRoute() → Mostrar lista de pasos en sidebar
drawRouteOnMap() → Polylines + marcadores numerados
```

### Flujo 3: Exportación PDF
```
Usuario → [Botón Descargar Plan Óptimo]
    ↓
¿Ruta ya calculada?
    ├─ Sí → Descargar directo (rápido)
    └─ No → Calcular + Descargar
    ↓
generatePDFContent() → HTML con estilos inline
    ↓
html2pdf.js → Convertir HTML → PDF
    ↓
navigator.download() → Descarga automática
```

---

## Base de Datos

### Estructura CSV (museos_cdmx_con_categorias.csv)

```
nombre_oficial | url | calle | colonia | cp | alcaldia | telefonos | horarios | costos | resumen | fundacion | latitud | longitud | categoria
```

**Ejemplo:**
```
Museo Tamayo | https://... | Paseo de la Reforma 505 | Cuauhtémoc | 6500 | Cuauhtémoc | 55 4161 6271 | Mar-Dom 10-18 | $90 | Arte... | 1981 | 19.426 | -99.186 | Arte
```

**Estadísticas:**
- **Total:** 198 museos
- **Categorías:** 6 (Historia, Ciencia, Arte, Antropología, Literatura, Otro)
- **Distribución:**
  - Otro: 67
  - Historia: 61
  - Arte: 48
  - Ciencia: 14
  - Antropología: 4
  - Literatura: 2

---

## APIs Externas

### Nominatim (OpenStreetMap Geocoding)

**Endpoint:** `https://nominatim.openstreetmap.org/search`

```javascript
// Convertir dirección → coordenadas
const response = await fetch(`${url}?q=${address}&country=MX&format=json`);
const data = await response.json();
return { lat: data[0].lat, lng: data[0].lon };
```

**Rate Limit:** 1 req/seg
**Uso:** Geocodificación inicial si CSV no tiene coordenadas

### OSRM (Open Route Service Manager)

**Endpoint:** `https://router.project-osrm.org/route/v1/driving`

```javascript
// Obtener ruta, distancia y tiempo entre dos puntos
const url = `${baseUrl}/${from.lng},${from.lat};${to.lng},${to.lat}`;
const response = await fetch(`${url}?overview=full&geometries=polyline`);
const route = response.routes[0];
return {
    distance: route.distance / 1000, // km
    duration: route.duration / 60,   // minutos
    geometry: route.geometry          // polyline
};
```

**Rate Limit:** 30 req/min (pública)
**Uso:** TSP - Calcular rutas óptimas entre museos

---

## Patrones de Diseño Utilizados

### 1. **Module Pattern**
Toda la lógica está en `js/app.js` como un módulo autoejecutado con variables privadas y funciones públicas.

### 2. **Observer Pattern**
Los checkboxes disparan eventos `change` que actualizan el estado de `selectedMuseums`.

### 3. **Lazy Loading**
Los museos se cargan bajo demanda (onclick en checkbox) en lugar de pre-cargar todas las coordenadas.

### 4. **Caching**
- `optimizedRoute` se cachea en memoria
- No se recalcula si museos seleccionados no cambian
- CSV se carga automáticamente la primera vez

---

## Consideraciones de Rendimiento

| Operación | Tiempo | Límite |
|-----------|--------|--------|
| Cargar CSV (198 museos) | ~100ms | - |
| Geocodificar 198 museos | ~200s | Alto (1 req/seg) |
| TSP con 10 museos | ~5s | Aceptable |
| TSP con 50 museos | ~20s | Crítico |
| Generar PDF | ~2s | Aceptable |

**Optimizaciones implementadas:**
✅ Progress bar para feedback visual
✅ Delay de 100ms entre llamadas OSRM
✅ Caching de ruta calculada
✅ Selección subconjunto de museos

---

## Seguridad & Limitaciones

### Seguridad
- ✅ 100% client-side (sin datos en servidor)
- ✅ Datos públicos (museos, horarios)
- ✅ No requiere autenticación
- ✅ No almacena información personal

### Limitaciones Conocidas
- ❌ Máximo ~50 museos para TSP en tiempo real
- ❌ Depende de APIs externas (Nominatim, OSRM)
- ❌ No optimiza saltos múltiples (solo Nearest Neighbor)
- ❌ Offline solo con datos pre-cargados

---

## Roadmap Futuro

1. **Algoritmo TSP Mejorado**
   - Implementar 2-opt o Ant Colony Optimization
   - Mejor aproximación al óptimo

2. **Modo Offline**
   - Service Workers para cacheo
   - Datos sincronizados localmente

3. **Horarios de Apertura**
   - Optimizar según horarios de museos
   - Avisar si museo está cerrado

4. **Preferencias del Usuario**
   - Guardar rutas favoritas
   - Compartir rutas por URL

5. **Realidad Aumentada**
   - Navegación AR en tiempo real
   - Información en la cámara

---

**Última Actualización:** 2 de Febrero, 2026
**Versión:** 2.0 (Production Ready)
