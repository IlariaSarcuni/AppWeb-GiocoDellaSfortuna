import db from '../db.mjs';
import dayjs from 'dayjs';
import { Card, Game, Round } from '../models/Games.mjs';

//Coverte le righe del db in istanze del modello
function mapRowsToCards(rows) {
    return rows.map(row => new Card(row.card_id, row.description, row.image, row.misfortune_index));
}
function mapRowsToGames(rows) {
    return rows.map(row => new Game(row.game_id, row.user_id, row.date, row.status));
}
function mapRowsToRounds(rows) {
    return rows.map(row => new Round(row.round_id, row.game_id, row.card_id, row.round_number, row.guessed_correctly, row.chosen_position, row.time));
}
//Funzione per ottenere N valori casuali da un array
function getRandomValues(arr, numValues) {
    let shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numValues);
}

export default function GameDao() {
    // Ottieni N carte random escludendo quelle in excludeIds
    this.getRandomCards = (numCards, excludeIds = []) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cards';
            let params = [];
            // Controlla se l'array excludeIds contiene qualcosa
            if (excludeIds.length) {
                query += ` WHERE card_id NOT IN (${excludeIds.map(() => '?').join(",")})`;
                params = excludeIds;
            }
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = mapRowsToCards(rows);
                    const randomCards = getRandomValues(cards, numCards);
                    resolve(randomCards);
                }
            });
        });
    };

    // Ottieni una carta tramite id
    this.getCardById = (card_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM cards WHERE card_id = ?';
            db.get(query, [card_id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? new Card(row.card_id, row.description, row.image, row.misfortune_index) : null);
                }
            });
        });
    };

    // Ottieni più carte tramite una lista di id
    this.getCardsByIds = (card_ids) => {
        return new Promise((resolve, reject) => {
            //termina se l'array card_ids è vuoto
            if (!card_ids.length) return resolve([]);
            const query = `SELECT * FROM cards WHERE card_id IN (${card_ids.map(() => '?').join(",")})`;
            db.all(query, card_ids, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(mapRowsToCards(rows));
                }
            });
        });
    };

    // Crea una nuova partita per l'utente dato
    this.addGame = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO games (user_id, date, status) VALUES (?, ?, ?)';
            db.run(query, [user_id, dayjs().format('YYYY-MM-DD HH:mm:ss'), "ongoing"], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // game_id generato
                }
            });
        });
    };

    // Ottieni una partita tramite id
    this.getGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM games WHERE game_id = ?';
            db.get(query, [game_id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? new Game(row.game_id, row.user_id, row.date, row.status) : null);
                }
            });
        });
    };

    // Aggiorna lo stato di una partita (win/lose)
    this.updateGameStatus = (game_id, status) => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE games SET status = ? WHERE game_id = ?';
            db.run(query, [status, game_id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }; 

    // Salva le carte iniziali di una partita
    this.addInitialCards = (game_id, card_ids) => {
        return Promise.all(card_ids.map(card_id => {
            return new Promise((resolve, reject) => {
                const query = 'INSERT INTO initial_game_cards (game_id, card_id) VALUES (?, ?)';
                db.run(query, [game_id, card_id], function (err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }));
    };

    // Ottieni le carte iniziali della partita
    this.getInitialCards = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.* FROM cards c
                JOIN initial_game_cards ic ON ic.card_id = c.card_id
                WHERE ic.game_id = ?
                ORDER BY c.misfortune_index ASC
            `;
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToCards(rows));
            });
        });
    };

    // Aggiungi un nuovo round alla partita
    this.addRound = (game_id, card_id, round_number) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO rounds (game_id, card_id, round_number, guessed_correctly, chosen_position, time) VALUES (?, ?, ?, ?, ?, ?)';
            db.run(query, [game_id, card_id, round_number, 0, null, dayjs().format('YYYY-MM-DD HH:mm:ss')], function (err) {
                if (err) reject(err);
                else resolve(this.lastID); // round_id generato
            });
        });
    };

    // Aggiorna il risultato di un round (corretta/errata e posizione scelta)
    this.updateRoundResult = (round_id, guessed_correctly, chosen_position) => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE rounds SET guessed_correctly = ?, chosen_position = ? WHERE round_id = ?';
            db.run(query, [guessed_correctly, chosen_position, round_id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    // Ottieni tutti i round di una partita
    this.getRoundsByGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number ASC';
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToRounds(rows));
            });
        });
    };

    // Ottieni il numero dell'ultimo round giocato in una partita
    this.getLastRoundNumber = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT MAX(round_number) as maxRound FROM rounds WHERE game_id = ?';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row && row.maxRound ? row.maxRound : 0);
            });
        });
    };

    // Ottieni solo gli ID delle carte iniziali per una partita
    this.getInitialCardIds = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT card_id FROM initial_game_cards WHERE game_id = ?";
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.card_id));
            });
        });
    };

    // Ottieni tutti gli ID delle carte già usate in una partita (rounds)
    this.getUsedCardIdsInGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT card_id FROM rounds WHERE game_id = ?';
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.card_id));
            });
        });
    };

    // Ottieni tutte le carte vinte in una partita (eccetto le iniziali)
    this.getWonCardsInGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.* FROM cards c
                JOIN rounds r ON c.card_id = r.card_id
                WHERE r.game_id = ? AND r.guessed_correctly = 1 AND r.round_number > 0
                ORDER BY c.misfortune_index ASC
            `;
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToCards(rows));
            });
        });
    };

    // Ottieni i dati di una partita tramite id (senza mappatura)
    this.getGameById = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM games WHERE game_id = ?';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    // Ottieni tutte le partite di un utente ordinate dalla più recente
    this.getGamesByUser = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM games WHERE user_id = ? ORDER BY date DESC';
            db.all(query, [user_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToGames(rows));
            });
        });
    };

    // Ottieni la cronologia di una partita (tutti i round)
    this.getGameHistory = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.round_number, r.guessed_correctly, c.description, c.image, c.misfortune_index, r.card_id
                FROM rounds r
                JOIN cards c ON c.card_id = r.card_id
                WHERE r.game_id = ?
                ORDER BY r.round_number ASC
            `;
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    // DEMO: ottieni 3 carte iniziali casuali e 1 situazione da indovinare
    this.getDemoCards = () => { //non prende argomenti perché non ha bisogno di informazioni esterne come un game_id
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM cards', (err, rows) => {
                if (err) return reject(err);
                const cards = mapRowsToCards(rows);
                const initialCards = getRandomValues(cards, 3); //array contenente gli ID delle 3 carte iniziali
                const initialIds = initialCards.map(c => c.card_id);
                const remaining = cards.filter(c => !initialIds.includes(c.card_id)); //crea un nuovo array senza le 3 carte già pescate
                const roundCard = getRandomValues(remaining, 1)[0];
                resolve({ initialCards, roundCard });
            });
        });
    };

    // Conta il numero di round vinti in una partita
    this.countCorrectGuesses = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as cnt FROM rounds WHERE game_id = ? AND guessed_correctly = 1 AND round_number > 0';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row.cnt);
            });
        });
    };

    // Conta il numero di round persi in una partita 
    this.countFailedGuesses = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as cnt FROM rounds WHERE game_id = ? AND guessed_correctly = 0 AND round_number > 0';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row.cnt);
            });
        });
    };
}
