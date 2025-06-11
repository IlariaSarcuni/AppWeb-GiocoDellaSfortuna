const SERVER_URL = 'http://localhost:3001';

// ========== AUTH ==========

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

// ========== CARDS ==========

const getInitialCards = async (count = 3) => {
  const response = await fetch(`${SERVER_URL}/api/cards?count=${count}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json(); // array di oggetti card
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
    return await response.json(); // oggetto card
  } else {
    throw new Error('Errore nel recupero della carta');
  }
};

// ========== GAME ==========

const createGame = async (user_id, initialCardIds) => {
  const response = await fetch(`${SERVER_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id, initialCardIds }),
  });
  if (response.ok) {
    return await response.json(); // oggetto partita
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
    return await response.json(); // oggetto partita
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
    return await response.json(); // oggetto card
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
    return await response.json(); // oggetto round
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
    return await response.json(); // oggetto partita aggiornato
  } else {
    throw new Error('Errore nell\'aggiornamento dello stato partita');
  }
};

// ========== GAME SUMMARY ==========

const getInitialCardsOfGame = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/${game_id}/initial-cards`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json(); // array di oggetti initialGameCard
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
    return await response.json(); // array di oggetti round
  } else {
    throw new Error('Errore nel recupero dei round della partita');
  }
};

// ========== PROFILE ==========

const getGamesByUser = async (user_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/user/${user_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json(); // array di oggetti game
  } else {
    throw new Error('Errore nel recupero delle partite utente');
  }
};

// ========== DEMO ==========

const getDemo = async () => {
  const response = await fetch(`${SERVER_URL}/api/demo`, {
    method: 'GET'
  });
  if (response.ok) {
    return await response.json(); // oggetto demo { initialCards: [...], roundCard: {...} }
  } else {
    throw new Error('Errore nel recupero della demo');
  }
};

// ========== EXPORT ==========

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