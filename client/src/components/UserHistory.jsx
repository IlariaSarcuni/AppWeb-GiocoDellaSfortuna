import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Table } from 'react-bootstrap'; 
import { Link } from 'react-router';
import API from '../API.mjs';
import dayjs from 'dayjs';

function UserHistory(props) {
  const [gamesList, setGamesList] = useState([]);
  const [loadingGamesList, setLoadingGamesList] = useState(true); 
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(props.user);
  const [expandedGameDetails, setExpandedGameDetails] = useState({});
  const [loadingDetailsForGame, setLoadingDetailsForGame] = useState(null); //Indica se i dettagli di una specifica partita sono in caricamento (usato per disabilitare il bottone)

  useEffect(() => {
    if (!currentUser && props.loggedIn) {
      API.getUserInfo()
        .then(user => setCurrentUser(user))
        .catch(() => {
          setError("Impossibile recuperare le informazioni dell'utente.");
          setLoadingGamesList(false);
        });
    } else if (!props.loggedIn && !currentUser) {
      setLoadingGamesList(false);
    }
  }, [currentUser, props.user, props.loggedIn]);

  //Cronologia partite
  useEffect(() => {
    if (currentUser && currentUser.id) {
      setLoadingGamesList(true);
      setError(null);
      API.getGamesByUser(currentUser.id)
        .then((gamesData) => {
          setGamesList(gamesData);
        })
        .catch(() => {
          setError("Errore nel recupero della cronologia partite.");
          setGamesList([]);
        })
        .finally(() => {
          setLoadingGamesList(false); //Termina il caricamento della lista partite
        });
    //Pulisce lo stato quando un utente effettua il logout
    } else if (!currentUser && !props.loggedIn) {
        setGamesList([]);
        setLoadingGamesList(false);
    }
  }, [currentUser, props.loggedIn]);

  //----- Funzioni Handler -----

  //Mostrare/nascondere i dettagli di una specifica partita
  const toggleGameDetails = async (gameId) => {
    const currentDetailState = expandedGameDetails[gameId];
    //Se i dettagli sono già visibili, li nasconde
    if (currentDetailState?.visible) {
      setExpandedGameDetails(prev => ({ ...prev, [gameId]: { ...currentDetailState, visible: false } }));
      return;
    }
    //Rende visibili i dettagli che sono già stati caricati ma non sono visibili
    if (currentDetailState?.data && !currentDetailState.visible) {
       setExpandedGameDetails(prev => ({ ...prev, [gameId]: { ...currentDetailState, visible: true } }));
       return;
    }  
    //carica i dettagli
    setLoadingDetailsForGame(gameId);

    try {
      const roundsData = await API.getGameHistory(gameId);
      const initialCardsData = await API.getInitialCardsByGameId(gameId);
      const wonRoundsCount = roundsData.filter(r => r.guessed_correctly).length;
      const totalCollectedInDetails = initialCardsData.length + wonRoundsCount;

      setExpandedGameDetails(prev => ({
        ...prev,
        [gameId]: {
          data: {
            initial_cards: initialCardsData,
            rounds: roundsData,
            total_cards_collected: totalCollectedInDetails,
          },
          visible: true,
          error: null,
        },
      }));
    } catch (err) {
      console.error(`Errore nel caricamento dei dettagli espansi per la partita ${gameId}:`, err);
      setExpandedGameDetails(prev => ({
        ...prev,
        [gameId]: { data: null, visible: true, error: "Dettagli non disponibili per questa partita." },
      }));
    } finally {
      setLoadingDetailsForGame(null);
    }
  };

  //Se l'utente non è loggato  
  if (!props.loggedIn && !currentUser) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Devi effettuare il login per visualizzare il tuo profilo e la cronologia delle partite.</Alert>
        <Row className="mt-3">
          <Col className="text-center">
            <Link className="btn btn-secondary" to="/">Torna alla Home</Link>
          </Col>
        </Row>
      </Container>
    );
  }
  //Se c'è un errore
  if (error && !gamesList.length && !loadingGamesList) { 
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Row className="mt-3">
          <Col className="text-center">
            <Link className="btn btn-secondary" to="/">Torna alla Home</Link>
          </Col>
        </Row>
      </Container>
    );
  }

    //Rendering Principale
  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3">
        <Col>
          <Link className="btn btn-secondary" to="/">Torna alla Home</Link>
        </Col>
      </Row>
      <Row>
        <Col md={10} lg={9} className="mx-auto">
          <h2>Profilo Utente</h2>
          {currentUser && <p className="lead">Benvenuto/a, {currentUser.name || currentUser.email}!</p>}
          <hr />
          <h3 className="mt-4 mb-3">Cronologia Partite</h3>

          {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
          {loadingGamesList && gamesList.length === 0 && (<p>Caricamento cronologia...</p>)}
          {!loadingGamesList && gamesList.length === 0 && !error ? (<Alert variant="info">Non hai ancora completato nessuna partita.</Alert>
          ) : !loadingGamesList && gamesList.length > 0 ? ( // Mostra la tabella solo se non sta caricando e ci sono partite
            <Table striped bordered hover responsive className="mt-3 shadow-sm">
              <thead className="table-light">
                <tr>
                  <th>Data Partita</th>
                  <th>Esito</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {/* Mappa l'array 'gamesList' per creare una riga per ogni partita */}
                {gamesList.map(game => {
                  const gameDetailEntry = expandedGameDetails[game.game_id];
                  const isLoadingThisGameDetails = loadingDetailsForGame === game.game_id;

                  return (
                    <React.Fragment key={game.game_id}>
                      <tr>
                        <td>{dayjs(game.date).format('DD/MM/YYYY HH:mm')}</td>
                        <td>
                          <span style={{ color: game.status === 'win' ? 'green' : (game.status === 'lose' ? 'red' : 'orange'), fontWeight: 'bold' }}>
                            {game.status === 'win' ? 'VITTORIA' : (game.status === 'lose' ? 'SCONFITTA' : (game.status === 'ongoing' ? 'IN CORSO' : game.status.toUpperCase()))}
                          </span>
                        </td>
                        <td>
                          {/* Pulsante per mostrare/nascondere i dettagli della partita */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => toggleGameDetails(game.game_id)}
                            disabled={isLoadingThisGameDetails} //disabilitare il bottone durante il caricamento dei dettagli
                            aria-expanded={gameDetailEntry?.visible}
                            aria-controls={`details-game-${game.game_id}`}
                          >
                            {gameDetailEntry?.visible ? "Nascondi dettagli" : "Mostra dettagli"}
                          </Button>
                        </td>
                      </tr>
                      {gameDetailEntry?.visible && (
                        <tr id={`details-game-${game.game_id}`}>
                          <td colSpan="3" className="p-3 bg-light"> 
            
                            {gameDetailEntry.error ? (
                              <Alert variant="danger" className="mb-0">{gameDetailEntry.error}</Alert>
                            ) : gameDetailEntry.data ? (
                              <div>
                                <h5 className="mb-3">Carte totali raccolte: {gameDetailEntry.data.total_cards_collected}</h5>                                
                                {gameDetailEntry.data.initial_cards && gameDetailEntry.data.initial_cards.length > 0 && (
                                  <div className="mb-3">
                                    <h6>Carte iniziali:</h6>
                                    <ul className="list-unstyled ps-3">
                                      {gameDetailEntry.data.initial_cards.map(card => (
                                        <li key={`init-${game.game_id}-${card.card_id}`}>
                                          - {card.description}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {gameDetailEntry.data.rounds && gameDetailEntry.data.rounds.length > 0 ? (
                                  <div>
                                    <h6>Round giocati: {gameDetailEntry.data.rounds.length}</h6>
                                    <Table bordered size="sm" className="mb-0">
                                      <thead className="table-secondary">
                                        <tr>
                                          <th>N°</th>
                                          <th>Situazione</th>
                                          <th>Esito</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {gameDetailEntry.data.rounds.map((round) => (
                                          <tr key={`round-${game.game_id}-${round.card_id}-${round.round_number}`}>
                                            <td>{round.round_number}</td>
                                            <td>{round.description}</td>
                                            <td>
                                              <strong style={{color: round.guessed_correctly ? 'green' : 'red'}}>
                                                {round.guessed_correctly ? 'Corretta' : 'Errata'}
                                              </strong>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="small mb-0"><em>Nessun round giocato oltre le carte iniziali.</em></p>
                                )}
                              </div>
                            ) : <p className="mb-0">Nessun dettaglio da visualizzare.</p>}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          ) : null} 
        </Col>
      </Row>
    </Container>
  );
}

export default UserHistory;