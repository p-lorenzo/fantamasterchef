const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("fanta.sqlite");

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE SETUP ---
db.exec(`
  CREATE TABLE IF NOT EXISTS impostazioni (
    id INTEGER PRIMARY KEY,
    classifica_reale TEXT
  );
  CREATE TABLE IF NOT EXISTS pronostici (
    id INTEGER PRIMARY KEY,
    nome TEXT UNIQUE,
    lista TEXT
  );
`);

// --- LOGICA CALCOLO (Traduzione dal tuo Python) ---
function getPiazzamenti(lista) {
  let p = {};
  lista.forEach((nome, i) => {
    let n = nome.trim();
    if (i === 0) p[n] = 1;
    else if (i === 1 || i === 2) p[n] = 2;
    else p[n] = i;
  });
  return p;
}

// --- API ROUTES ---

// 1. Salva la classifica reale
app.post("/api/config", (req, res) => {
  const { classificaReale } = req.body;
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO impostazioni (id, classifica_reale) VALUES (1, ?)",
  );
  stmt.run(JSON.stringify(classificaReale));
  res.send({ status: "ok" });
});

// 2. Salva il pronostico di un amico
app.post("/api/pronostici", (req, res) => {
  const { nome, lista } = req.body;
  try {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO pronostici (nome, lista) VALUES (?, ?)",
    );
    stmt.run(nome, JSON.stringify(lista));
    res.send({ status: "salvato" });
  } catch (err) {
    res.status(400).send({ error: "Errore nel salvataggio" });
  }
});

// 3. Calcola la graduatoria (Delta e Pin)
app.get("/api/graduatoria", (req, res) => {
  const conf = db
    .prepare("SELECT classifica_reale FROM impostazioni WHERE id = 1")
    .get();
  if (!conf) return res.json([]);

  const reale = JSON.parse(conf.classifica_reale);
  const p_reali = getPiazzamenti(reale);
  const tuttiIPronostici = db.prepare("SELECT * FROM pronostici").all();

  const risultati = tuttiIPronostici.map((p) => {
    const listaAmico = JSON.parse(p.lista);
    const p_amico = getPiazzamenti(listaAmico);
    let delta = 0,
      pin = 0;

    reale.forEach((conc) => {
      let c = conc.trim();
      if (p_amico[c] !== undefined) {
        delta += Math.abs(p_reali[c] - p_amico[c]);
        if (p_reali[c] === p_amico[c]) pin++;
      }
    });
    return { nome: p.nome, delta, pin };
  });

  // Ordinamento: Delta ASC, Pin DESC, Nome ASC
  risultati.sort(
    (a, b) =>
      a.delta - b.delta || b.pin - a.pin || a.nome.localeCompare(b.nome),
  );
  res.json(risultati);
});

// --- SERVING FRONTEND (React) ---
// Assicurati di aver fatto 'npm run build' nel frontend e copiato la cartella 'dist' qui
app.use(express.static(path.join(__dirname, "dist")));

// Gestione rotte React (Catch-all)
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server Fantamasterchef attivo su porta ${PORT}`);
});
