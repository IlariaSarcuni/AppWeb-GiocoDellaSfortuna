import React, { useEffect, useState } from 'react'; // useContext se usi AuthContext
import API from '../API.mjs'; // Assicurati che il percorso sia corretto
import { Container, Row, Col, Card, Spinner, Alert, Accordion, ListGroup, Badge, Image } from 'react-bootstrap';
// import AuthContext from '../contexts/AuthContext'; // Esempio se usi un contesto per l'utente

// Funzione helper per formattare la data
const formatDate = (dateString) => {
  if (!dateString) return "Data non disponibile";
  return new Date(dateString).toLocaleString('it-IT', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Componente per una singola carta nella cronologia
function HistoryCardItem({ card, isInitial }) {
  let cardBorder = "secondary";
  let roundInfo = null;

  if (!isInitial) {
    cardBorder = card.guessed_correctly === 1 ? "success" : (card.guessed_correctly === 0 ? "danger" : "secondary");
    roundInfo = (
      <>
        Round {card.round_number}:
        <Badge pill bg={cardBorder} className="ms-2">
          {card.guessed_correctly === 1 ? "Indovinata" : (card.guessed_correctly === 0 ? "Sbagliata" : "N/A")}
        </Badge>
      </>
    );
  } else {
    roundInfo = <Badge bg="info" pill>Carta Iniziale</Badge>;
  }

  return (
    <ListGroup.Item className="d-flex justify-content-between align-items-start p-2">
      <Row className="w-100 align-items-center">
        <Col xs={3} md={2} className="text-center">
          {card.image && (
            <Image
              src={`http://localhost:3001/img/${card.image}`}
              alt={card.description ? card.description.substring(0, 20) : 'Immagine carta'}
              rounded
              style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
            />
          )}
        </Col>
        <Col xs={9} md={7}>
          <div className="fw-bold" style={{fontSize: '0.9rem'}}>{card.description}</div>
          {card.misfortune_index !== undefined && 
            <div style={{fontSize: '0.8rem'}}>Indice Sfortuna: {card.misfortune_index}</div>
          }
        </Col>
        <Col xs={12} md={3} className="text-md-end mt-2 mt-md-0">
          <div style={{fontSize: '0.85rem'}}>{roundInfo}</div>
        </Col>
      </Row>
    </ListGroup.Item>
  );
}


function UserHistory({ currentUser }) { // currentUser passato come prop
  // const { currentUser } = useContext(AuthContext); // Alternativa
  const [gamesHistory, setGamesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setError("Utente non autenticato o ID utente non disponibile.");
      setLoading(false);
      return;
    }

    async function fetchUserGamesHistory() {
      setLoading(true);
      setError(null);
      try {
        // 1. Ottieni l'elenco base delle partite
        const userGames = await API.getGamesByUser(currentUser.id);

        // 2. Per ogni partita, recupera dettagli e calcola carte raccolte
        const detailedGamesHistory = await Promise.all(
          userGames.map(async (game) => {
            try {
              const roundsHistory = await API.getGameHistory(game.game_id);
              const initialCards = await API.getInitialCardsByGameId(game.game_id);

              // Calcolo del numero totale di carte raccolte (nel frontend)
              const initialCardIds = initialCards.map(c => c.card_id);
              const wonCardIdsInRounds = roundsHistory
                .filter(r => r.guessed_correctly === 1 && r.round_number > 0) // round_number > 0 per escludere "carte iniziali" se mai avessero round_number 0
                .map(r => r.card_id);
              
              const collectedCardIds = new Set([...initialCardIds, ...wonCardIdsInRounds]);
              const collected_card_count = collectedCardIds.size;

              return {
                ...game, // game_id, user_id, date, status
                rounds: roundsHistory,
                initialCards: initialCards,
                collected_card_count: collected_card_count, // Aggiunto il conteggio calcolato
              };
            } catch (gameDetailError) {
              console.error(`Errore nel recuperare dettagli per la partita ${game.game_id}:`, gameDetailError);
              return { ...game, rounds: [], initialCards: [], collected_card_count: 'N/D', errorLoadingDetails: true };
            }
          })
        );
        setGamesHistory(detailedGamesHistory);
      } catch (err) {
        console.error("Errore nel recuperare la cronologia delle partite dell'utente:", err);
        setError("Impossibile caricare la cronologia delle partite.");
      }
      setLoading(false);
    }

    fetchUserGamesHistory();
  }, [currentUser]);


  if (loading) {
    return <Container className="mt-4 text-center"><Spinner animation="border" role="status"><span className="visually-hidden">Caricamento...</span></Spinner></Container>;
  }

  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!gamesHistory.length) {
    return <Container className="mt-4"><Alert variant="info">Non hai ancora nessuna partita completata nella tua cronologia.</Alert></Container>;
  }

  return (
    <Container className="mt-5 mb-5">
      <Row>
        <Col md={10} lg={9} className="mx-auto">
          <h2 className="text-center mb-4">Cronologia Partite di {currentUser.name || `Utente ${currentUser.id}`}</h2>
          <Accordion flush> {/* Rimosso defaultActiveKey per non aprire il primo automaticamente */}
            {gamesHistory.map((game, index) => (
              <Accordion.Item eventKey={String(index)} key={game.game_id}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between w-100 pe-2">
                    <span>Partita del {formatDate(game.date)}</span>
                    <Badge pill bg={game.status === 'win' ? 'success' : (game.status === 'lose' ? 'danger' : 'secondary')}>
                      {game.status === 'win' ? 'Vinta' : (game.status === 'lose' ? 'Persa' : game.status)}
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Card>
                    <Card.Body>
                      <Card.Text className="mb-1">
                        <strong>Esito:</strong> {game.status === 'win' ? 'Vittoria' : (game.status === 'lose' ? 'Sconfitta' : game.status)}
                      </Card.Text>
                      <Card.Text className="mb-3">
                        <strong>Carte Raccolte Totali:</strong> {game.collected_card_count}
                      </Card.Text>
                      
                      {game.errorLoadingDetails && <Alert variant="warning">Dettagli carte non completamente caricati per questa partita.</Alert>}

                      <h5 className="mt-3 mb-2" style={{fontSize: '1.1rem'}}>Carte Coinvolte:</h5>
                      <ListGroup variant="flush">
                        {game.initialCards && game.initialCards.map(card => (
                          <HistoryCardItem key={`initial-${game.game_id}-${card.card_id}`} card={card} isInitial={true} />
                        ))}
                        {game.rounds && game.rounds.map(round => (
                          <HistoryCardItem key={`round-${game.game_id}-${round.round_number}-${round.card_id}`} card={round} isInitial={false} />
                        ))}
                         {(!game.initialCards || game.initialCards.length === 0) && (!game.rounds || game.rounds.length === 0) && !game.errorLoadingDetails && (
                            <ListGroup.Item>Nessuna carta registrata per questa partita.</ListGroup.Item>
                         )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export default UserHistory;