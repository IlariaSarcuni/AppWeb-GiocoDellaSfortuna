import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import passport from 'passport';
import session from 'express-session';
import LocalStrategy from 'passport-local';
import { getUser } from './dao/userDAO.mjs';
import GameDAO from './dao/gameDAO.mjs';

const gameDao = new GameDAO();

const app = express();
const port = 3001;

// Middleware
app.use(morgan('dev'));
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};

app.use(cors(corsOptions));

// Serve le immagini delle carte (cartella /img nella root del progetto)
app.use('/img', express.static('img'))

// --- AUTH ---
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "It is a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


// --------- API ROUTES ---------

// --- Auth ---
// POST /api/sessions
app.post('/api/sessions', passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);
  }
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/sessions/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// --- GAME ROUTES (autenticato) ---

// 1. Ottieni 3 carte random (iniziali) per una nuova partita
app.get('/api/game/init-cards', isLoggedIn, async (req, res) => {
  try {
    const usedIds = req.query.exclude ? req.query.exclude.split(',').map(Number) : [];
    const cards = await gameDao.getRandomCards(3, usedIds);
    res.json(cards);
  } catch (err) {
    res.status(500).end();
  }
});

// 2. Crea nuova partita
app.post('/api/game', isLoggedIn, async (req, res) => {
  try {
    const user_id = req.user.id;
    const game_id = await gameDao.addGame(user_id);
    res.json({ game_id });
  } catch (err) {
    res.status(500).json({ error: `Database error during game creation: ${err}` });
  }
});;

// 3. Recupera le carte iniziali in una partita
app.get('/api/game/:game_id/init-cards', isLoggedIn, async (req, res) => {
  try {
    const game_id = req.params.game_id;
    const cards = await gameDao.getInitialCards(game_id);
    res.json(cards);
  } catch (err) {
    console.error("ERRORE getInitialCards:", err);
    res.status(500).json({ error: `Database error during initial card retrieval: ${err}` });
  }
});

// Salva le carte iniziali per una partita
app.post('/api/game/:game_id/init-cards', isLoggedIn, async (req, res) => {
  try {
    const game_id = req.params.game_id;
    const card_ids = req.body.card_ids;
    console.log("game_id:", game_id, "card_ids:", card_ids);
    await gameDao.addInitialCards(game_id, card_ids);
    res.status(201).end();
  } catch (err) {
    console.error("ERRORE addInitialCards:", err);
    res.status(500).json({ error: `Database error during initial card assignment: ${err}` });
  }
});

// 4. Ottieni la situazione da indovinare (una card non tra quelle già usate/iniziali/vinte)
app.get('/api/game/:game_id/situation', isLoggedIn, async (req, res) => {
  try {
    const game_id = req.params.game_id;

    //Prendi tutte le carte iniziali
    const initialIds = await gameDao.getInitialCardIds(game_id);

    //Prendi tutte le carte vinte (già possedute) 
    const wonCards = await gameDao.getWonCardsInGame(game_id);
    const wonIds = wonCards.map(c => c.card_id);

    //Prendi tutte le carte già usate nei round
    const usedIds = await gameDao.getUsedCardIdsInGame(game_id);

    //Unisci tutti gli id da escludere (senza duplicati)
    const excludeIds = Array.from(new Set([...initialIds, ...wonIds, ...usedIds]));

    // Pesca una carta random escludendo quelle sopra
    const cards = await gameDao.getRandomCards(1, excludeIds);

    //Manda la carta (o errore se nessuna disponibile)
    if (!cards.length) {
      res.status(404).json({ error: "Nessuna carta disponibile!" });
    } else {
      res.json(cards[0]);
    }

  } catch (err) {
    console.error("Errore get situation:", err);
    res.status(500).end();
  }
});

// 5. Aggiungi un nuovo round alla partita
app.post('/api/game/:game_id/round', isLoggedIn, async (req, res) => {
  try {
    const { card_id, round_number } = req.body;
    console.log('game_id:', req.params.game_id, 'card_id:', card_id, 'round_number:', round_number);
    const round_id = await gameDao.addRound(req.params.game_id, card_id, round_number);
    res.json({ round_id });
  } catch (err) {
    console.error('Errore aggiunta round:', err);
    res.status(500).json({ error: `Database error during adding round: ${err}` });
  }
});

// 6. Aggiorna esito del round
app.put('/api/game/round/:round_id', isLoggedIn, async (req, res) => {
  try {
    const { guessed_correctly, chosen_position } = req.body;
    await gameDao.updateRoundResult(req.params.round_id, guessed_correctly, chosen_position);
    res.status(200).end();
  } catch (err) {
    res.status(500).json({ error: `Database error during round update: ${err}` });
  }
});

// 7. Ottieni tutte le carte vinte in una partita
app.get('/api/game/:game_id/won-cards', isLoggedIn, async (req, res) => {
  try {
    const cards = await gameDao.getWonCardsInGame(req.params.game_id);
    res.json(cards);
  } catch (err) {
    res.status(500).end();
  }
});

// 8. Storico partite utente
app.get('/api/games/user=:user_id', isLoggedIn, async (req, res) => {
  try {
    const games = await gameDao.getGamesByUser(req.params.user_id);
    res.json(games);
  } catch (err) {
    res.status(500).end();
  }
});

// 9. Dettaglio cronologia di una partita
app.get('/api/game/:game_id/history', isLoggedIn, async (req, res) => {
  try {
    const history = await gameDao.getGameHistory(req.params.game_id);
    res.json(history);
  } catch (err) {
    res.status(500).end();
  }
});

// 10. Aggiorna stato partita (vinta/persa)
app.put('/api/game/:game_id/status', isLoggedIn, async (req, res) => {
  try {
    const { status } = req.body;
    await gameDao.updateGameStatus(req.params.game_id, status);
    res.status(200).end();
  } catch (err) {
    res.status(500).json({ error: `Database error during game status update: ${err}` });
  }
});

// Restituisce la partita in corso per l'utente loggato
app.get('/api/game/ongoing', isLoggedIn, async (req, res) => {
  try {
    const user_id = req.user.id;
    const game = await gameDao.getOngoingGame(user_id);
    if (game) res.json(game);
    else res.status(404).json({error: "No ongoing game"});
  } catch (err) {
    res.status(500).json({error: "Database error"});
  }
});

// 11. Ottieni i dati di una singola partita (detto "summary")
  app.get('/api/game/:game_id', isLoggedIn, async (req, res) => {
    console.log("Richiesta dati partita:", req.params.game_id);
    try {
      const game = await gameDao.getGameById(req.params.game_id);
      if (!game) {
        res.status(404).json({ error: "Partita non trovata" });
        return;
      }
      res.json(game);
    } catch (err) {
      res.status(500).json({ error: `Database error during game fetch: ${err}` });
    }
  });
// --- DEMO (pubblica, NO login) ---

// 12. Partita demo: 3 carte iniziali + 1 situazione random
app.get('/api/demo', async (req, res) => {
  try {
    const result = await gameDao.getDemoCards();
    res.json(result);
  } catch (err) {
    res.status(500).end();
  }
});

// --- Not found handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// --- Avvia server ---
app.listen(port, () => { console.log(`API server started at http://localhost:${port}`); });

