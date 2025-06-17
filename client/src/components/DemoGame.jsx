import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert, Form, Button, ProgressBar } from "react-bootstrap";
import API from '../API.mjs';
import '../index.css';

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
  }, []); //chiama la funzione una sola volta quando il componente viene montato

  useEffect(() => {
    if (loading || showResult) return;
    if (timer <= 0) {
      handleSubmit(null, true);
      return;
    }
    // Se nessuna delle condizioni sopra è vera, imposta un timer
    const t = setTimeout(() => setTimer((old) => old - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, loading, showResult]); //verrà rieseguito ogni volta che timer, loading o showResult cambia

  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  async function handleSubmit(e, timeout = false) {
    if (e) e.preventDefault();
    if (loading || !roundCard || roundCard.misfortune_index == null) {
      setFeedback({ type: "danger", msg: "La carta non è disponibile. Ricarica la demo." });
      setShowResult(true);
      return;
    }
    // Messaggio di errore se non è stata selezionata una posizione
    if (chosenPos === null && !timeout) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" });
      return;
    }

    let misfortuneIndex = roundCard.misfortune_index;

    let pos = 0;
    while (pos < initialCards.length && misfortuneIndex > initialCards[pos].misfortune_index) pos++;
    const guessedCorrectly = !timeout && pos === chosenPos;

    if (timeout) {
      setFeedback({ type: "danger", msg: "Tempo scaduto!" });
    } else if (guessedCorrectly) {
      setFeedback({ type: "success", msg: "Complimenti, posizione corretta!", extra: `Indice di sfortuna: ${misfortuneIndex}` });
    } else {
      setFeedback({ type: "danger", msg: "Errore! Non hai indovinato la posizione corretta." });
    }
    setShowResult(true);
  }

  async function handleReplay() {
    await loadDemo();
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={10} className="mx-auto">
          <h2 className="mb-4">Demo: gioca un solo round!</h2>
          {loading && <Alert variant="info">Caricamento demo...</Alert>}
          {!loading && (
            <>
              <Row className="justify-content-center mb-4 align-items-stretch">
                {/*Nuova carta situazione */}
                {roundCard && (
                  <Col xs={12} sm={6} md={4} lg={3} className="mb-3 d-flex align-items-stretch">
                    <Card border="warning" className="card-warning h-100 w-100">
                      {roundCard.image && (
                        <Card.Img variant="top" src={`http://localhost:3001/img/${roundCard.image}`} alt={"img"} className="card-img-top" />
                      )}
                      <Card.Body className="text-center d-flex flex-column justify-content-center">
                        <Card.Title className="card-title">Nuova situazione</Card.Title>
                        <Card.Text className="fw-semibold" style={{ fontSize: "1.03rem" }}>{roundCard.description}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Carte iniziali */}
                {initialCards.map((c) => (
                  <Col key={c.card_id} xs={12} sm={6} md={4} lg={3} className="mb-3 d-flex align-items-stretch">
                    <Card className="card-default h-100 w-100">
                      {c.image && (
                        <Card.Img variant="top" src={`http://localhost:3001/img/${c.image}`} alt={"img"} className="card-img-top" />
                      )}
                      <Card.Body>
                        <Card.Text>{c.description}</Card.Text>
                        <div className="misfortune-index">
                          {c.misfortune_index}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <ProgressBar now={timer * 100 / 30} label={`${timer}s`} variant={timer > 10 ? "success" : "danger"} className="mb-3" style={{ height: "12px" }} />

              {roundCard && (
                <>
                  {!showResult && (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group>
                        <Form.Label>Qual è la posizione corretta?</Form.Label>
                        <div>
                          {Array(initialCards.length + 1).fill(0).map((_, i) => (
                            <Form.Check
                              inline
                              key={i}
                              label={i === 0 ? "Prima" : i === initialCards.length ? "Ultima" : `Tra ${i} e ${i + 1}`}
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
                      <Button type="submit" className="mt-3 mb-3" disabled={showResult || loading}>Conferma</Button>
                    </Form>
                  )}

                  {feedback && (
                    <>
                      <Alert variant={feedback.type} className="mt-3">
                        {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
                      </Alert>

                      {showResult && (
                        <div className="mt-3 mb-3"> 
                          <Button className="me-2" onClick={handleReplay} disabled={loading}>Prova un'altra demo</Button>
                          <Button href="/">Torna alla home</Button>
                        </div>
                      )}
                    </>
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