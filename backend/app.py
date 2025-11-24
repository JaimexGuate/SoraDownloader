from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import math 
import os

app = Flask(__name__)
# Permitir CORS desde cualquier origen para la comunicación con el frontend
CORS(app, origins="*") 

# --- FUNCIONES AUXILIARES ---

def safe_file_size(filesize):
    """Convierte el tamaño del archivo de bytes a una unidad legible (KB, MB, GB)."""
    if filesize is None:
        return "N/A"
    
    size_names = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    try:
        i = int(math.floor(math.log(filesize, 1024)))
        p = math.pow(1024, i)
        s = round(filesize / p, 2)
        return f"{s} {size_names[i]}"
    except ValueError:
        return "Tamaño Desconocido"

def format_duration(seconds):
    """Convierte la duración de segundos a formato minutos:segundos."""
    if seconds is None:
        return "0:00"
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes}:{remaining_seconds:02d}"

# --- RUTA PRINCIPAL ---

@app.route('/api/info', methods=['POST'])
def get_video_info():
    """
    Extrae la información del video y los enlaces de descarga directos 
    utilizando yt-dlp.
    """
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "No se proporcionó URL"}), 400

    # Configuración de yt-dlp.
    # Priorizamos formatos MP4 combinados o el mejor disponible.
    ydl_opts = {
        # Formato de preferencia: mejor video mp4 + mejor audio m4a, o el mejor mp4, o el mejor en general
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', 
        'quiet': True,
        'simulate': True, # Solo simula la descarga (obtiene info)
        'force_ipv4': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'nocheckcertificate': True, 
        'geo_bypass': True,
        'listformats': False, # Desactivamos la lista inicial para una extracción más rápida
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 1. Extraer la información del video
            info_dict = ydl.extract_info(url, download=False)
            
            # Manejar el caso de que la URL sea una lista de reproducción/canal (tomar el primero)
            if isinstance(info_dict, dict) and 'entries' in info_dict and info_dict['entries']:
                info_dict = info_dict['entries'][0] 
            
            if not info_dict:
                 return jsonify({"error": "No se pudo extraer la información del video. La URL no es válida o la plataforma no es compatible."}), 400
            
            # Forzamos una nueva extracción si la info_dict inicial no tiene los formatos para asegurar que los tenemos.
            if 'formats' not in info_dict:
                 ydl_opts_full = {**ydl_opts, 'format': 'best', 'listformats': True}
                 with yt_dlp.YoutubeDL(ydl_opts_full) as ydl_full:
                    info_dict = ydl_full.extract_info(url, download=False)

            # 2. Obtener y filtrar los formatos de descarga
            formats = []
            
            if 'formats' in info_dict and info_dict['formats']:
                allowed_formats = []
                seen_qualities = set()
                
                # Criterios de filtrado y priorización
                for f in info_dict['formats']:
                    # Requisito 1: Debe tener una URL válida
                    if not f.get('url'):
                        continue
                    
                    # Identificar tipo de formato
                    is_combined = f.get('vcodec') != 'none' and f.get('acodec') != 'none'
                    is_audio_only = f.get('vcodec') == 'none' and f.get('acodec') != 'none'
                    ext = f.get('ext', 'mp4')
                    
                    # Ignorar formatos de video/audio separados y extensiones raras.
                    if (f.get('vcodec') != 'none' and f.get('acodec') == 'none') or ext not in ['mp4', 'webm', 'm4a', 'mp3']:
                        continue

                    # Construir la calidad y el tipo de etiqueta
                    quality = f.get('format_note') or f.get('format_id') or 'Desconocida'
                    if 'height' in f and f['height']:
                        quality = f"{f['height']}p"
                    elif is_audio_only:
                        quality = f.get('abr') and f['abr'] > 0 and f"{f['abr']}kbps" or "Audio"
                        
                    type_label = 'MP4' if ext == 'mp4' else 'Audio' if is_audio_only else ext.upper()

                    # Evitar duplicados de la misma calidad de video (si no es audio puro)
                    if not is_audio_only and quality in seen_qualities:
                        continue 
                        
                    seen_qualities.add(quality)
                        
                    # Prioridad: (1 si es combinado, 0 si es solo audio) * 10000 + Resolución (height) * 10 + Tasa de bits de audio (abr)
                    priority = (1 if is_combined else 0) * 10000 + f.get('height', 0) * 10 + f.get('abr', 0)
                        
                    allowed_formats.append({
                        "type": type_label,
                        "quality": quality,
                        "size": safe_file_size(f.get('filesize') or f.get('filesize_approx')),
                        "url": f['url'],
                        "priority": priority, 
                    })

                # Ordenar: primero video de mayor calidad, luego audio de mayor calidad
                allowed_formats.sort(key=lambda x: x['priority'], reverse=True)
                
                # Tomar solo los 6 mejores formatos no redundantes
                formats = allowed_formats[:6]

            # 3. Construir la respuesta final
            response_data = {
                "title": info_dict.get('title', 'Título Desconocido'),
                "duration": format_duration(info_dict.get('duration')),
                "thumbnail": info_dict.get('thumbnail', 'https://placehold.co/96x96/374151/ffffff?text=Video'),
                "formats": formats
            }

            return jsonify(response_data)

    except yt_dlp.DownloadError as e:
        # Errores específicos de yt-dlp (video no encontrado, privado, URL no compatible)
        error_message = str(e).split('ERROR: ')[-1].strip()
        app.logger.error(f"yt-dlp Error: {error_message}")
        
        # Ofrecer un mensaje más específico si falla la compatibilidad
        if "Unsupported URL" in error_message:
            error_message = "URL no compatible: El enlace proporcionado no es un video de Sora o la plataforma de hosting no es compatible."

        return jsonify({"error": f"Error al procesar la URL: {error_message}"}), 400
    except Exception as e:
        # Otros errores inesperados
        app.logger.error(f"Error inesperado: {e}")
        return jsonify({"error": "Ocurrió un error inesperado en el servidor. Revise la consola del servidor para más detalles."}), 500

if __name__ == '__main__':
    # Usar el puerto de entorno para Render o 5001 si se ejecuta localmente
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port)