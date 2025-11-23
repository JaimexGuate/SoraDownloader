from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import math 
from urllib.parse import urlparse, urlunparse # <-- ¡NUEVA IMPORTACIÓN!

app = Flask(__name__)
# CORRECCIÓN DE CORS: Especificamos explícitamente el dominio de Netlify para evitar el bloqueo de seguridad.
# Usamos el dominio que asumimos de Netlify: https://soradownloader.netlify.app
CORS(app, origins="https://soradownloader.netlify.app")

# Función auxiliar para manejar el tamaño del archivo de forma segura
def safe_file_size(filesize):
    """Convierte el tamaño del archivo de bytes a MB de forma segura."""
    if filesize is None or filesize <= 0:
        return "N/A"
    
    # Intentamos la conversión y manejo de posibles errores de cálculo
    try:
        size_mb = filesize / 1024 / 1024
        # Redondeamos a 1 decimal
        return f"{round(size_mb, 1)} MB"
    except Exception:
        return "N/A"

@app.route('/api/info', methods=['POST'])
def get_video_info():
    data = request.json
    raw_url = data.get('url') # <-- Renombrado a raw_url

    if not raw_url:
        return jsonify({'error': 'Falta la URL'}), 400

    # LIMPIEZA DE URL: Eliminamos parámetros de consulta complejos que pueden confundir a yt-dlp.
    try:
        parsed_url = urlparse(raw_url)
        # Reconstruimos la URL sin los query parameters (?psh=...)
        url = urlunparse(parsed_url._replace(query=''))
        print(f"URL Original: {raw_url}")
        print(f"URL Limpia para yt-dlp: {url}")
    except Exception:
        url = raw_url # Si falla la limpieza, usamos la URL original
    
    # Opciones de yt-dlp para operación silenciosa y manejo de errores
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        # Priorizar formatos comunes y solo simular (obtener metadatos)
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', 
        'simulate': True, 
        'force_generic_extractor': True, 
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 1. Extraemos la información del video sin descargarlo
            info = ydl.extract_info(url, download=False) # Usamos la URL limpia
            
            # 2. Formateamos la respuesta para tu Frontend, usando .get() para seguridad
            video_data = {
                'title': info.get('title', 'Video sin título'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration_string', '0:00'),
                'formats': []
            }

            # 3. Preparamos la lista de formatos a procesar
            formats_list = info.get('formats') if isinstance(info.get('formats'), list) else []
            
            # Si no hay lista de formatos, intentamos usar la info de la propia 'info' (común en Shorts/TikTok)
            if not formats_list and info.get('url'):
                formats_list = [{
                    'url': info.get('url'),
                    'ext': info.get('ext', 'mp4'),
                    'format_note': 'Best Quality (Inferred)',
                    'filesize': info.get('filesize', info.get('filesize_approx')),
                    'height': info.get('height'),
                    'vcodec': info.get('vcodec') or 'h264'
                }]

            # 4. Procesamos los formatos disponibles
            for f in formats_list:
                ext = f.get('ext')
                # Ignorar si no hay URL de descarga
                if not f.get('url'):
                    continue

                format_type = 'MP4' if ext in ['mp4', 'webm', 'mov'] else 'MP3'
                
                # Definir calidad
                if format_type != 'MP3':
                    quality_note = f.get('format_note', f'{f.get("height")}p' if f.get('height') else 'HD')
                else:
                    quality_note = f'{f.get("abr")} kbps' if f.get('abr') else 'Audio Quality'
                
                # Solo agregamos si tiene video o si es audio compatible (m4a, mp3)
                if f.get('vcodec') != 'none' or ext in ['m4a', 'mp3']:
                    video_data['formats'].append({
                        'quality': quality_note,
                        'size': safe_file_size(f.get('filesize') or f.get('filesize_approx')),
                        'type': format_type,
                        'url': f.get('url') 
                    })
            
            # Si no hay formatos después del filtrado, devolvemos un error limpio
            if not video_data['formats']:
                return jsonify({'error': 'No se encontraron formatos de video o audio compatibles con la URL proporcionada. Intenta con un enlace diferente.'}), 500

            return jsonify(video_data), 200

    except Exception as e:
        # Esto nos ayuda a dar un error más amigable al usuario en el frontend
        error_msg = str(e)
        if 'Unsupported URL' in error_msg:
             return jsonify({'error': 'URL no válida o plataforma no soportada. Asegúrate de que el enlace sea del video original.'}), 500
        elif 'Private video' in error_msg:
             return jsonify({'error': 'El video es privado o requiere inicio de sesión.'}), 500
        
        # Error genérico que no muestra detalles internos de Python
        print(f"ERROR FATAL EN BACKEND: {error_msg}")
        return jsonify({'error': 'Ocurrió un error inesperado al procesar el video. Por favor, verifica tu terminal Python para más detalles o intenta con otra URL.'}), 500

if __name__ == '__main__':
    # Render usará gunicorn, pero para pruebas locales usamos esto:
    app.run(debug=True, host='127.0.0.1', port=5000)