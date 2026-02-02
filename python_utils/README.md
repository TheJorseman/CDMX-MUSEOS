# 🐍 Python Utilities - CDMX Museos

Conjunto de herramientas Python para procesamiento y gestión de datos de museos.

## Requisitos

```bash
pip install -r requirements.txt
```

**Dependencias:**
- requests >= 2.25.0
- pandas >= 1.0.0
- python-dotenv >= 0.19.0

## Scripts Disponibles

### 1. **add_coordinates.py** - Geocodificación

Agrega coordenadas (latitud/longitud) a museos usando la API de Nominatim.

#### Uso
```bash
python add_coordinates.py
```

#### Entrada
- `museos_cdmx.csv` - CSV con columnas: nombre_oficial, calle, colonia

#### Salida
- `museos_cdmx_con_coordenadas.csv` - Mismo CSV con columnas adicionales: latitud, longitud

#### Funcionamiento
```
Para cada museo:
  1. Construir dirección: "calle, colonia, Mexico City, Mexico"
  2. Llamar Nominatim API
  3. Extraer lat/lng del primer resultado
  4. Si no encuentra, usar coordenadas por defecto (Centro CDMX)
  5. Guardar en nuevo CSV
```

#### Rate Limiting
- 1 petición/segundo (respetando política de Nominatim)
- Duración aproximada: 200 museos ≈ 200 segundos (3.3 minutos)

### 2. **add_categories.py** - Clasificación de Museos

Asigna categorías a museos usando palabras clave y clasificación manual.

#### Uso
```bash
python add_categories.py
```

#### Entrada
- `museos_cdmx_con_coordenadas.csv` - CSV procesado con geocodificación

#### Salida
- `museos_cdmx_con_categorias.csv` - CSV con columna adicional: categoría

#### Categorías
- **Historia** - Museos enfocados en historia, arqueología, patrimonio
- **Arte** - Museos de arte moderno, contemporáneo, prehispánico
- **Ciencia** - Museos científicos, tecnología, naturaleza
- **Antropología** - Museos antropológicos, culturales
- **Literatura** - Museos dedicados a escritores, biblioteca-museos
- **Otro** - Museos que no encajan en categorías anteriores

#### Palabras Clave
```python
categorías = {
    'Historia': ['historia', 'colonial', 'revolutionary', 'independencia', 'porfiriato', ...],
    'Arte': ['arte', 'pintura', 'escultura', 'galería', 'contemporáneo', ...],
    'Ciencia': ['ciencia', 'naturales', 'tecnología', 'astronómico', ...],
    'Antropología': ['antropología', 'etnografía', 'cultural', ...],
    'Literatura': ['literatura', 'biblioteca', 'escritores', ...],
}
```

### 3. **download_data.py** - Descarga de Datos

Descarga datos de APIs externas (OSRM, OpenStreetMap) para análisis.

#### Uso
```bash
python download_data.py
```

#### Funciones
```python
# Descargar información de ruta OSRM
get_route(origin_lat, origin_lng, dest_lat, dest_lng)
→ {"distance": km, "duration": minutos, "geometry": polyline}

# Buscar museo en OpenStreetMap
search_poi(lat, lng, radius_m, tag)
→ [{"name": str, "lat": float, "lng": float, ...}]
```

#### Ejemplo
```python
# Obtener ruta entre dos museos
ruta = get_route(19.4267, -99.1893, 19.4370, -99.1776)
print(f"Distancia: {ruta['distance']} km")
print(f"Duración: {ruta['duration']} minutos")
```

## Variables de Ambiente

Crear archivo `.env` en el directorio raíz (junto a este archivo):

```env
# NOMINATIM
NOMINATIM_API=https://nominatim.openstreetmap.org/search
NOMINATIM_RATE_LIMIT=1  # segundos entre peticiones

# OSRM
OSRM_API=https://router.project-osrm.org/route/v1/driving

# OpenStreetMap
OVERPASS_API=https://overpass-api.de/api/interpreter
```

## Flujo de Procesamiento Completo

```
1. museos_cdmx.csv (crudo)
   ↓
2. python add_coordinates.py
   ↓
   museos_cdmx_con_coordenadas.csv
   ↓
3. python add_categories.py
   ↓
   museos_cdmx_con_categorias.csv (PRODUCCIÓN)
```

## Troubleshooting

### Error: "No module named 'requests'"
```bash
pip install requests
```

### Error: "Rate limit exceeded" (Nominatim)
- Nominatim limita a ~1 req/seg
- El script respeta automáticamente este límite
- Espere a que termine (máximo 5 minutos para 200 museos)

### Geodatos incorrectos
- Verificar dirección en CSV (calle, colonia)
- Nominatim usa OpenStreetMap, puede no encontrar direcciones muy vagas
- Fallback: coordenadas del Centro CDMX (19.4267, -99.1893)

### CSV corrompido
- Verificar encoding: UTF-8 (recomendado)
- No usar caracteres especiales en rutas
- Backup: copiar archivos .csv antes de ejecutar

## Para Desarrolladores

### Agregar nuevo script
```python
# script_nuevo.py
import pandas as pd
from dotenv import load_dotenv
import os

load_dotenv()

def main():
    # Cargar CSV
    df = pd.read_csv('museos_cdmx_con_categorias.csv')
    
    # Tu lógica aquí
    
    # Guardar
    df.to_csv('museos_cdmx_nuevo.csv', index=False, encoding='utf-8')
    print(f"✅ Generado: museos_cdmx_nuevo.csv")

if __name__ == "__main__":
    main()
```

### Testing
```bash
# Verificar archivo CSV válido
python -c "import pandas; print(pandas.read_csv('museos_cdmx_con_categorias.csv').head())"
```

## Documentación Adicional

- [ARQUITECTURA_TECNICA.md](../ARQUITECTURA_TECNICA.md) - Algoritmos y APIs
- [README.md](../README.md) - Guía de usuario
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
- [OSRM API](http://project-osrm.org/docs/v5.5.1/api/overview)

---

**Versión:** 2.0  
**Última Actualización:** Febrero 2, 2026
