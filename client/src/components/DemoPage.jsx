import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert, Form, Button, ProgressBar } from "react-bootstrap";

function sortCards(cards) {
  return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
}

function DemoPage() {
  const [initialCards, setInitialCards] = useState([]);
  const [roundCard, setRoundCard] = useState(null);
  const [chosenPos, setChosenPos] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    async function fetchDemo() {
      setLoading(true);
      setShowResult(false);
      setChosenPos(null);
      setFeedback(null);
      setTimer(30);

      const res = await fetch("http://localhost:3001/api/demo");
      if (res.ok) {
        const demo = await res.json();
        setInitialCards(sortCards(demo.initialCards));
        setRoundCard(demo.roundCard);
      }
      setLoading(false);
    }
    fetchDemo();
  }, []);

  // Timer di 30 secondi
  useEffect(() => {
    if (loading || showResult) return;
    if (timer <= 0) {
      handleSubmit(null, true); // Simula timeout
      return;
    }
    const t = setTimeout(() => setTimer((old) => old - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [timer, loading, showResult]);

  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  async function handleSubmit(e, timeout = false) {
    if (e) e.preventDefault();
    if (chosenPos === null && !timeout) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" });
      return;
    }
    // Ottieni dettaglio carta da demo (l'API /api/demo non fornisce misfortune_index per la roundCard)
    const cardRes = await fetch(`http://localhost:3001/api/cards/${roundCard.card_id}`);
    const cardFull = await cardRes.json();
    // Trova posizione reale
    let pos = 0;
    while (pos < initialCards.length && cardFull.misfortune_index > initialCards[pos].misfortune_index) pos++;
    const guessedCorrectly = !timeout && pos === chosenPos;

    if (timeout) {
      setFeedback({ type: "danger", msg: "Tempo scaduto! Non hai vinto la carta." });
    } else if (guessedCorrectly) {
      setFeedback({ type: "success", msg: "Bravo! Posizione corretta, avresti vinto la carta." });
    } else {
      setFeedback({
        type: "danger",
        msg: `Errore! La posizione corretta era ${pos + 1}.`,
        extra: `Indice reale: ${cardFull.misfortune_index}`,
      });
    }
    setShowResult(true);
  }

  function handleReplay() {
    // Ricarica la pagina demo
    window.location.reload();
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="mx-auto">
          <h2 className="text-primary">Demo: gioca un solo round!</h2>
          {loading && <Alert variant="info">Caricamento demo...</Alert>}
          {!loading && (
            <>
              <div className="mb-3">
                <strong>Le tue carte iniziali:</strong>
                <Row className="mb-2">
                  {initialCards.map((c, idx) => (
                    <Col key={c.card_id} xs={6} md={4} className="mb-2">
                      <Card border="primary" className="h-100">
                        <Card.Img variant="top" src={c.image} style={{ height: 70, objectFit: "cover" }} />
                        <Card.Body>
                          <Card.Text style={{ fontSize: "0.9em" }}>{c.description}</Card.Text>
                          <div className="text-muted" style={{ fontSize: "0.8em" }}>Indice: {c.misfortune_index}</div>
                        </Card.Body>
                      </Card>
                      {idx < initialCards.length - 1 && (
                        <div className="text-center text-secondary" style={{ fontSize: "1.5em" }}>&darr;</div>
                      )}
                    </Col>
                  ))}
                </Row>
              </div>
              {roundCard && (
                <>
                  <Alert variant="info">
                    <b>Nuova situazione:</b> &nbsp;
                    <img src={roundCard.image} alt="" width={50} style={{ verticalAlign: "middle" }} /> &nbsp;
                    <span style={{ fontWeight: 500 }}>{roundCard.description}</span>
                  </Alert>
                  <ProgressBar now={timer * 100 / 30} label={`${timer}s`} variant={timer > 10 ? "success" : "danger"} className="mb-3" />
                  {!showResult && (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group>
                        <Form.Label>In quale posizione tra le tue carte la inseriresti?</Form.Label>
                        <div>
                          {Array(initialCards.length + 1).fill(0).map((_, i) => (
                            <Form.Check
                              inline
                              key={i}
                              label={i === 0 ? "Prima di tutte" : i === initialCards.length ? "Dopo tutte" : `Tra ${i} e ${i + 1}`}
                              name="position"
                              type="radio"
                              value={i}
                              checked={chosenPos === i}
                              onChange={handlePositionChange}
                              disabled={showResult}
                            />
                          ))}
                        </div>
                      </Form.Group>
                      <Button type="submit" className="mt-2" disabled={showResult}>
                        Conferma posizione
                      </Button>
                    </Form>
                  )}
                  {feedback && (
                    <Alert variant={feedback.type} className="mt-3">
                      {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
                      {showResult && (
                        <Button className="mt-3" onClick={handleReplay}>
                          Prova un'altra demo
                        </Button>
                      )}
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default DemoPage;