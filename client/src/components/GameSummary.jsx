import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router";
import { Container, Row, Col, Card, Alert, Button } from "react-bootstrap";

function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId, result } = location.state || {};
  const [initialCards, setInitialCards] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Se non ho gameId, redirect
  useEffect(() => {
    if (!gameId) navigate("/");
    // eslint-disable-next-line
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    async function fetchSummary() {
      try {
        setLoading(true);
        // Carte iniziali
        const resInit = await fetch(`http://localhost:3001/api/games/${gameId}/initial-cards`, { credentials: "include" });
        const initCards = await resInit.json();
        setInitialCards(initCards);

        // Round giocati
        const resRounds = await fetch(`http://localhost:3001/api/games/${gameId}/rounds`, { credentials: "include" });
        const roundsData = await resRounds.json();
        setRounds(roundsData);

        setLoading(false);
      } catch (err) {
        setError("Errore nel caricamento del riepilogo partita.");
        setLoading(false);
      }
    }
    fetchSummary();
  }, [gameId]);

  // Utility per recuperare la descrizione di una carta da id
  function cardDesc(card_id) {
    const all = [...initialCards, ...rounds.map(r => r.card)];
    const found = all.find(c => c.card_id === card_id);
    return found ? found.description : "";
  }

  if (loading) return <Container className="mt-5"><Alert variant="info">Caricamento riepilogo...</Alert></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="mt-4">
      <Row>
        <Col className="text-center">
          <h2>Riepilogo partita</h2>
          <Alert variant={result === "win" ? "success" : "danger"}>
            {result === "win" ? "Hai vinto! 🎉" : "Hai perso 😢"}
          </Alert>
          <div className="mb-3">
            <strong>Carte raccolte:</strong> {initialCards.length + rounds.filter(r => r.guessed_correctly).length}
          </div>
          <h4>Carte iniziali</h4>
          <Row className="mb-3">
            {initialCards.map(card => (
              <Col key={card.card_id} xs={12} md={4} className="mb-2">
                <Card>
                  <Card.Img variant="top" src={card.image} style={{ height: 80, objectFit: "cover" }} />
                  <Card.Body>
                    <Card.Title>{card.description}</Card.Title>
                    <Card.Text>Indice di sfortuna: <b>{card.misfortune_index}</b></Card.Text>
                    <div className="text-muted" style={{ fontSize: "0.85em" }}>Carta iniziale</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <h4>Situazioni affrontate nei round</h4>
          <Row>
            {rounds.map(round => (
              <Col key={round.round_id} xs={12} md={4} className="mb-2">
                <Card border={round.guessed_correctly ? "success" : "danger"}>
                  <Card.Body>
                    <div>
                      <strong>{cardDesc(round.card_id)}</strong>
                    </div>
                    <div>Round {round.round_number}</div>
                    <div>Esito: {round.guessed_correctly ? <span className="text-success">Vinta</span> : <span className="text-danger">Persa</span>}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="mt-4">
            <Link to="/game" className="btn btn-success mx-2">Nuova partita</Link>
            <Link to="/profile" className="btn btn-outline-primary mx-2">Vai al profilo</Link>
            <Button as={Link} to="/" className="mx-2" variant="secondary">Home</Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default GameSummary;