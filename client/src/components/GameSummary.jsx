import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert, Button, Spinner, Table } from "react-bootstrap";
import API from "../API.mjs";
import { useLocation, useNavigate } from "react-router";

function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Ricava gameId da state o query param
  const gameId =
    (location.state && location.state.gameId) ||
    (location.search && new URLSearchParams(location.search).get("gameId"));

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!gameId) {
          setError("Partita non trovata.");
          setLoading(false);
          return;
        }
        const data = await API.getGameHistory(gameId);
        setSummary(data);
      } catch (err) {
        setError("Errore nel caricamento del riepilogo partita.");
      }
      setLoading(false);
    };

    fetchSummary();
  }, [gameId]);

  // Helpers
  const getResultIcon = (r) =>
    r.guessed_correctly
      ? <span style={{ color: "green" }}>✔️</span>
      : <span style={{ color: "red" }}>❌</span>;

  // Safe accessors
  const cardsInitial = summary?.cards_initial || [];
  const cardsWon = summary?.cards_won || [];
  const rounds = summary?.rounds || [];

  return (
    <Container className="mt-4">
      <Row>
        <Col md={10} className="mx-auto">
          <h2 className="mb-3">Riepilogo partita</h2>
          {loading && (
            <Alert variant="info">
              <Spinner animation="border" size="sm" /> Caricamento riepilogo...
            </Alert>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && summary && (
            <>
              <Alert variant={summary.status === "won" ? "success" : "danger"}>
                <b>Stato finale:</b>{" "}
                {summary.status === "won" ? "VITTORIA" : "SCONFITTA"}
                <br />
                <b>Carte raccolte:</b> {cardsWon.length} / 3 &nbsp; | &nbsp;
                <b>Errori:</b> {summary.failures ?? 0} / 3
              </Alert>

              <h5>Le tue carte iniziali:</h5>
              <Row className="mb-3">
                {cardsInitial.map((c) => (
                  <Col key={c.card_id} xs={6} md={4} lg={3} className="mb-2">
                    <Card border="primary" className="h-100">
                      <Card.Img variant="top" src={c.image} style={{ height: 80, objectFit: "cover" }} />
                      <Card.Body>
                        <Card.Text style={{ fontSize: "0.9em" }}>{c.description}</Card.Text>
                        <div className="text-muted" style={{ fontSize: "0.8em" }}>
                          Indice: {c.misfortune_index}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <h5>Carte vinte:</h5>
              {cardsWon.length === 0 ? (
                <p>Nessuna carta vinta.</p>
              ) : (
                <Row className="mb-3">
                  {cardsWon.map((c) => (
                    <Col key={c.card_id} xs={6} md={4} lg={3} className="mb-2">
                      <Card border="success" className="h-100">
                        <Card.Img variant="top" src={c.image} style={{ height: 80, objectFit: "cover" }} />
                        <Card.Body>
                          <Card.Text style={{ fontSize: "0.9em" }}>{c.description}</Card.Text>
                          <div className="text-muted" style={{ fontSize: "0.8em" }}>
                            Indice: {c.misfortune_index}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}

              

              <Button variant="primary" onClick={() => navigate("/")} className="mt-3">
                Torna alla home
              </Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default GameSummary;