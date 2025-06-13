const SERVER_URL = 'http://localhost:3001';

// ----------- GAME FLOW -----------

// 1. Ottieni 3 carte iniziali per una nuova partita (solo autenticati)
const getInitialCards = async (exclude = []) => {
  const query = exclude.length ? `?exclude=${exclude.join(',')}` : '';
  const response = await fetch(`${SERVER_URL}/api/game/init-cards${query}`, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero delle carte iniziali');
  }
};

// 2. Crea una nuova partita (solo autenticati)
const createGame = async () => {
  const response = await fetch(`${SERVER_URL}/api/game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json(); // { game_id }
  } else {
    throw new Error('Errore nella creazione della partita');
  }
};

// 3. Salva le carte iniziali di una partita (solo autenticati)
const saveInitialCards = async (game_id, card_ids) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/init-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ card_ids })
  });
  if (!response.ok) {
    throw new Error('Errore nel salvataggio delle carte iniziali');
  }
};

// 4. Ottieni una situazione da indovinare (una card random non usata, solo autenticati)
const getSituation = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/situation`, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else if(response.status === 404) {
    return null;
  } else {
    throw new Error('Errore nel recupero della nuova situazione');
  }
};

// 5. Aggiungi un nuovo round alla partita (solo autenticati)
const addRound = async (game_id, card_id, round_number) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ card_id, round_number })
  });
  if (response.ok) {
    return await response.json(); // { round_id }
  } else {
    throw new Error('Errore nell\'aggiunta del round');
  }
};

// 6. Aggiorna esito del round (solo autenticati)
const updateRoundResult = async (round_id, guessed_correctly, chosen_position) => {
  const response = await fetch(`${SERVER_URL}/api/game/round/${round_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ guessed_correctly, chosen_position })
  });
  if (!response.ok) {
    throw new Error('Errore nell\'aggiornamento del round');
  }
};

// 7. Ottieni tutte le carte vinte in una partita (solo autenticati)
const getWonCards = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/won-cards`, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero delle carte vinte');
  }
};

// 8. Ottieni storico delle partite di un utente (solo autenticati)
const getGamesByUser = async (user_id) => {
  const response = await fetch(`${SERVER_URL}/api/games/user=${user_id}`, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero dello storico partite');
  }
};

// 9. Ottieni la cronologia dettagliata di una partita (solo autenticati)
const getGameHistory = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/history`, {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero della cronologia partita');
  }
};

// 10. Aggiorna stato della partita (solo autenticati)
const updateGameStatus = async (game_id, status) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    throw new Error('Errore nell\'aggiornamento stato partita');
  }
};

// 11. Recupera i dati di una partita dato l'id
async function getGameById(game_id) {
  const response = await fetch(`/api/game/${game_id}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Errore nel recupero della partita');
  return await response.json();
}

// 12. Partita demo (3 carte iniziali + 1 situazione random, NO login necessario)
const getDemoCards = async () => {
  const response = await fetch(`${SERVER_URL}/api/demo`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero delle carte demo');
  }
};

// ----------- AUTH -----------

const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    return user;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include',
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user;  // an object with the error coming from the server
  }
};

const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
}

// ----------- EXPORT -----------

const API = {
  // Game
  getInitialCards,
  createGame,
  saveInitialCards,
  getSituation,
  addRound,
  updateRoundResult,
  getWonCards,
  getGamesByUser,
  getGameHistory,
  updateGameStatus,
  getGameById,
  // Demo
  getDemoCards,
  // Auth
  logIn,
  getUserInfo,
  logOut
};

export default API;

