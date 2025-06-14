import db from '../db.mjs';
import dayjs from 'dayjs';
import { Card, Game, Round } from '../models/Games.mjs';

// Mapping functions
function mapRowsToCards(rows) {
    return rows.map(row => new Card(row.card_id, row.description, row.image, row.misfortune_index));
}

function mapRowsToGames(rows) {
    return rows.map(row => new Game(row.game_id, row.user_id, row.date, row.status));
}

function mapRowsToRounds(rows) {
    return rows.map(row => new Round(row.round_id, row.game_id, row.card_id, row.round_number, row.guessed_correctly, row.chosen_position, row.time));
}

function getRandomValues(arr, numValues) {
    let shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numValues);
}

export default function GameDao() {

    // Get N random cards (excluding those in excludeIds)
    this.getRandomCards = (numCards, excludeIds = []) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM cards';
            let params = [];
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

    // Get card by ID
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

    // Get cards by IDs
    this.getCardsByIds = (card_ids) => {
        return new Promise((resolve, reject) => {
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

    // Create a new game
    this.addGame = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO games (user_id, date, status) VALUES (?, datetime("now"), "ongoing")';
            db.run(query, [user_id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // game_id
                }
            });
        });
    };

    // Get a game by ID
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

    // Update game status (win/lose only, not ongoing)
    this.updateGameStatus = (game_id, status) => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE games SET status = ? WHERE game_id = ?';
            db.run(query, [status, game_id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    // Add initial cards to a game (round_number=0, guessed_correctly=1)
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

    // Get initial cards for a game
    this.getInitialCards = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.* FROM cards c
                JOIN rounds r ON r.card_id = c.card_id
                WHERE r.game_id = ? AND r.round_number = 0
                ORDER BY c.misfortune_index ASC
            `;
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToCards(rows));
            });
        });
    };

    // Create a new round
    this.addRound = (game_id, card_id, round_number) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO rounds (game_id, card_id, round_number, guessed_correctly, chosen_position, time) VALUES (?, ?, ?, ?, ?, ?)';
            const now = dayjs().toISOString();
            console.log('QUERY:', query);
            console.log('VALORI:', [game_id, card_id, round_number, 0, null, now]);
            db.run(query, [game_id, card_id, round_number, 0, null, now], function (err) {
            if (err) reject(err);
            else resolve(this.lastID); // round_id
            });
        });
    };

    // Update round result
    this.updateRoundResult = (round_id, guessed_correctly, chosen_position) => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE rounds SET guessed_correctly = ?, chosen_position = ? WHERE round_id = ?';
            db.run(query, [guessed_correctly, chosen_position, round_id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    // Get all rounds for a game
    this.getRoundsByGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number ASC';
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToRounds(rows));
            });
        });
    };

    // Get the last round number for a game
    this.getLastRoundNumber = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT MAX(round_number) as maxRound FROM rounds WHERE game_id = ?';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row && row.maxRound ? row.maxRound : 0);
            });
        });
    };

    // Get only the IDs of the initial cards for a game (usando la tabella initial_game_cards)
    this.getInitialCardIds = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT card_id FROM initial_game_cards WHERE game_id = ?";
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.card_id));
            });
        });
    };

    // Get all card_ids already used in a game (rounds)
    this.getUsedCardIdsInGame = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT card_id FROM rounds WHERE game_id = ?';
            db.all(query, [game_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.card_id));
            });
        });
    };

    // Get won cards in a game (guessed_correctly = 1, excluding initial)
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

    // Ottieni i dati di una partita specifica
    this.getGameById = (game_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM games WHERE game_id = ?';
        db.get(query, [game_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
        });
    });
    };

    // Get all games for a user, ordered by date desc
    this.getGamesByUser = (user_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM games WHERE user_id = ? ORDER BY date DESC';
            db.all(query, [user_id], (err, rows) => {
                if (err) reject(err);
                else resolve(mapRowsToGames(rows));
            });
        });
    };

    // Get game history: all rounds (cards, results, round number) for a game
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

    // For demo: get 3 initial cards and 1 situation to guess, all random, ensuring no overlap
    this.getDemoCards = () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM cards', (err, rows) => {
                if (err) return reject(err);
                const cards = mapRowsToCards(rows);
                const initialCards = getRandomValues(cards, 3);
                const initialIds = initialCards.map(c => c.card_id);
                const remaining = cards.filter(c => !initialIds.includes(c.card_id));
                const roundCard = getRandomValues(remaining, 1)[0];
                resolve({ initialCards, roundCard });
            });
        });
    };

    // Count correct guesses (won rounds) in a game (excluding initial)
    this.countCorrectGuesses = (game_id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as cnt FROM rounds WHERE game_id = ? AND guessed_correctly = 1 AND round_number > 0';
            db.get(query, [game_id], (err, row) => {
                if (err) reject(err);
                else resolve(row.cnt);
            });
        });
    };

    // Count failed rounds in a game (excluding initial)
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