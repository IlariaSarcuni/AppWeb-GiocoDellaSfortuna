import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert, Form, Button, ProgressBar } from "react-bootstrap";
import API from '../API.mjs';

function sortCards(cards) {
  return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
}

function DemoGame() {
  const [initialCards, setInitialCards] = useState([]);
  const [roundCard, setRoundCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chosenPos, setChosenPos] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timer, setTimer] = useState(30);
  const [showResult, setShowResult] = useState(false);

  //Funzione per caricare la demo
  async function loadDemo() {
    setLoading(true);
    setShowResult(false);
    setChosenPos(null);
    setFeedback(null);
    setTimer(30);

    try {
      const demo = await API.getDemoCards();
      setInitialCards(sortCards(demo.initialCards));
      setRoundCard(demo.roundCard);
    } catch (err) {
      setFeedback({ type: "danger", msg: "Errore nel caricamento della demo." });
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDemo();
  }, []);

  useEffect(() => {
    if (loading || showResult) return;
    if (timer <= 0) {
      handleSubmit(null, true);
      return;
    }
    const t = setTimeout(() => setTimer((old) => old - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, loading, showResult]);

  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  async function handleSubmit(e, timeout = false) {
    if (e) e.preventDefault();
    if (loading || !roundCard || roundCard.misfortune_index == null) {
      setFeedback({ type: "danger", msg: "La situazione non è pronta. Ricarica la demo." });
      setShowResult(true);
      return;
    }
    if (chosenPos === null && !timeout) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" });
      return;
    }

    let misfortuneIndex = roundCard.misfortune_index;

    let pos = 0;
    while (pos < initialCards.length && misfortuneIndex > initialCards[pos].misfortune_index) pos++;
    const guessedCorrectly = !timeout && pos === chosenPos;

    if (timeout) {
      setFeedback({ type: "danger", msg: "Tempo scaduto!", extra: `Indice di sfortuna: ${misfortuneIndex}` });
    } else if (guessedCorrectly) {
      setFeedback({ type: "success", msg: "Complimenti, posizione corretta!", extra: `Indice di sfortuna: ${misfortuneIndex}` });
    } else {
      setFeedback({ type: "danger", msg: `Errore! La posizione corretta era ${pos + 1}.`, extra: `Indice di sfortuna: ${misfortuneIndex}`});
    }
    setShowResult(true);
  }

  async function handleReplay() {
    await loadDemo();
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
                          <div className="text-center" style={{ fontSize: "1.3em", fontWeight: "bold" }}>{c.misfortune_index}</div>
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
                        <Form.Label>Qual è la posizione corretta?</Form.Label>
                        <div>
                          {Array(initialCards.length + 1).fill(0).map((_, i) => (
                            <Form.Check
                              inline
                              key={i}
                              label={
                                i === 0
                                  ? "Prima"
                                  : i === initialCards.length
                                    ? "Ultima"
                                    : `Tra ${i} e ${i + 1}`
                              }
                              name="position"
                              type="radio"
                              value={i}
                              checked={chosenPos === i}
                              onChange={handlePositionChange}
                              disabled={showResult || loading}
                            />
                          ))}
                        </div>
                      </Form.Group>
                      <Button type="submit" className="mt-2" disabled={showResult || loading}>
                        Conferma
                      </Button>
                    </Form>
                  )}
                  {feedback && (
                    <Alert variant={feedback.type} className="mt-3">
                      {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
                      {showResult && (
                        <>
                          <Button className="mt-3 me-2" onClick={handleReplay} disabled={loading}>Prova un'altra demo</Button>
                          <Button className="mt-3" href="/">Torna alla home</Button>
                        </>
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

export default DemoGame;