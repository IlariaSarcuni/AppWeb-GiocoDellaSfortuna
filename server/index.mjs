import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import passport from 'passport';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';

import GameDAO from './dao/gameDAO.mjs';
import UserDAO from './dao/userDAO.mjs';

const userDAO = new UserDAO();
const gameDAO = new GameDAO();

const app = express();
const port = 3001;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Passport local strategy
passport.use(new LocalStrategy(async (username, password, cb) => {
    try {
        const user = await userDAO.getUser(username, password);
        if (!user)
            return cb(null, false, { message: 'Incorrect username or password.' });
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}));

passport.serializeUser(function (user, cb) {
    cb(null, user.user_id);
});

passport.deserializeUser(async function (id, cb) {
    try {
        const user = await userDAO.getUserById(id);
        cb(null, user);
    } catch (err) {
        cb(err, null);
    }
});

app.use(session({
    secret: "it is a secret!",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authorized' });
};

// --------- API ROUTES ---------

// --- Auth ---
// 1. POST /api/sessions
app.post('/api/sessions', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.status(401).json({ error: 'Email o Password errata' });
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(201).json(req.user);
        });
    })(req, res, next);
});

// 2. GET /api/sessions/current
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else
        res.status(401).json({ error: 'Not authenticated' });
});

// 3. DELETE /api/sessions/current
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.end();
    });
});

// --- Cards ---
// GET /api/cards
app.get('/api/cards', isLoggedIn, async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 1;
        const exclude = Array.isArray(req.query.exclude) ? req.query.exclude.map(Number) : req.query.exclude ? [Number(req.query.exclude)] : [];
        const withMisfortuneIndex = req.query.withMisfortuneIndex !== "false";
        const cards = await gameDAO.getRandomCards(count, exclude, withMisfortuneIndex);
        res.json(cards);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/cards/:id
app.get('/api/cards/:id', isLoggedIn, async (req, res) => {
    try {
        const card = await gameDAO.getCardById(Number(req.params.id));
        if (!card) return res.status(404).json({ error: "Carta non trovata" });
        res.json(card);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Games ---
// POST /api/games
app.post('/api/games', isLoggedIn, async (req, res) => {
    const { user_id, initialCardIds, status } = req.body;
    try {
        const game_id = await gameDAO.createGame(user_id, initialCardIds, status || 'ongoing');
        res.status(201).json({ game_id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/games/user/:userId
app.get('/api/games/user/:userId', isLoggedIn, async (req, res) => {
    try {
        const games = await gameDAO.getGamesByUserId(Number(req.params.userId));
        res.json(games);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/games/:gameId
app.get('/api/games/:gameId', isLoggedIn, async (req, res) => {
    try {
        const game = await gameDAO.getGameById(Number(req.params.gameId));
        if (!game) return res.status(404).json({ error: "Partita non trovata" });
        res.json(game);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH /api/games/:gameId/status
app.patch('/api/games/:gameId/status', isLoggedIn, async (req, res) => {
    try {
        await gameDAO.updateGameStatus(Number(req.params.gameId), req.body.status);
        res.status(200).json({});
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/games/:gameId
app.delete('/api/games/:gameId', isLoggedIn, async (req, res) => {
    try {
        await gameDAO.deleteGameById(Number(req.params.gameId));
        res.status(200).json({});
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/games/:gameId/initial-cards
app.get('/api/games/:gameId/initial-cards', isLoggedIn, async (req, res) => {
    try {
        const cards = await gameDAO.getInitialCardsOfGame(Number(req.params.gameId));
        res.json(cards);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Rounds ---
// GET /api/games/:gameId/rounds
app.get('/api/games/:gameId/rounds', isLoggedIn, async (req, res) => {
    try {
        const rounds = await gameDAO.getRoundsOfGame(Number(req.params.gameId));
        res.json(rounds);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/games/:gameId/rounds
app.post('/api/games/:gameId/rounds', isLoggedIn, async (req, res) => {
    const { card_id, round_number, guessed_correctly, chosen_position, time } = req.body;
    try {
        const round_id = await gameDAO.addRound(
            Number(req.params.gameId),
            card_id,
            round_number,
            guessed_correctly,
            chosen_position,
            time
        );
        res.status(201).json({ round_id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/games/:gameId/rounds/won
app.get('/api/games/:gameId/rounds/won', isLoggedIn, async (req, res) => {
    try {
        const wonCards = await gameDAO.getWonCardsOfGame(Number(req.params.gameId));
        res.json(wonCards);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Carta per il prossimo round ---
app.get('/api/games/:gameId/next-card', isLoggedIn, async (req, res) => {
    const exclude = Array.isArray(req.query.exclude) ? req.query.exclude.map(Number) : req.query.exclude ? [Number(req.query.exclude)] : [];
    const withMisfortuneIndex = req.query.withMisfortuneIndex === "true";
    try {
        const card = await gameDAO.getNextRoundCard(exclude, withMisfortuneIndex);
        res.json(card);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Demo partita anonima ---
app.get('/api/demo', async (req, res) => {
    try {
        const demo = await gameDAO.getDemoCards();
        res.json(demo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Not found handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Avvia server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

