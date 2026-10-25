import React, { useEffect, useState } from 'react';
import { Flame, RefreshCw, AlertCircle, Map, Info as InfoIcon, Settings, Siren, X, MapPin } from 'lucide-react';
import { Incident } from './types';
import { IncidentCard } from './components/IncidentCard';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('einsatze');
  const [selectedMapIncident, setSelectedMapIncident] = useState<Incident | null>(null);

  const activeIncidentsCount = incidents.filter(i => i.category !== 'INFO').length;

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setIncidents(data);
      setError(null);
      
      const now = new Date();
      setLastUpdated(now.toLocaleString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900 select-none">
      {/* Top Header */}
      <header className="relative px-6 pt-12 pb-16 flex flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/ef/MAN_TGM_fire_engine_at_night%2C_Warsaw%2C_Poland.jpg")' }}
        >
          <div className="absolute inset-0 bg-gray-900/30 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-12 bg-red-600 rounded-b-xl rounded-t-sm flex items-center justify-center shadow-sm relative overflow-hidden">
                 <div className="absolute -bottom-2 w-full h-8 bg-red-600 rounded-full"></div>
                 <Flame className="w-6 h-6 text-white relative z-10" />
             </div>
             <div>
               <h1 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">Feuerwehr</h1>
               <p className="text-gray-300 text-xs font-medium uppercase tracking-wider">Einsätze Aktuell</p>
             </div>
          </div>
          
          <button 
            onClick={() => { setLoading(true); fetchIncidents(); }}
            className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative z-10 mt-6">
          <h2 className="text-white text-3xl font-bold mb-2">Aktuelle Einsätze</h2>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-gray-300 text-sm">Letzte Aktualisierung: {lastUpdated || 'Lädt...'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-gray-50 rounded-t-3xl -mt-6 relative z-20 pt-6 px-4 min-h-screen pb-24">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {incidents.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-gray-500">
            <p>Keine aktuellen Einsätze.</p>
          </div>
        )}

        <div className="space-y-4">
          {incidents.map((incident) => (
            <IncidentCard 
              key={incident.id} 
              incident={incident} 
              onClick={(inc) => setSelectedMapIncident(inc)}
            />
          ))}
          
          {/* Always show Hint Card at the bottom */}
          <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-500 flex items-center justify-center shrink-0 mr-4 shadow-sm">
              <InfoIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Hinweis</h3>
              <p className="text-xs text-gray-500 leading-snug">
                Die angezeigten Daten werden in Echtzeit von der Leitstelle übertragen. 
                Keine Gewähr für die Richtigkeit.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Map Modal */}
      {selectedMapIncident && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[70vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex-1 pr-2">
                <h3 className="font-bold text-gray-900 line-clamp-1">{selectedMapIncident.title || selectedMapIncident.message}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{selectedMapIncident.location || selectedMapIncident.unit}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setSelectedMapIncident(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 relative">
              <iframe 
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent((selectedMapIncident.location || selectedMapIncident.unit) + ', Landkreis Wittenberg, Sachsen-Anhalt')}&hl=de&z=14&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-0 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center max-w-md mx-auto h-16">
          <button 
            onClick={() => setActiveTab('einsatze')}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 relative ${activeTab === 'einsatze' ? 'text-red-600' : 'text-gray-400'}`}
          >
            {activeTab === 'einsatze' && (
              <div className="absolute top-0 w-8 h-0.5 bg-red-600 rounded-b-md" />
            )}
            <div className="relative">
              <Siren className="w-6 h-6 mt-1" />
              {activeIncidentsCount > 0 && (
                <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-white shadow-sm flex items-center justify-center">
                  {activeIncidentsCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">Einsätze</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('karte')}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 relative ${activeTab === 'karte' ? 'text-red-600' : 'text-gray-400'}`}
          >
            {activeTab === 'karte' && (
              <div className="absolute top-0 w-8 h-0.5 bg-red-600 rounded-b-md" />
            )}
            <Map className="w-6 h-6 mt-1" />
            <span className="text-[10px] font-medium">Karte</span>
          </button>

          <button 
            onClick={() => setActiveTab('info')}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 relative ${activeTab === 'info' ? 'text-red-600' : 'text-gray-400'}`}
          >
            {activeTab === 'info' && (
              <div className="absolute top-0 w-8 h-0.5 bg-red-600 rounded-b-md" />
            )}
            <InfoIcon className="w-6 h-6 mt-1" />
            <span className="text-[10px] font-medium">Info</span>
          </button>

          <button 
            onClick={() => setActiveTab('einstellungen')}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 relative ${activeTab === 'einstellungen' ? 'text-red-600' : 'text-gray-400'}`}
          >
            {activeTab === 'einstellungen' && (
              <div className="absolute top-0 w-8 h-0.5 bg-red-600 rounded-b-md" />
            )}
            <Settings className="w-6 h-6 mt-1" />
            <span className="text-[10px] font-medium">Einstellungen</span>
          </button>
        </div>
      </nav>
    </div>
  );
}


