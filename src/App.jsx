import React, { useState } from 'react';
// Íconos necesarios para la interfaz y la funcionalidad
import { Download, Link, AlertCircle, Menu, X, Loader, Play, Clock, FileVideo, RefreshCw, Clipboard } from 'lucide-react';

// URL del Backend
const API_BASE_URL = 'https://soradownloader.onrender.com';

function App() {
  // Estados de la lógica
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado visual del menú móvil (no implementado en el menú, pero se mantiene)
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  // --- LÓGICA DEL NEGOCIO ---

  const handleFetchInfo = async () => {
    if (!url) {
      setError("Por favor, introduce una URL de video.");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setIsProcessing(true);

    // Configuración de reintentos con backoff exponencial
    const maxRetries = 3;
    let currentRetry = 0;

    const performFetch = async () => {
        try {
            // Espera antes de cada reintento (excepto el primero)
            if (currentRetry > 0) {
                const delay = Math.pow(2, currentRetry) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Intenta conectar con el Backend
            const response = await fetch(`${API_BASE_URL}/api/info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                // Si el servidor responde con error, salimos de los reintentos
                const errorData = await response.json();
                const backendError = errorData.error || 'Error desconocido del servidor.';
                throw new Error(backendError);
            }

            const data = await response.json();
            setVideoInfo(data);
            return true; // Éxito
        } catch (err) {
            console.error(`Fetch Error (Intento ${currentRetry + 1}):`, err);
            // Si el error es de red y aún quedan reintentos, lo marcamos para reintentar.
            if (currentRetry < maxRetries - 1 && 
                (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
                currentRetry++;
                return false; // Fallo, reintentar
            } else {
                // Falla definitiva (último reintento o error del backend)
                throw err;
            }
        }
    };

    try {
        let success = false;
        while (!success && currentRetry < maxRetries) {
            success = await performFetch();
        }

        if (!success) {
             throw new Error('Fallo al conectar después de múltiples reintentos.');
        }

    } catch (err) {
        // Muestra un error más amigable si es un fallo de red/conexión
        if (err.message.includes('Fallo al conectar') || err.message.includes('Failed to fetch')) {
          setError('Error de conexión: No se pudo contactar con el servidor. El backend (Render) podría estar inactivo o la URL es inaccesible. Inténtalo de nuevo.');
        } else {
          setError(err.message);
        }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleDownload = (formatUrl) => {
    window.open(formatUrl, '_blank');
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
    setLoading(false);
    setIsProcessing(false);
  };

  // FUNCIÓN 1: Pegar desde el portapapeles (Implementación real con navigator.clipboard)
  const handlePaste = async () => {
    if (isProcessing) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setUrl(text);
            setError(null);
        }
    } catch (err) {
        // Fallback si el navegador bloquea el acceso al portapapeles
        console.error("Error al acceder al portapapeles:", err);
        // Dejamos el error silente para no molestar al usuario si no funciona.
    }
  };
  
  // FUNCIÓN 2: Limpiar la URL del input (Implementación solicitada)
  const handleClearUrl = () => {
    if (isProcessing) return;
    setUrl('');
    setError(null);
  };


  // --- RENDERIZADO ---

  return (
    <div className="min-h-screen bg-[#06060e] text-white font-sans selection:bg-purple-500 selection:text-white flex flex-col overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto z-50 relative">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Download size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Sora2Downloader
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <button 
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 text-center pt-24 pb-12 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Headlines (Solo mostrar si no hay resultados para mantener limpia la UI) */}
        {!videoInfo && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Descarga videos de{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-pulse-slow">
                Sora2
              </span>{' '}
              sin <br className="hidden md:block" />
              marca de agua
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
              La herramienta más rápida para guardar videos generados por IA en alta calidad.
              <br className="hidden md:block" /> Gratis, ilimitado y seguro.
            </p>
          </div>
        )}

        {/* Input Area */}
        {!videoInfo && (
          <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="relative flex-1 group">
              
              {/* Icono de Link */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Link className="text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
              </div>
              
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="w-full bg-[#13131f] border border-gray-700/50 text-gray-200 text-sm rounded-xl py-4 pl-12 pr-20 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner placeholder:text-gray-600 truncate disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Pega el enlace de Sora aquí..."
                onKeyDown={(e) => e.key === 'Enter' && handleFetchInfo()}
              />

              {/* Botón Pegar + Botón Limpiar */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button 
                  onClick={handlePaste}
                  disabled={isProcessing}
                  className="bg-[#1f1f2e] hover:bg-[#2a2a3d] text-gray-400 hover:text-white text-xs px-2 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 border border-gray-700/50 disabled:opacity-50"
                  title="Pegar URL del portapapeles"
                >
                  <Clipboard size={14} />
                  <span className="hidden sm:inline">Pegar</span>
                </button>
                
                {url && (
                    <button 
                        onClick={handleClearUrl}
                        disabled={isProcessing}
                        className="bg-[#1f1f2e] hover:bg-red-900/50 text-gray-400 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 border border-gray-700/50 disabled:opacity-50"
                        title="Limpiar URL"
                    >
                        <X size={14} />
                        <span className="hidden sm:inline">Limpiar</span>
                    </button>
                )}
              </div>

            </div>

            <button 
              onClick={handleFetchInfo}
              disabled={loading || !url}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:shadow-none text-white font-semibold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
              {loading ? 'Procesando...' : 'Descargar'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-4 rounded-xl text-sm flex items-start md:items-center justify-center gap-3 text-left md:text-center">
              <AlertCircle size={20} className="shrink-0 mt-0.5 md:mt-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* --- RESULTADOS DEL VIDEO --- */}
        {videoInfo && (
          <div className="w-full max-w-4xl mt-4 animate-in zoom-in-95 duration-500">
            <div className="bg-[#13131f]/80 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Header de Resultados */}
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start border-b border-gray-700/50">
                
                {/* Thumbnail */}
                <div className="relative group w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                  <img 
                    src={videoInfo.thumbnail} 
                    alt={videoInfo.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src="https://placehold.co/600x400/1f1f2e/ffffff?text=No+Thumbnail";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white shadow-xl">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                </div>

                {/* Info Texto */}
                <div className="flex-1 text-left w-full">
                  <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                    {videoInfo.title || 'Video sin título'}
                  </h2>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    {videoInfo.duration && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-medium border border-gray-700">
                        <Clock size={12} />
                        {videoInfo.duration}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                      <FileVideo size={12} />
                      IA Generated
                    </div>
                  </div>

                  <div className="hidden md:block h-px w-full bg-gray-700/50 mb-6" />
                  
                  <p className="text-gray-400 text-sm hidden md:block">
                    Selecciona una calidad a continuación para comenzar la descarga.
                  </p>
                </div>
              </div>

              {/* Lista de Formatos */}
              <div className="p-6 md:p-8 bg-[#0f0f18]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Enlaces de descarga</h3>
                  <button 
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} /> Buscar otro
                  </button>
                </div>

                <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                  {videoInfo.formats?.map((format, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a27] border border-gray-700/30 hover:border-purple-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${format.type === 'MP4' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-green-500/20 text-green-400'}`}>
                          <span className="text-xs font-bold">{format.type}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium text-sm">{format.quality}</div>
                          <div className="text-gray-500 text-xs">{format.size || 'Tamaño desconocido'}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(format.url)}
                        className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Download size={16} />
                        <span className="hidden sm:inline">Descargar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Decorative Background Elements (Glows) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none -z-0 opacity-50" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none -z-0" />

      {/* Simple Footer */}
      <footer className="py-6 text-center text-gray-600 text-sm relative z-10 w-full">
        &copy; 2025 SoraDownloader. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default App;