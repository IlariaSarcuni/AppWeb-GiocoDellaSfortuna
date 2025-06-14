import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import API from "../API.mjs";
import { Container, Row, Col, Card, Alert, Spinner, Button } from "react-bootstrap";

function GameSummary() {
  const { gameId } = useParams();
  const location = useLocation();
  const playedCards = location.state?.playedCards || [];

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGame() {
      setLoading(true);
      setError(null);
      try {
        const g = await API.getGameById(gameId);
        setGame(g);
      } catch (err) {
        setError("Errore nel recupero dei dati della partita.");
      }
      setLoading(false);
    }
    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Partita non trovata.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Body>
              <Card.Title>Riepilogo partita</Card.Title>
              <Card.Text>
                <b>Partita n°:</b> {game.game_id}<br />
                <b>Stato:</b> <span style={{ textTransform: "capitalize" }}>{game.status}</span><br />
                <b>Data:</b> {game.date ? new Date(game.date).toLocaleString() : "-"}<br />
              </Card.Text>

              {playedCards.length > 0 && (
                <>
                  <h5 className="mt-4">Carte giocate dall’utente:</h5>
                  <Row>
                    {playedCards.map(card => (
                      <Col xs={6} md={4} key={card.card_id} className="mb-2">
                        <Card border="secondary" className="h-100">
                          <Card.Img variant="top" src={card.image} style={{ height: 70, objectFit: "cover" }} />
                          <Card.Body>
                            <Card.Text>{card.description}</Card.Text>
                            <div className="text-center" style={{ fontSize: "1.2em", fontWeight: "bold" }}>{card.misfortune_index}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
              <Button variant="primary" href="/" className="mt-3">Torna alla home</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GameSummary;