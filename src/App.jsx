import React, { useState } from 'react';
import { Download, AlertTriangle, Loader, RefreshCw, XCircle, Menu } from 'lucide-react'; 

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
    window.open(formatUrl, '_blank');
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
    setLoading(false);
    setIsProcessing(false);
  };

  // Componente de Botón de Descarga (Estilo Adaptado)
  const DownloadButton = ({ format, videoTitle }) => {
    return (
      <button
        onClick={() => handleDownload(format.url, videoTitle, format.quality)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-purple-500 hover:to-indigo-500 transition duration-300 transform hover:scale-[1.03] flex items-center justify-center text-sm font-semibold"
        title={`Descargar ${format.quality} en ${format.type}`}
      >
        <Download className="w-4 h-4 mr-1" />
        {format.size}
      </button>
    );
  };
  
  // Componente de Error (Estilo Adaptado)
  const ErrorMessage = ({ message }) => (
    <div className="mt-8 p-4 bg-red-900/40 border border-red-700 rounded-xl flex items-start space-x-3 shadow-lg max-w-xl mx-auto">
        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-left">
            <p className="font-bold text-red-300">Error de conexión:</p>
            <p className="text-red-200 mt-1">{message}</p>
        </div>
    </div>
  );


  return (
    // Fondo oscuro con gradiente sutil
    <div className="min-h-screen flex flex-col items-center bg-gray-950 text-white font-[Inter] antialiased">
      
      {/* Navbar (similar a la imagen) */}
      <nav className="w-full bg-transparent p-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center space-x-2">
            <Download className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">SoraDownloader</span>
        </div>
        <div className="hidden sm:flex space-x-6 text-gray-300 font-medium">
            <a href="#" className="hover:text-purple-400 transition">Cómo funciona</a>
            <a href="#" className="hover:text-purple-400 transition">FAQ</a>
        </div>
        <button className="sm:hidden text-gray-300 hover:text-purple-400">
            <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Contenedor Principal Centrado */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center p-4 sm:p-8 flex-grow justify-center">
        
        {/* Sección Principal (H1 y Subtítulo) */}
        <header className="mb-12">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
                Descarga videos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">Sora sin marca de agua</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl font-light mx-auto">
                La herramienta más rápida para guardar videos generados por IA en alta calidad. Gratis, ilimitado y seguro.
            </p>
        </header>

        {/* Input y Botones de Acción (Centrados) */}
        <div className="w-full max-w-3xl flex flex-col items-center">
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            
            <div className="flex-grow flex items-center bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-1.5 max-w-2xl mx-auto">
                <input
                    type="url"
                    placeholder="https://www.tiktok.com/@gattostudio_video/?..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-grow p-3 bg-transparent text-white placeholder-gray-500 focus:outline-none text-left"
                    disabled={isProcessing}
                />
                {/* Botón Pegar (Visual, no funcional en React, solo estético) */}
                <button
                    className="px-4 py-3 bg-gray-700 text-gray-400 font-semibold rounded-lg text-sm transition duration-200 hover:bg-gray-600 mr-2 disabled:opacity-50"
                    disabled={isProcessing}
                >
                    Pegar
                </button>
                {/* Botón Descargar (Funcional) */}
                <button
                    onClick={handleFetchInfo}
                    disabled={loading || isProcessing}
                    className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                    {loading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <Download className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Procesando...' : 'Descargar'}
                </button>
            </div>
          </div>
          
          {/* Muestra el Error (Debajo del input, alineado a la izquierda del contenido) */}
          {error && <ErrorMessage message={error} />}

          {/* Información y Formatos del Video */}
          {videoInfo && (
            <div className="mt-12 w-full max-w-3xl bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl text-left border border-gray-700">
              
              {/* Detalles del Video */}
              <div className="flex items-start pb-4 border-b border-gray-700 mb-6">
                <img
                  src={videoInfo.thumbnail}
                  alt={`Thumbnail de ${videoInfo.title}`}
                  className="w-28 h-28 object-cover rounded-lg flex-shrink-0 mr-6 shadow-lg"
                  onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src="https://placehold.co/112x112/374151/ffffff?text=Video";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white line-clamp-2" title={videoInfo.title}>
                    {videoInfo.title}
                  </h2>
                  <p className="mt-2 text-md text-gray-400 font-medium">
                    Duración: <span className="text-purple-300">{videoInfo.duration}</span>
                  </p>
                </div>
              </div>

              {/* Lista de Formatos */}
              <div>
                <p className="text-xl font-semibold text-gray-300 mb-4">
                  Opciones de Descarga
                </p>
                
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {videoInfo.formats.map((format, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/50 p-4 rounded-xl transition duration-200 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50"
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        <span className={`text-xs font-bold w-16 text-center py-1 rounded-full mr-4 ${format.type === 'MP4' ? 'bg-indigo-700 text-white' : 'bg-lime-700 text-white'} shadow-md`}>
                          {format.type}
                        </span>
                        <span className="text-gray-200 font-medium">{format.quality}</span>
                      </div>
                      
                      <DownloadButton format={format} videoTitle={videoInfo.title} />
                    </div>
                  ))}
                </div>

                {/* Botón de Limpiar después de los formatos */}
                <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleReset}
                      className="flex items-center text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition duration-150"
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" />
                      Limpiar
                    </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pie de página */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500 w-full">
        <p>Desarrollado con React y Python (yt-dlp). Despliegue en Netlify y Render.</p>
      </footer>
    </div>
  );
}

export default App;