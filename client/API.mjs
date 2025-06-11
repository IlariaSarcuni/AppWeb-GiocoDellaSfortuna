import { Card, Game, InitialGameCard, Round } from '../models.mjs/Games.mjs';

const SERVER_URL = 'http://localhost:3001';

// ================== AUTH ==================

const logIn = async (credentials) => {
  const response = await fetch(`${SERVER_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw new Error(errDetails || 'Email o Password errata!');
  }
};

const getUserInfo = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    throw null;
  }
};

const logOut = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (response.ok) {
    return null;
  } else {
    throw new Error('Logout fallito');
  }
};

// ================== CARDS ==================

const getInitialCards = async (count = 3) => {
  const response = await fetch(`${SERVER_URL}/api/cards?count=${count}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    const cards = await response.json();
    // cards: array di plain object { card_id, description, image, misfortune_index }
    return cards.map(c => new Card(c.card_id, c.description, c.image, c.misfortune_index));
  } else {
    throw new Error('Errore nel recupero delle carte iniziali');
  }
};

const getCardById = async (card_id) => {
  const response = await fetch(`${SERVER_URL}/api/cards/${card_id}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    const c = await response.json();
    return new Card(c.card_id, c.description, c.image, c.misfortune_index);
  } else {
    throw new Error('Errore nel recupero della carta');
  }
};

// ================== GAME ==================

const createGame = async (user_id, initialCardIds) => {
  const response = await fetch(`${SERVER_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id, initialCardIds }),
  });
  if (response.ok) {
    const g = await response.json();
    // g: { game_id, user_id, date, status }
    return new Game(g.game_id, g.user_id, g.date, g.status);
  } else {
    throw new Error('Errore nella creazione della partita');
  }
};

const getGameById = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    const g = await response.json();
    return new Game(g.game_id, g.user_id, g.date, g.status);
  } else {
    throw new Error('Errore nel recupero della partita');
  }
};

const getNextRoundCard = async (game_id, exclude = []) => {
  const params = new URLSearchParams();
  exclude.forEach(id => params.append('exclude', id));
  params.append('withMisfortuneIndex', 'false');
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/next-card?${params.toString()}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    const c = await response.json();
    // { card_id, description, image, misfortune_index }
    return new Card(c.card_id, c.description, c.image, c.misfortune_index);
  } else {
    throw new Error('Errore nel recupero della carta per il round');
  }
};

const sendRound = async ({ game_id, card_id, round_number, guessed_correctly, chosen_position, time }) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ card_id, round_number, guessed_correctly, chosen_position, time })
  });
  if (response.ok) {
    const r = await response.json();
    // { round_id, game_id, card_id, round_number, guessed_correctly, chosen_position, time }
    return new Round(r.round_id, r.game_id, r.card_id, r.round_number, r.guessed_correctly, r.chosen_position, r.time);
  } else {
    throw new Error('Errore nell\'invio del round');
  }
};

const updateGameStatus = async (game_id, status) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  if (response.ok) {
    const g = await response.json();
    return new Game(g.game_id, g.user_id, g.date, g.status);
  } else {
    throw new Error('Errore nell\'aggiornamento dello stato partita');
  }
};

// ================== GAME SUMMARY ==================

const getInitialCardsOfGame = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/initial-cards`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    // [{id, game_id, card_id}]
    const arr = await response.json();
    return arr.map(c => new InitialGameCard(c.id, c.game_id, c.card_id));
  } else {
    throw new Error('Errore nel recupero delle carte iniziali della partita');
  }
};

const getRoundsOfGame = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/rounds`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    // [{round_id, game_id, card_id, round_number, guessed_correctly, chosen_position, time}]
    const arr = await response.json();
    return arr.map(r => new Round(r.round_id, r.game_id, r.card_id, r.round_number, r.guessed_correctly, r.chosen_position, r.time));
  } else {
    throw new Error('Errore nel recupero dei round della partita');
  }
};

// ================== PROFILE ==================

const getGamesByUser = async (user_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/user/${user_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (response.ok) {
    const games = await response.json();
    // [{game_id, user_id, date, status}]
    return games.map(g => new Game(g.game_id, g.user_id, g.date, g.status));
  } else {
    throw new Error('Errore nel recupero delle partite utente');
  }
};

// ================== DEMO ==================

const getDemo = async () => {
  const response = await fetch(`${SERVER_URL}/api/demo`, {
    method: 'GET'
  });
  if (response.ok) {
    // { initialCards: [...], roundCard: {...} }
    const demo = await response.json();
    return {
      initialCards: demo.initialCards.map(c => new Card(c.card_id, c.description, c.image, c.misfortune_index)),
      roundCard: new Card(demo.roundCard.card_id, demo.roundCard.description, demo.roundCard.image, demo.roundCard.misfortune_index)
    };
  } else {
    throw new Error('Errore nel recupero della demo');
  }
};

// ================== EXPORT ==================

const API = {
  // Auth
  logIn, logOut, getUserInfo,
  // Carte
  getInitialCards, getCardById,
  // Partita
  createGame, getGameById, getNextRoundCard, sendRound, updateGameStatus,
  // Riepilogo
  getInitialCardsOfGame, getRoundsOfGame,
  // Profilo
  getGamesByUser,
  // Demo
  getDemo,
};

export default API;