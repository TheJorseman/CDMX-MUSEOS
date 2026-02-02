# Script: Agregar Coordenadas a Museos CDMX

Este script agrega coordenadas geográficas (latitud y longitud) a la base de datos de museos de CDMX usando **Google Maps Geocoding API**.

## 📋 Requisitos

- Python 3.7+
- Una clave de API de Google Maps

## ⚙️ Instalación

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Configurar API Key
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu clave de API
# Obtén tu clave en: https://console.cloud.google.com/
```

### Pasos para obtener la API Key de Google:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (o usa uno existente)
3. Habilita estas APIs:
   - Maps JavaScript API
   - Geocoding API
4. Crea una clave de API (tipo "API Key")
5. Copia la clave en tu archivo `.env`

## 🚀 Uso

```bash
python add_coordinates.py
```

El script:
- Lee `museos_cdmx.csv`
- Obtiene las coordenadas de cada museo
- Crea un nuevo archivo: `museos_cdmx_con_coordenadas.csv`
- Agrega columnas: `latitud` y `longitud`

## 📊 Salida

Se genera un CSV con las mismas columnas originales más:
- `latitud`: Coordenada de latitud
- `longitud`: Coordenada de longitud

## ⚠️ Notas Importantes

- **Rate Limit**: Google Maps tiene límites de requests. El script incluye delays para respetarlos
- **Costo**: Los primeros 25,000 requests geocoding son gratis mensuales, después aplican cargos
- **Privacidad**: La API Key debe mantenerse **privada** (agregar `.env` a `.gitignore`)

## 🔒 Seguridad

Asegúrate de que `.env` está en `.gitignore`:
```
# .gitignore
.env
```

¡Nunca comitas tu API Key en el repositorio!

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `GOOGLE_MAPS_API_KEY no configurada` | Verifica que `.env` existe y contiene tu clave |
| `No se encontraron resultados` | La dirección es muy vaga; intenta con el museo individual |
| `Quota exceeded` | Espera 24 horas o compra más requests en Google Cloud |
