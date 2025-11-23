import React, { useState } from 'react';
import { Download, AlertTriangle, Loader, RefreshCw } from 'lucide-react';

// Esta es la URL correcta que apunta a tu servidor de Render.
const API_BASE_URL = 'https://soradownloader.onrender.com'; 

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFetchInfo = async () => {
    if (!url) {
      setError("Por favor, introduce una URL de video.");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setIsProcessing(true);

    try {
      // Intenta conectar con el Backend de Render
      const response = await fetch(`${API_BASE_URL}/api/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Enviamos la URL del video al servidor Python
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        // Manejo de errores 400s o 500s del servidor
        const errorData = await response.json();
        // Verificamos si hay un mensaje de error específico del backend
        const backendError = errorData.error || 'Error desconocido del servidor.';
        throw new Error(backendError);
      }

      const data = await response.json();
      setVideoInfo(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      // Muestra un error más amigable si es un fallo de red/conexión
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('SyntaxError')) {
        setError('Error de conexión: No se pudo contactar con el servidor. El backend (Render) podría estar apagado o la URL podría estar mal.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleDownload = (formatUrl, title, quality) => {
    // Abrir en una nueva pestaña para forzar la descarga o reproducción
    window.open(formatUrl, '_blank');
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
    setLoading(false);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-[Inter]">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-teal-400">
          SoraDownloader
        </h1>
        <p className="mt-2 text-xl text-slate-400">
          Descarga videos de Sora, YouTube y más.
        </p>
      </header>

      <main className="w-full max-w-lg bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
        {/* Formulario de URL */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Pega la URL del video aquí"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-teal-500 focus:border-teal-500 transition duration-150"
            disabled={isProcessing}
          />
          <button
            onClick={handleFetchInfo}
            disabled={loading || isProcessing}
            className="flex items-center justify-center p-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Cargando...' : 'Descargar'}
          </button>
        </div>

        {/* Botón de Reset/Nueva búsqueda */}
        {(videoInfo || error) && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleReset}
              className="flex items-center justify-center p-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition duration-150"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Nueva Búsqueda
            </button>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-800/50 border border-red-700 rounded-lg flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-red-300">Error en la descarga:</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Información del Video */}
        {videoInfo && (
          <div className="mt-6 p-4 bg-slate-700 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-teal-300 mb-4">
              {videoInfo.title}
            </h2>
            
            {/* Thumbnail y Duración */}
            <div className="flex items-center mb-4">
                <img
                    src={videoInfo.thumbnail}
                    alt={`Thumbnail de ${videoInfo.title}`}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0 mr-4"
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src="https://placehold.co/80x80/334155/ffffff?text=Video"; // Placeholder si falla la imagen
                    }}
                />
                <p className="text-slate-400 text-sm">Duración: {videoInfo.duration}</p>
            </div>


            {/* Lista de Formatos */}
            <p className="text-slate-300 font-semibold mb-2 border-b border-slate-600 pb-1">
              Formatos Disponibles:
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {videoInfo.formats.map((format, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-600 transition duration-150 hover:border-teal-500"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <span className={`text-sm font-bold w-12 text-center py-0.5 rounded-full ${format.type === 'MP4' ? 'bg-indigo-500 text-white' : 'bg-green-500 text-white'}`}>
                      {format.type}
                    </span>
                    <span className="text-slate-300 text-sm">{format.quality}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-sm font-medium">{format.size}</span>
                    <button
                      onClick={() => handleDownload(format.url, videoInfo.title, format.quality)}
                      className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-full transition duration-150 transform hover:scale-105"
                      title={`Descargar ${format.quality} en ${format.type}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 text-center text-sm text-slate-500">
        <p>Desarrollado con React y Python (yt-dlp). Despliegue en Netlify y Render.</p>
        <p className="mt-1">
          Backend URL: <a href={API_BASE_URL} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-400 transition duration-150">{API_BASE_URL}</a>
        </p>
      </footer>
    </div>
  );
}

export default App;