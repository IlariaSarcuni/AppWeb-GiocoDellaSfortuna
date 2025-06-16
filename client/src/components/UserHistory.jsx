import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Table } from 'react-bootstrap'; // Rimosso Spinner dall'import
import { Link } from 'react-router';
import API from '../API.mjs';
import dayjs from 'dayjs';

function UserHistory(props) {
  const [gamesList, setGamesList] = useState([]);
  const [loadingGamesList, setLoadingGamesList] = useState(true); // Mantenuto per la logica condizionale
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(props.user);

  const [expandedGameDetails, setExpandedGameDetails] = useState({});
  const [loadingDetailsForGame, setLoadingDetailsForGame] = useState(null); // Mantenuto per disabilitare il bottone

  useEffect(() => {
    if (!currentUser && props.loggedIn) {
      API.getUserInfo()
        .then(user => setCurrentUser(user))
        .catch(err => {
          console.error("Errore recupero utente:", err);
          setError("Impossibile recuperare le informazioni dell'utente.");
          setLoadingGamesList(false);
        });
    } else if (!props.loggedIn && !currentUser) {
      setLoadingGamesList(false);
    }
  }, [currentUser, props.user, props.loggedIn]);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      setLoadingGamesList(true);
      setError(null);
      API.getGamesByUser(currentUser.id)
        .then((gamesData) => {
          setGamesList(gamesData);
        })
        .catch(err => {
          setError("Errore nel recupero della cronologia partite.");
          console.error(err);
          setGamesList([]);
        })
        .finally(() => {
          setLoadingGamesList(false);
        });
    } else if (!currentUser && !props.loggedIn) {
        setGamesList([]);
        setLoadingGamesList(false);
    }
  }, [currentUser, props.loggedIn]);

  const toggleGameDetails = async (gameId) => {
    const currentDetailState = expandedGameDetails[gameId];

    if (currentDetailState?.visible) {
      setExpandedGameDetails(prev => ({ ...prev, [gameId]: { ...currentDetailState, visible: false } }));
      return;
    }

    if (currentDetailState?.data && !currentDetailState.visible) {
       setExpandedGameDetails(prev => ({ ...prev, [gameId]: { ...currentDetailState, visible: true } }));
       return;
    }

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

  // Rimosso il blocco di caricamento iniziale con Spinner
  // if (loadingGamesList && !gamesList.length) {
  //   return <Container className="text-center mt-5"><Spinner animation="border" /> <p>Caricamento cronologia...</p></Container>;
  // }

  if (!props.loggedIn && !currentUser) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Devi effettuare il login per visualizzare il tuo profilo e la cronologia delle partite.
        </Alert>
        <Row className="mt-3">
          <Col className="text-center">
            <Link to="/">
              <Button variant="secondary">Torna alla Home</Button>
            </Link>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (error && !gamesList.length && !loadingGamesList) { // Aggiunto !loadingGamesList per evitare flash di errore durante il caricamento iniziale
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Row className="mt-3">
          <Col className="text-center">
            <Link to="/">
              <Button variant="secondary">Torna alla Home</Button>
            </Link>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3">
        <Col>
          <Link to="/">
            <Button variant="secondary">Torna alla Home</Button>
          </Link>
        </Col>
      </Row>
      <Row>
        <Col md={10} lg={9} className="mx-auto">
          <h2>Profilo Utente</h2>
          {currentUser && <p className="lead">Benvenuto/a, {currentUser.name || currentUser.email}!</p>}
          <hr />
          <h3 className="mt-4 mb-3">Cronologia Partite</h3>
          {error && <Alert variant="danger" className="mb-2">{error}</Alert>}

          {loadingGamesList && gamesList.length === 0 && ( // Mostra un messaggio di caricamento semplice se la lista è vuota e sta caricando
            <p>Caricamento cronologia...</p>
          )}

          {!loadingGamesList && gamesList.length === 0 && !error ? (
            <Alert variant="info">Non hai ancora completato nessuna partita.</Alert>
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
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => toggleGameDetails(game.game_id)}
                            disabled={isLoadingThisGameDetails} // Mantenuto per disabilitare il bottone durante il caricamento dei dettagli
                            aria-expanded={gameDetailEntry?.visible}
                            aria-controls={`details-game-${game.game_id}`}
                          >
                            {/* Rimosso Spinner dal bottone */}
                            {gameDetailEntry?.visible ? "Nascondi dettagli" : "Mostra dettagli"}
                          </Button>
                        </td>
                      </tr>
                      {gameDetailEntry?.visible && (
                        <tr id={`details-game-${game.game_id}`}>
                          <td colSpan="3" className="p-3 bg-light"> 
                            {/* Rimosso Spinner dalla sezione dettagli */}
                            {gameDetailEntry.error ? (
                              <Alert variant="danger" className="mb-0">{gameDetailEntry.error}</Alert>
                            ) : gameDetailEntry.data ? (
                              <div>
                                <h5 className="mb-3">
                                  Carte totali raccolte: {gameDetailEntry.data.total_cards_collected}
                                </h5>
                                
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