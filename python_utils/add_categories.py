#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para agregar categorías a museos basándose en el contenido del resumen
Categorías: Historia, Ciencia, Arte, Antropología, Literatura, Otro
"""

import csv
import re

def categorizar_museo(nombre, resumen):
    """Determina la categoría del museo según nombre y resumen"""
    texto = (nombre + " " + resumen).lower()
    
    # Palabras clave por categoría
    categorias = {
        'Historia': [
            'historia', 'histórico', 'prehispánico', 'azteca', 'maya', 'conquista',
            'colonial', 'revolución', 'independencia', 'antiguo', 'arqueológico',
            'méxico prehispánico', 'templo mayor', 'ancestral'
        ],
        'Ciencia': [
            'ciencia', 'científico', 'física', 'química', 'biología', 'tecnología',
            'tecnológico', 'biodiversidad', 'naturaleza', 'universum', 'experimento',
            'interactivo'
        ],
        'Arte': [
            'arte', 'artístico', 'pintura', 'escultura', 'obra', 'frida', 'diego',
            'cultura', 'artesanía', 'cerámica', 'grabado', 'fotograf'
        ],
        'Antropología': [
            'antropología', 'antropológico', 'etnografía', 'etnográfico', 'pueblos',
            'costumbres', 'tradición', 'indígena'
        ],
        'Literatura': [
            'literatura', 'literario', 'cervantes', 'biblioteca', 'escritor', 'poesía',
            'novela', 'documento'
        ]
    }
    
    scores = {}
    for categoria, palabras_clave in categorias.items():
        score = sum(len(re.findall(r'\b' + palabra + r'\b', texto)) for palabra in palabras_clave)
        scores[categoria] = score
    
    # Retornar la categoría con mayor score
    if max(scores.values()) > 0:
        return max(scores, key=scores.get)
    return 'Otro'

# Leer CSV original
input_file = 'museos_cdmx_con_coordenadas.csv'
output_file = 'museos_cdmx_con_categorias.csv'

try:
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + ['categoria']
        
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                categoria = categorizar_museo(row['nombre_oficial'], row['resumen'])
                row['categoria'] = categoria
                writer.writerow(row)
    
    print(f"✅ CSV con categorías creado: {output_file}")
    
    # Contar por categoría
    categorias_count = {}
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cat = row['categoria']
            categorias_count[cat] = categorias_count.get(cat, 0) + 1
    
    print("\n📊 Distribución de categorías:")
    for cat, count in sorted(categorias_count.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count} museos")

except FileNotFoundError:
    print(f"❌ No se encontró {input_file}")
except Exception as e:
    print(f"❌ Error: {e}")
