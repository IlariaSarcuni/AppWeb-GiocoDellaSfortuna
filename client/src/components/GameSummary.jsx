import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router"; // Import useLocation, useParams is not needed if gameId comes from state
import API from "../API.mjs";
import '../index.css';
import { Container, Row, Col, Card, Alert, Spinner, Button } from "react-bootstrap";

// Helper function to merge and remove duplicate cards based on card_id
const mergeAndUniqueCards = (initialCards, wonCards) => {
  const allCardsMap = new Map();
  initialCards.forEach(card => allCardsMap.set(card.card_id, card));
  wonCards.forEach(card => allCardsMap.set(card.card_id, card)); // Overwrites initial if duplicate, or adds if new
  return Array.from(allCardsMap.values());
};

function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get gameId from location state passed by navigate
  const gameId = location.state?.gameId;

  const [gameDetails, setGameDetails] = useState(null);
  const [possessedCards, setPossessedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSummaryData() {
      setLoading(true);
      setError(null);

      if (!gameId) {
        setError("ID della partita non fornito o non trovato nello state della navigazione.");
        setLoading(false);
        return;
      }

      try {
        const details = await API.getGameById(gameId);
        setGameDetails(details);

        if (details) {
          const initialCards = await API.getInitialCardsByGameId(gameId);
          let wonCards = [];
          
          if (details.status === "win" || details.status === "lose") {
             wonCards = await API.getWonCards(gameId);
          }
          
          setPossessedCards(mergeAndUniqueCards(initialCards, wonCards));
        } else {
          // Handle case where details might be null even with a valid gameId (e.g., game not found in DB)
          setError("Dettagli della partita non trovati per l'ID fornito.");
        }
      } catch (err) {
        console.error("Errore nel recupero dei dati della partita:", err); // Log the actual error for debugging
        setError(`Errore nel recupero dei dati della partita: ${err.message || "Errore sconosciuto"}`);
      }
      setLoading(false);
    }
    fetchSummaryData();
  }, [gameId]); // Dependency array includes gameId

  const handleStartNewGame = () => {
    navigate("/game"); 
  };

  if (loading) {
    return <Container className="mt-4 text-center"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!gameDetails) {
    return <Container className="mt-4"><Alert variant="warning">Partita non trovata o dati non disponibili.</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={10} lg={8} className="mx-auto">
          <Card>
            <Card.Header as="h4" className="text-center">Riepilogo Partita</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <b>Stato:</b>{" "}
                  <span
                    style={{
                      fontWeight: (gameDetails.status === "win" || gameDetails.status === "lose") ? "bold" : undefined,
                      color: gameDetails.status === "win" ? "green" : gameDetails.status === "lose" ? "red" : "orange", // Default color for other statuses
                      }}>
                    {gameDetails.status === "win" ? "VITTORIA" : gameDetails.status === "lose" ? "SCONFITTA" : (gameDetails.status || "N/D").toUpperCase()}
                  </span>
                </Col>
                <Col md={6}>
                  <b>Data:</b> {gameDetails.date ? new Date(gameDetails.date).toLocaleString() : "-"}
                </Col>
              </Row>
              
              <hr/>

              <h5 className="mt-3">Carte ottenute:</h5>
                {possessedCards.length > 0 ? (
                  <Row className="g-3">
                    {possessedCards.map(card => (
                      <Col xs={12} sm={6} md={4} key={card.card_id} className="d-flex">
                        <Card className="card-default h-100 w-100">
                          {card.image && (
                            <Card.Img
                              variant="top"
                              src={`http://localhost:3001/img/${card.image}`}
                              alt="img"
                              className="card-img-top"
                            />
                          )}
                          <Card.Body className="card-body p-2">
                            <Card.Text className="card-text">
                              {card.description}
                            </Card.Text>
                            <div className="misfortune-index">
                              {card.misfortune_index}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                <p>Nessuna carta in possesso al termine della partita.</p>
              )}
              
              <hr className="my-4"/>

              <div className="text-center">
                <Button variant="success" className="me-2" onClick={handleStartNewGame}>
                  NUOVA PARTITA
                </Button>
                <Button variant="secondary" onClick={() => navigate("/")}>
                  TORNA ALLA HOME
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GameSummary;