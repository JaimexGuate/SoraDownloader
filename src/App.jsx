import React, { useState } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  Play, 
  CheckCircle, 
  Loader2, 
  Video, 
  ShieldCheck, 
  Zap, 
  Smartphone,
  Menu,
  X,
  Github,
  Twitter,
  Info
} from 'lucide-react';

// URL INTELIGENTE:
// Para evitar la advertencia de compilación 'import.meta', hemos hardcodeado la URL local.
// En un entorno de producción (ej. Render), esta URL debe ser dinámica.
const API_BASE_URL = 'http://localhost:5000'; 

const App = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Función para pegar texto del portapapeles
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard');
      // Mostrar un error amigable si la API de Clipboard falla (por seguridad del navegador)
      setError('Error: El navegador bloqueó el acceso al portapapeles. Pega la URL manualmente.');
    }
  };

  // Función principal que envía la URL al servidor Flask (Backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Por favor ingresa un enlace válido.');
      return;
    }
    if (!url.includes('http')) {
       setError('El enlace debe comenzar con http:// o https://');
       return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      console.log(`Conectando a: ${API_BASE_URL}/api/info`); 
      
      const response = await fetch(`${API_BASE_URL}/api/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Maneja errores provenientes del backend (ej. yt-dlp falló)
        throw new Error(data.error || 'Error al procesar el video. Verifica que el backend esté activo.');
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      // Muestra un error genérico si la red falla o el servidor no responde
      setError('Error de conexión: No se pudo contactar con el servidor. Intenta de nuevo más tarde o verifica la URL del backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-2 rounded-lg">
                <Download size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                SoraDownloader
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Cómo funciona</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">FAQ</a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Descarga videos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Sora</span> sin marca de agua
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                La herramienta más rápida para guardar videos generados por IA en alta calidad. 
                Gratis, ilimitado y seguro.
            </p>

          {/* Input Card */}
          <div className="bg-slate-900/50 border border-slate-700 p-2 rounded-2xl shadow-2xl backdrop-blur-xl max-w-2xl mx-auto transform transition-all hover:border-purple-500/30">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-24 py-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="Pega el enlace del video aquí..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Pegar
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 min-w-[160px]"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" /> Procesando</>
                ) : (
                  <><Download className="w-5 h-5" /> Descargar</>
                )}
              </button>
            </form>
          </div>
          
          {error && (
            <p className="mt-4 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg inline-block text-sm border border-red-400/20">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="max-w-4xl mx-auto px-4 pb-20 animate-fade-in-up">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center">
              
              {/* Preview */}
              <div className="relative group rounded-xl overflow-hidden bg-black aspect-video">
                <img 
                  src={result.thumbnail} 
                  alt={result.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium truncate">{result.title}</p>
                  <p className="text-slate-400 text-sm">{result.duration}</p>
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  Video listo para descargar
                </h3>
                
                {/* INSTRUCCIONES DE DESCARGA (NUEVO) */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-200">
                      <strong>Tip:</strong> Si el botón abre el video en una nueva pestaña, haz 
                      <span className="font-bold text-white"> Clic derecho sobre el video</span> y selecciona 
                      <span className="italic text-white"> "Guardar video como..."</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.formats && result.formats.length > 0 ? (
                    result.formats.map((format, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${format.type === 'MP3' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Video size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{format.quality || 'HD'}</p>
                            <p className="text-xs text-slate-500">{format.type} • {format.size}</p>
                          </div>
                        </div>
                        {/* BOTÓN CON ATRIBUTOS EXTRA */}
                        <a 
                          href={format.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download={`video_sora_${idx}.mp4`} 
                          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg group-hover:bg-purple-600 transition-colors flex items-center gap-2 hover:no-underline hover:text-white"
                        >
                          Descargar <Download size={14} />
                        </a>
                      </div>
                    ))
                  ) : (
                     <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                        No se encontraron formatos compatibles.
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 p-4 text-center border-t border-slate-800">
              <p className="text-purple-300 text-sm flex items-center justify-center gap-2">
                <Zap size={14} /> Enlace generado exitosamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="bg-slate-900/50 py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué usar nuestro descargador?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-green-400" />}
              title="Sin Marcas de Agua"
              desc="Obtén el video original limpio. Eliminamos automáticamente los logos y marcas de TikTok o Sora."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Ultra Rápido"
              desc="Nuestra infraestructura optimizada procesa y convierte los videos en milisegundos."
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-blue-400" />}
              title="Compatible con Móviles"
              desc="Funciona perfectamente en iPhone, Android, Tablets y cualquier navegador moderno."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg">
              <Download size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">SoraDownloader</span>
          </div>
          
          <div className="flex gap-6 text-slate-500">
            <a href="#" className="hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
          </div>

          <div className="text-sm text-slate-500">
            © 2024 SoraDownloader. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all hover:-translate-y-1">
    <div className="bg-slate-900 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400">{desc}</p>
  </div>
);

export default App;