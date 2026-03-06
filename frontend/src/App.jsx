import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// SOSTITUISCI con l'IP pubblico della tua VPS Oracle (es: http://152.xx.xx.xx:3001)
// Se lasci così, funzionerà solo in locale durante lo sviluppo.
const API_URL = window.location.origin.includes("localhost")
  ? "http://localhost:3001/api"
  : "/api";

function App() {
  const [classificaReale, setClassificaReale] = useState("");
  const [nomeAmico, setNomeAmico] = useState("");
  const [pronosticoAmico, setPronosticoAmico] = useState("");
  const [graduatoria, setGraduatoria] = useState([]);
  const [loading, setLoading] = useState(false);

  // Utilizziamo useCallback per definire la funzione di refresh in modo stabile
  const refreshDati = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/graduatoria`);
      setGraduatoria(res.data);
    } catch (err) {
      console.error("Errore nel recupero dati:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Caricamento iniziale
  useEffect(() => {
    refreshDati();
  }, [refreshDati]);

  const salvaConfig = async () => {
    const lista = classificaReale
      .split(",")
      .map((s) => s.trim())
      .filter((n) => n);
    if (lista.length === 0)
      return alert("Inserisci almeno un nome per la classifica reale!");

    try {
      await axios.post(`${API_URL}/config`, { classificaReale: lista });
      alert("Classifica ufficiale aggiornata!");
      refreshDati();
    } catch (err) {
      console.log(err);
      alert("Errore durante il salvataggio della configurazione.");
    }
  };

  const inviaPronostico = async () => {
    const lista = pronosticoAmico
      .split(",")
      .map((s) => s.trim())
      .filter((n) => n);
    if (!nomeAmico || lista.length === 0) {
      return alert("Inserisci il tuo nome e la tua classifica!");
    }

    try {
      await axios.post(`${API_URL}/pronostici`, { nome: nomeAmico, lista });
      alert("Pronostico inviato con successo!");
      setNomeAmico("");
      setPronosticoAmico("");
      refreshDati();
    } catch (err) {
      console.log(err);
      alert("Errore: assicurati che il nome sia unico.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-indigo-700 tracking-tight uppercase">
            🍳 FantaMasterchef
          </h1>
          <p className="text-gray-500 font-medium">
            VPS Edition • Real-time Rankings
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNA INPUT (1/3 spazio) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sezione Admin */}
            <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-indigo-500">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                👑 Admin: Risultato Reale
              </h2>
              <textarea
                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none h-28 text-sm"
                value={classificaReale}
                onChange={(e) => setClassificaReale(e.target.value)}
                placeholder="Nomi separati da virgola nell'ordine di uscita (vincitore per primo)"
              />
              <button
                onClick={salvaConfig}
                className="w-full mt-3 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Aggiorna Ufficiale
              </button>
            </div>

            {/* Sezione Amici */}
            <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-emerald-500">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                📝 Invia il tuo Pronostico
              </h2>
              <input
                type="text"
                placeholder="Tuo Nome (es: Fisho)"
                className="w-full p-3 border rounded-xl bg-gray-50 mb-3 outline-none focus:ring-2 focus:ring-emerald-400"
                value={nomeAmico}
                onChange={(e) => setNomeAmico(e.target.value)}
              />
              <textarea
                className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-400 h-28 text-sm"
                placeholder="La tua classifica (nomi separati da virgola)..."
                value={pronosticoAmico}
                onChange={(e) => setPronosticoAmico(e.target.value)}
              />
              <button
                onClick={inviaPronostico}
                className="w-full mt-3 bg-emerald-600 text-white font-bold py-2 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                Invia Pronostico
              </button>
            </div>
          </div>

          {/* COLONNA GRADUATORIA (2/3 spazio) */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-md min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📊 Graduatoria
                </h2>
                {loading && (
                  <span className="text-xs animate-pulse text-indigo-500 font-bold uppercase">
                    Aggiornamento...
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {graduatoria.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 italic">
                    Nessun dato presente. Inizia impostando la classifica reale!
                  </div>
                ) : (
                  graduatoria.map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${i === 0 ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-500"}`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-bold text-lg text-gray-700">
                          {r.nome}
                        </span>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-[10px] uppercase text-gray-400 font-black">
                            Delta
                          </p>
                          <p className="text-xl font-mono font-bold text-red-500">
                            {r.delta}
                          </p>
                        </div>
                        <div className="text-center border-l pl-6">
                          <p className="text-[10px] uppercase text-gray-400 font-black">
                            Pin
                          </p>
                          <p className="text-xl font-mono font-bold text-blue-500">
                            {r.pin}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
