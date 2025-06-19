const SERVER_URL = 'http://localhost:3001';

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

// 2. Ottieni le carte iniziali di una partita dato il suo game_id (solo autenticati)
const getInitialCardsByGameId = async (game_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}/init-cards`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Errore nel recupero delle carte iniziali');
  return await response.json();
};

// 3. Crea una nuova partita (solo autenticati)
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

// 4. Salva le carte iniziali di una partita (solo autenticati)
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

// 5. Ottieni una situazione da indovinare (una card random non usata, solo autenticati)
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

// 6. Aggiungi un nuovo round alla partita (solo autenticati)
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

// 7. Aggiorna esito del round (solo autenticati) e verifica se la risposta è corretta
const updateRoundResult = async (round_id, chosen_position, card_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/round/${round_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ chosen_position, card_id })
  });
  if (!response.ok) {
    throw new Error('Errore nell\'aggiornamento del round');
  }
  return await response.json(); // { guessed_correctly, misfortune_index? }
};

// 8. Ottieni tutte le carte vinte in una partita (solo autenticati)
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

// 9. Ottieni storico delle partite di un utente (solo autenticati)
const getGamesByUser = async (user_id) => {
  const response = await fetch(`${SERVER_URL}/api/game/user/${user_id}`, { 
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero dello storico partite');
  }
};

// 10. Ottieni la cronologia dettagliata di una partita (solo autenticati)
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

// 11. Aggiorna stato della partita (solo autenticati)
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

// 12. Recupera i dati di una partita dato l'id
async function getGameById(game_id) {
  const response = await fetch(`${SERVER_URL}/api/game/${game_id}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Errore nel recupero della partita');
  return await response.json();
}

// 13. Partita demo 
const getDemoCards = async () => {
  const response = await fetch(`${SERVER_URL}/api/demo`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Errore nel recupero delle carte demo');
  }
};

//Autenticazione
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
    throw user;  
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

const API = {
  getInitialCards,
  getInitialCardsByGameId,
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
  getDemoCards,
  logIn,
  getUserInfo,
  logOut
};

export default API;