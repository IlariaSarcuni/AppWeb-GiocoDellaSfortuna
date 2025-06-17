import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import dayjs from "dayjs";
import API from "../API.mjs";
import '../index.css';
import { Container, Row, Col, Card, Alert, Spinner, Button } from "react-bootstrap";

function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  // Estrae gameId dallo stato passato durante la navigazione
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
        setError("ID della partita non trovato.");
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
          setPossessedCards([...initialCards, ...wonCards]);

        } else {
          setError("Riepilogo della partita non trovato.");
        }
      } catch (err) {        
        setError("Errore nel recupero dei dati della partita.");
      }
      setLoading(false);
    }
    fetchSummaryData();
  }, [gameId]); // Si riesegue quando il componente viene montato o quando gameId cambia

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
                  <span style={{ fontWeight: "bold", color: gameDetails.status === "win" ? "green" : "red"}}>
                    {gameDetails.status === "win" ? "VITTORIA" : "SCONFITTA"}
                  </span>
                </Col>
                <Col md={6}>
                  <strong>Data:</strong> {gameDetails.date ? dayjs(gameDetails.date).format('DD/MM/YYYY HH:mm:ss') : "-"}
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
                            <Card.Img variant="top" src={`http://localhost:3001/img/${card.image}`} alt="img" className="card-img-top"/>
                          )}
                          <Card.Body className="card-body p-2">
                            <Card.Text className="card-text">{card.description}</Card.Text>
                            <div className="misfortune-index">{card.misfortune_index}</div>
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
                <Button variant="success" className="me-2" onClick={handleStartNewGame}>NUOVA PARTITA</Button>
                <Button variant="secondary" onClick={() => navigate("/")}>TORNA ALLA HOME</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GameSummary;