import React, { useState } from 'react';
import { Download, AlertTriangle, Loader, RefreshCw, XCircle } from 'lucide-react'; 

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

  // Componente de Botón de Descarga
  const DownloadButton = ({ format, videoTitle }) => {
    return (
      <button
        onClick={() => handleDownload(format.url, videoTitle, format.quality)}
        className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-lg hover:from-teal-400 hover:to-emerald-400 transition duration-300 transform hover:scale-105 flex items-center justify-center text-sm font-semibold"
        title={`Descargar ${format.quality} en ${format.type}`}
      >
        <Download className="w-4 h-4 mr-1" />
        {format.size}
      </button>
    );
  };
  
  // Componente de Error
  const ErrorMessage = ({ message }) => (
    <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-xl flex items-start space-x-3 shadow-md backdrop-blur-sm">
        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
            <p className="font-bold text-red-300">Error:</p>
            <p className="text-red-200 mt-1">{message}</p>
        </div>
    </div>
  );


  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gray-900 text-white font-[Inter] antialiased">
      
      {/* Encabezado */}
      <header className="text-center mb-10 w-full max-w-lg">
        <h1 className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-300 drop-shadow-lg">
          Sora Downloader
        </h1>
        <p className="mt-3 text-xl text-gray-400 font-light">
          Rápido y sencillo. Descarga contenido de múltiples plataformas.
        </p>
      </header>

      {/* Contenedor Principal (Tarjeta) */}
      <main className="w-full max-w-xl bg-gray-800 border border-gray-700/50 p-6 sm:p-10 rounded-2xl shadow-2xl shadow-gray-950/70 transition-all duration-500">
        
        {/* Input y Botón de Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Pega el enlace del video (YouTube, Sora, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow p-4 bg-gray-700/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 shadow-inner"
            disabled={isProcessing}
          />
          <button
            onClick={handleFetchInfo}
            disabled={loading || isProcessing}
            className="flex items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.01]"
          >
            {loading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              <Download className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Botón de Limpiar */}
        {(videoInfo || error) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition duration-150"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Limpiar
            </button>
          </div>
        )}

        {/* Muestra el Error */}
        {error && <ErrorMessage message={error} />}

        {/* Información y Formatos del Video */}
        {videoInfo && (
          <div className="mt-6">
            {/* Detalles del Video */}
            <div className="flex items-start bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600/50">
              <img
                src={videoInfo.thumbnail}
                alt={`Thumbnail de ${videoInfo.title}`}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0 mr-4 shadow-lg"
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src="https://placehold.co/96x96/4b5563/ffffff?text=Video";
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-teal-300 line-clamp-2" title={videoInfo.title}>
                  {videoInfo.title}
                </h2>
                <p className="mt-1 text-sm text-gray-400 font-medium">
                  Duración: <span className="text-teal-400">{videoInfo.duration}</span>
                </p>
              </div>
            </div>

            {/* Lista de Formatos */}
            <div className="mt-6">
              <p className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">
                Opciones de Descarga
              </p>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {videoInfo.formats.map((format, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/60 p-4 rounded-xl transition duration-200 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500/50"
                  >
                    <div className="flex items-center mb-2 sm:mb-0">
                      <span className={`text-xs font-bold w-12 text-center py-1 rounded-full mr-3 ${format.type === 'MP4' ? 'bg-indigo-600 text-white' : 'bg-lime-600 text-white'} shadow-md`}>
                        {format.type}
                      </span>
                      <span className="text-gray-200 font-medium">{format.quality}</span>
                    </div>
                    
                    <DownloadButton format={format} videoTitle={videoInfo.title} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pie de página */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Aplicación desarrollada con React y Python (yt-dlp).</p>
        <p className="mt-1">
          Backend: <a href={API_BASE_URL} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition duration-150 underline">{API_BASE_URL}</a>
        </p>
      </footer>
    </div>
  );
}

export default App;