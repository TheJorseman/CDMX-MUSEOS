"""
Script para agregar coordenadas geográficas a museos de CDMX.
Usa Google Maps Geocoding API.
"""

import pandas as pd
import googlemaps
import os
from dotenv import load_dotenv
import time

# Cargar variables de entorno
load_dotenv()

# Obtener clave de API desde variable de entorno
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

if not GOOGLE_MAPS_API_KEY:
    raise ValueError(
        "❌ Error: GOOGLE_MAPS_API_KEY no configurada.\n"
        "Por favor:\n"
        "1. Crea un archivo .env en el directorio raíz\n"
        "2. Agrega: GOOGLE_MAPS_API_KEY=tu_clave_aqui\n"
        "3. Obtén tu clave en: https://cloud.google.com/maps/billing-and-pricing/pricing"
    )

# Inicializar cliente de Google Maps
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

def get_coordinates(address):
    """
    Obtiene coordenadas (latitud, longitud) de una dirección usando Google Maps.
    
    Args:
        address (str): Dirección a geocodificar
        
    Returns:
        tuple: (latitud, longitud) o (None, None) si hay error
    """
    try:
        # Geocodificar la dirección
        result = gmaps.geocode(address)
        
        if result:
            location = result[0]['geometry']['location']
            return location['lat'], location['lng']
        else:
            print(f"⚠️  No se encontraron resultados para: {address}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error geocodificando '{address}': {str(e)}")
        return None, None

def main():
    # Leer CSV
    print("📖 Leyendo archivo CSV...")
    df = pd.read_csv('museos_cdmx.csv')
    
    # Crear columnas para coordenadas
    df['latitud'] = None
    df['longitud'] = None
    
    # Procesar cada museo
    total = len(df)
    print(f"🔍 Procesando {total} museos...\n")
    
    for idx, row in df.iterrows():
        # Construir dirección completa
        address = f"{row['calle']}, {row['colonia']}, {row['cp']}, CDMX, México"
        
        print(f"[{idx + 1}/{total}] {row['nombre_oficial']}")
        print(f"  📍 Dirección: {address}")
        
        # Obtener coordenadas
        lat, lng = get_coordinates(address)
        
        if lat and lng:
            df.at[idx, 'latitud'] = lat
            df.at[idx, 'longitud'] = lng
            print(f"  ✅ Coordenadas: {lat:.6f}, {lng:.6f}\n")
        else:
            print(f"  ⚠️  No se obtuvieron coordenadas\n")
        
        # Respetar límite de rate limit (100 requests por 10 segundos)
        time.sleep(0.1)
    
    # Guardar CSV actualizado
    output_file = 'museos_cdmx_con_coordenadas.csv'
    df.to_csv(output_file, index=False)
    print(f"✨ Archivo guardado como: {output_file}")
    print(f"📊 {df['latitud'].notna().sum()} museos con coordenadas exitosas")
    print(f"⚠️  {df['latitud'].isna().sum()} museos sin coordenadas")

if __name__ == "__main__":
    main()
