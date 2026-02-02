#!/usr/bin/env python3
"""
Servidor HTTP local simple para servir los archivos de CDMX Museos
Ejecutar: python servidor.py
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Agregar headers para evitar problemas de CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/visualizador.html'
        return super().do_GET()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("=" * 50)
            print("🏛️ CDMX MUSEOS - Servidor Local")
            print("=" * 50)
            print()
            print(f"✓ Servidor iniciado en: http://localhost:{PORT}")
            print(f"✓ Directorio: {DIRECTORY}")
            print()
            print("Abre tu navegador en:")
            print(f"  → http://localhost:{PORT}")
            print()
            print("Presiona Ctrl+C para detener el servidor")
            print("=" * 50)
            print()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Servidor detenido.")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Puerto en uso
            print(f"\n❌ Error: El puerto {PORT} ya está en uso.")
            print("Intenta cerrar la otra instancia o usa otro puerto.")
            sys.exit(1)
        raise
