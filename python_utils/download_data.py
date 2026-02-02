import requests
from bs4 import BeautifulSoup
import csv
import re
import time
import json
import anthropic  # pip install anthropic
from urllib.parse import urljoin
import os

# --- CONFIGURACIÓN ---
ANTHROPIC_API_KEY = os.getenv('CLIUDE_API_KEY')
BASE_URL = "https://sic.cultura.gob.mx"
LIST_URL = f"{BASE_URL}/lista.php?table=museo&estado_id=9&municipio_id=-1"
MODEL_NAME = "claude-3-haiku-20240307"  # Modelo rápido y barato ideal para extracción

# Inicializar cliente de Claude
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def get_museos_urls():
    """Obtiene la lista de URLs deduplicada."""
    print(f"Descargando listado maestro...")
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = requests.get(LIST_URL, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    museos = []
    seen_ids = set()

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "ficha.php?table=museo&table_id=" in href:
            nombre = a.get_text(strip=True)
            if not nombre: continue # Saltar imágenes

            m_id = re.search(r"table_id=(\d+)", href)
            if m_id:
                uid = m_id.group(1)
                if uid in seen_ids: continue
                seen_ids.add(uid)

            full_url = href if href.startswith("http") else urljoin(BASE_URL + "/", href)
            museos.append({"nombre": nombre, "url": full_url})
            
    print(f"-> Se encontraron {len(museos)} museos únicos.")
    return museos

def parse_with_claude(html_text, url):
    """Envía el texto crudo a Claude para que extraiga el JSON."""
    
    # Prompt diseñado para extracción estricta
    prompt = f"""
    Eres un asistente experto en extracción de datos (scraping).
    Analiza el siguiente texto extraído de la página web de un museo mexicano.
    
    Tu objetivo es extraer la información y devolver SOLO un objeto JSON válido (sin markdown, sin explicaciones).
    
    Campos requeridos en el JSON:
    - calle: (La calle y número. Si dice s/n pon s/n).
    - colonia: (Solo la colonia).
    - cp: (Código postal de 5 dígitos).
    - alcaldia: (El municipio o alcaldía, ej: Coyoacán, Cuauhtémoc).
    - telefonos: (String con los teléfonos encontrados).
    - horarios: (String con días y horas).
    - costos: (String con precios o si es entrada libre).
    - resumen: (Un resumen de máximo 2 oraciones sobre qué es el museo).
    - fundacion: (Fecha de fundación si existe).

    Si no encuentras un dato, pon null o string vacío.
    
    TEXTO WEB:
    {html_text[:5000]} 
    """
    # Recortamos a 5000 caracteres para ahorrar tokens, usualmente la info clave está al inicio

    try:
        message = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1000,
            temperature=0,
            system="Responde exclusivamente con JSON válido.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = message.content[0].text
        
        # Limpieza por si Claude devuelve bloques de código markdown
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"Error con Claude en {url}: {e}")
        return {}

def process_all_museos():
    museos = get_museos_urls()
    
    resultados = []
    total = len(museos)
    
    print(f"Iniciando procesamiento con IA para {total} museos...")

    # NO HAY SLICING [:5], esto procesará TODOS
    for i, m in enumerate(museos):
        print(f"[{i+1}/{total}] Procesando: {m['nombre']}...")
        
        try:
            # 1. Descargar HTML
            r = requests.get(m["url"], headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if r.status_code != 200:
                print(f"   X Error HTTP {r.status_code}")
                continue
                
            soup = BeautifulSoup(r.text, "html.parser")
            
            # 2. Obtener texto plano (limpiando scripts y estilos)
            for script in soup(["script", "style"]):
                script.extract()
            text_content = soup.get_text("\n", strip=True)
            
            # 3. Llamar a Claude
            data_ia = parse_with_claude(text_content, m["url"])
            
            # 4. Unir datos
            row = {
                "nombre_oficial": m["nombre"],
                "url": m["url"],
                **data_ia # Expande el JSON de Claude
            }
            resultados.append(row)
            
            # Pequeña pausa para no saturar tu rate limit de la API
            time.sleep(0.5) 

        except Exception as e:
            print(f"   X Error general: {e}")

    # Guardar CSV
    if resultados:
        # Obtener headers dinámicos del primer resultado exitoso
        headers = list(resultados[0].keys())
        
        with open("museos_cdmx_ia.csv", "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(resultados)
        
        print(f"\n¡Éxito! Se guardaron {len(resultados)} museos en 'museos_cdmx_ia.csv'")

if __name__ == "__main__":
    if "TU_API_KEY" in ANTHROPIC_API_KEY:
        print("ERROR: Por favor edita el script y pon tu API KEY de Anthropic.")
    else:
        process_all_museos()
