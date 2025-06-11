import db from "./db.mjs";
import { Game, Card, Round, InitialGameCard } from "./models/games.mjs";
import dayjs from "dayjs";

/**
 * Utility per mappare righe a oggetti Card
 */
function mapRowsToCards(rows) {
    return rows.map(row => new Card(row.card_id, row.description, row.image, row.misfortune_index));
}

/**
 * Utility per mappare righe a oggetti Game
 */
function mapRowsToGames(rows) {
    return rows.map(row => new Game(row.game_id, row.user_id, row.date, row.status));
}

/**
 * Utility per mappare righe a oggetti Round
 */
function mapRowsToRounds(rows) {
    return rows.map(row =>
        new Round(
            row.round_id,
            row.game_id,
            row.card_id,
            row.round_number,
            row.guessed_correctly,
            row.chosen_position,
            row.time
        )
    );
}

/**
 * Utility per mappare righe a oggetti InitialGameCard
 */
function mapRowsToInitialGameCards(rows) {
    return rows.map(row => new InitialGameCard(row.id, row.game_id, row.card_id));
}

export default function GameDAO() {

    this.getRandomCards = (count = 1, excludeCardIds = [], withMisfortuneIndex = true) => {
        return new Promise((resolve, reject) => {
            if (count <= 0) return reject(new Error("Il numero di carte richieste deve essere maggiore di zero."));
            let query = `SELECT * FROM cards`;
            let params = [];
            if (excludeCardIds.length > 0) {
                query += ` WHERE card_id NOT IN (${excludeCardIds.map(() => '?').join(',')})`;
                params = excludeCardIds;
            }
            query += ` ORDER BY RANDOM() LIMIT ?`;
            params.push(count);

            db.all(query, params, (err, rows) => {
                if (err) return reject(new Error("Errore nel recupero delle carte random: " + err.message));
                if (!rows || rows.length === 0) return reject(new Error("Nessuna carta disponibile per i parametri indicati."));
                // Se non serve il misfortune_index, lo rimuovo
                if (!withMisfortuneIndex) {
                    rows = rows.map(({card_id, description, image}) => ({card_id, description, image}));
                }
                // Ritorna array o singolo oggetto a seconda di count
                return count === 1 ? resolve(rows[0]) : resolve(rows);
            });
        });
    };

    this.createGame = (user_id, initialCardIds = [], status = 'ongoing') => {
        return new Promise((resolve, reject) => {
            if (!user_id) return reject(new Error("user_id non fornito"));
            const query = `INSERT INTO games (user_id, date, status) VALUES (?, ?, ?)`;
            const date = dayjs().toISOString();
            db.run(query, [user_id, date, status], function (err) {
                if (err) return reject(new Error("Errore creazione partita: " + err.message));
                const gameId = this.lastID;
                if (initialCardIds.length === 0) return resolve(gameId);
                const stmt = db.prepare(`INSERT INTO initial_game_cards (game_id, card_id) VALUES (?, ?)`);
                initialCardIds.forEach(cardId => stmt.run(gameId, cardId));
                stmt.finalize();
                resolve(gameId);
            });
        });
    };

    /**
     * Recupera tutte le partite di un utente (cronologia)
     * @param {number} user_id
     * @returns {Promise<Array<Game>>}
     */
    this.getGamesByUserId = (user_id) => {
        return new Promise((resolve, reject) => {
            if (!user_id) return reject(new Error("user_id non fornito"));
            db.all('SELECT * FROM games WHERE user_id = ? ORDER BY date DESC', [user_id], (err, rows) => {
                if (err) return reject(new Error("Errore recupero partite utente: " + err.message));
                resolve(mapRowsToGames(rows));
            });
        });
    };

    /**
     * Recupera una partita specifica
     * @param {number} game_id
     * @returns {Promise<Game|null>}
     */
    this.getGameById = (game_id) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.get('SELECT * FROM games WHERE game_id = ?', [game_id], (err, row) => {
                if (err) return reject(new Error("Errore recupero partita: " + err.message));
                if (!row) resolve(null);
                else resolve(new Game(row.game_id, row.user_id, row.date, row.status));
            });
        });
    };


    this.updateGameStatus = (game_id, status) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.run('UPDATE games SET status = ? WHERE game_id = ?', [status, game_id], function (err) {
                if (err) return reject(new Error("Errore aggiornamento stato partita: " + err.message));
                else resolve();
            });
        });
    };

    /**
     * Recupera tutte le carte iniziali di una partita
     * @param {number} game_id
     * @returns {Promise<Array<Card>>}
     */
    this.getInitialCardsOfGame = (game_id) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.all(
                `SELECT c.* FROM initial_game_cards igc JOIN cards c ON igc.card_id = c.card_id WHERE igc.game_id = ? ORDER BY c.misfortune_index ASC`,
                [game_id],
                (err, rows) => {
                    if (err) return reject(new Error("Errore recupero carte iniziali: " + err.message));
                    if (!rows || rows.length === 0) return reject(new Error("Nessuna carta iniziale trovata per questa partita."));
                    resolve(mapRowsToCards(rows));
                }
            );
        });
    };

    this.getRoundsOfGame = (game_id) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.all(
                `SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number`,
                [game_id],
                (err, rows) => {
                    if (err) return reject(new Error("Errore recupero round: " + err.message));
                    resolve(mapRowsToRounds(rows));
                }
            );
        });
    };

    /**
     * Ottieni una carta random per il round successivo, escludendo quelle già in mano e già giocate.
     * Se withMisfortuneIndex è false, non viene restituito il campo misfortune_index.
     */
    this.getNextRoundCard = (excludeCardIds = [], withMisfortuneIndex = false) => {
        return this.getRandomCards(1, excludeCardIds, withMisfortuneIndex)
            .then(card => card)
            .catch(err => { throw err; });
    };

    /**
     * Recupera solo le carte vinte in una partita
     * @param {number} game_id
     * @returns {Promise<Array<{card: Card, round_number: number}>>}
     */
    this.getWonCardsOfGame = (game_id) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.all(
                `SELECT c.*, r.round_number FROM rounds r JOIN cards c ON r.card_id = c.card_id WHERE r.game_id = ? AND r.guessed_correctly = 1 ORDER BY r.round_number`,
                [game_id],
                (err, rows) => {
                    if (err) return reject(new Error("Errore recupero carte vinte: " + err.message));
                    resolve(rows.map(row => ({
                        card: new Card(row.card_id, row.description, row.image, row.misfortune_index),
                        round_number: row.round_number
                    })));
                }
            );
        });
    };

    /**
     * Aggiungi un nuovo round
     */
    this.addRound = (game_id, card_id, round_number, guessed_correctly, chosen_position, time) => {
        return new Promise((resolve, reject) => {
            if (!game_id || !card_id || !round_number) return reject(new Error("Parametri round insufficienti"));
            db.run(
                `INSERT INTO rounds (game_id, card_id, round_number, guessed_correctly, chosen_position, time) VALUES (?, ?, ?, ?, ?, ?)`,
                [game_id, card_id, round_number, guessed_correctly, chosen_position, time],
                function (err) {
                    if (err) return reject(new Error("Errore inserimento round: " + err.message));
                    else resolve(this.lastID);
                }
            );
        });
    };

    /* Eimina una partita (e le sue carte iniziali e round) */
    this.deleteGameById = (game_id) => {
        return new Promise((resolve, reject) => {
            if (!game_id) return reject(new Error("game_id non fornito"));
            db.serialize(() => {
                db.run('DELETE FROM initial_game_cards WHERE game_id = ?', [game_id]);
                db.run('DELETE FROM rounds WHERE game_id = ?', [game_id]);
                db.run('DELETE FROM games WHERE game_id = ?', [game_id], function (err) {
                    if (err) return reject(new Error("Errore eliminazione partita: " + err.message));
                    else resolve();
                });
            });
        });
    };

    /**
     * Funzione per partita demo utenti anonimi: 3 carte in mano + 1 carta da indovinare (senza misfortune_index)
    
     */
    this.getDemoCards = () => {
        return this.getRandomCards(3, [], true).then(initialCards => {
            const initialIds = initialCards.map(c => c.card_id);
            return this.getRandomCards(1, initialIds, false)
                .then(roundCard => ({
                    initialCards,
                    roundCard
                }));
        }).catch(err => { throw err; });
    };

    /**
     * Ottieni una carta per card_id (usata per mostrare la carta con misfortune_index dopo il round)
     */
    this.getCardById = (card_id) => {
        return new Promise((resolve, reject) => {
            if (!card_id) return reject(new Error("card_id non fornito"));
            db.get('SELECT * FROM cards WHERE card_id = ?', [card_id], (err, row) => {
                if (err) return reject(new Error("Errore recupero carta: " + err.message));
                if (!row) resolve(null);
                else resolve(new Card(row.card_id, row.description, row.image, row.misfortune_index));
            });
        });
    };
}