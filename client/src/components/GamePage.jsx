import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Alert, Form, Button, ProgressBar, Spinner } from "react-bootstrap";
import API from "../API.mjs";
import { useNavigate } from "react-router";

function sortCards(cards) {
  return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
}

function GamePage({ user }) {
  const [loading, setLoading] = useState(true);
  const [initialCards, setInitialCards] = useState([]);
  const [situation, setSituation] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [chosenPos, setChosenPos] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timer, setTimer] = useState(30);
  const [showResult, setShowResult] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [numWon, setNumWon] = useState(0);
  const [numLost, setNumLost] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("ongoing");
  const [wonCards, setWonCards] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const roundIdRef = useRef(null);

  const navigate = useNavigate();

  // Inizializza nuova partita
  useEffect(() => {
    const startGame = async () => {
      setLoading(true);
      setGameOver(false);
      setStatus("ongoing");
      setFeedback(null);
      setTimer(30);
      setShowResult(false);
      setRoundNumber(1);
      setNumWon(0);
      setNumLost(0);
      setWonCards([]);
      setAllCards([]);

      try {
        // 1. Crea partita
        const { game_id } = await API.createGame();
        setGameId(game_id);

        // 2. Ottieni 3 carte iniziali random
        const initCards = await API.getInitialCards();
        setInitialCards(sortCards(initCards));
        setAllCards(sortCards(initCards));

        // 3. Salva carte iniziali nel DB (round_number=0)
        await API.saveInitialCards(game_id, initCards.map(c => c.card_id));

        // 4. Ottieni la prima situazione da indovinare
        const sit = await API.getSituation(game_id);
        setSituation(sit);

        // 5. Ottieni eventuali carte vinte (inizialmente nessuna)
        setWonCards([]);
        setLoading(false);
        setIsFirstLoad(false);
      } catch (err) {
        setFeedback({ type: "danger", msg: "Errore durante la creazione della partita. Riprova." });
        setLoading(false);
      }
    };

    startGame();
    // eslint-disable-next-line
  }, []);

  // Aggiornamento timer round
  useEffect(() => {
    if (loading || showResult || gameOver) return;
    if (timer <= 0) {
      handleSubmit(null, true);
      return;
    }
    const t = setTimeout(() => setTimer((old) => old - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [timer, loading, showResult, gameOver]);

  // Gestione selezione posizione
  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  // Gestione invio risposta round
  async function handleSubmit(e, timeout = false) {
    if (e) e.preventDefault();
    if (loading || !situation || situation.misfortune_index == null) {
      setFeedback({ type: "danger", msg: "La situazione non è pronta. Riprova." });
      setShowResult(true);
      return;
    }
    if (chosenPos === null && !timeout) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" });
      return;
    }

    let misfortuneIndex = situation.misfortune_index;

    // Calcola posizione corretta tra le carte in possesso (allCards)
    let sorted = sortCards(allCards);
    let pos = 0;
    while (pos < sorted.length && misfortuneIndex > sorted[pos].misfortune_index) pos++;
    const guessedCorrectly = !timeout && pos === chosenPos;

    // 1. Registra il round (API.addRound restituisce round_id)
    try {
      const round_id = await API.addRound(gameId, situation.card_id, roundNumber);
      roundIdRef.current = round_id;

      // 2. Aggiorna esito round
      await API.updateRoundResult(round_id, guessedCorrectly ? 1 : 0, chosenPos);

      // 3. Aggiorna stato locale
      if (guessedCorrectly) {
        setFeedback({
          type: "success",
          msg: "Complimenti, posizione corretta!",
          extra: `Indice di sfortuna: ${misfortuneIndex}`
        });
        // Aggiungi carta vinta all'insieme di carte possedute
        const updated = sortCards([...allCards, situation]);
        setAllCards(updated);
        setNumWon((nw) => nw + 1);

        // Aggiorna elenco carte vinte
        const updatedWon = await API.getWonCards(gameId);
        setWonCards(updatedWon);

        // Controlla se vince la partita (6 carte)
        if (updated.length === 6) {
          await API.updateGameStatus(gameId, "win");
          setStatus("win");
          setGameOver(true);
        }
      } else {
        setFeedback({
          type: timeout ? "danger" : "danger",
          msg: timeout
            ? "Tempo scaduto!"
            : `Errore! La posizione corretta era ${pos + 1}.`,
          extra: `Indice di sfortuna: ${misfortuneIndex}`
        });
        setNumLost((nl) => nl + 1);

        // Controlla se perde (3 errori)
        if (numLost + 1 >= 3) {
          await API.updateGameStatus(gameId, "lose");
          setStatus("lose");
          setGameOver(true);
        }
      }
      setShowResult(true);
    } catch (err) {
      setFeedback({ type: "danger", msg: "Errore nel salvataggio del round." });
      setShowResult(true);
    }
  }

  // Gestisci nuovo round
  async function handleNextRound() {
    setLoading(true);
    setChosenPos(null);
    setTimer(30);
    setFeedback(null);
    setShowResult(false);

    try {
      // Ottieni nuova situazione da indovinare (API si occupa di non ripetere carte già usate)
      const sit = await API.getSituation(gameId);
      setSituation(sit);
      setRoundNumber(rn => rn + 1);
    } catch (err) {
      setFeedback({ type: "danger", msg: "Errore nel caricamento della situazione. Riprova." });
    }
    setLoading(false);
  }

  // Riepilogo finale
  function handleShowSummary() {
    navigate("/summary", { state: { gameId } });
  }

  // Riavvia una nuova partita
  function handleRestartGame() {
    window.location.reload();
  }

  // Visualizza riepilogo carte possedute (iniziali + vinte)
  function renderCardList() {
    const sorted = sortCards(allCards);
    return (
      <Row className="mb-2">
        {sorted.map((c, idx) => (
          <Col key={c.card_id} xs={6} md={4} className="mb-2">
            <Card border="primary" className="h-100">
              <Card.Img variant="top" src={c.image} style={{ height: 70, objectFit: "cover" }} />
              <Card.Body>
                <Card.Text style={{ fontSize: "0.9em" }}>{c.description}</Card.Text>
                <div className="text-center" style={{ fontSize: "1.3em", fontWeight: "bold" }}>{c.misfortune_index}</div>
              </Card.Body>
            </Card>
            {idx < sorted.length - 1 && (
              <div className="text-center text-secondary" style={{ fontSize: "1.5em" }}>&darr;</div>
            )}
          </Col>
        ))}
      </Row>
    );
  }

  // Messaggio di fine partita
  function renderEndMessage() {
    if (status === "win") {
      return (
        <Alert variant="success" className="mt-3">
          <h4>Hai vinto!</h4>
          <p>Hai raccolto tutte le 6 carte!</p>
          <Button className="me-2" onClick={handleShowSummary}>Vedi riepilogo</Button>
          <Button variant="secondary" onClick={handleRestartGame}>Nuova partita</Button>
        </Alert>
      );
    }
    if (status === "lose") {
      return (
        <Alert variant="danger" className="mt-3">
          <h4>Partita persa!</h4>
          <p>Hai commesso 3 errori. Riprova!</p>
          <Button className="me-2" onClick={handleShowSummary}>Vedi riepilogo</Button>
          <Button variant="secondary" onClick={handleRestartGame}>Nuova partita</Button>
        </Alert>
      );
    }
    return null;
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="mx-auto">
          <h2>Partita {gameId}</h2>
          {loading && (
            <Alert variant="info">
              <Spinner animation="border" size="sm" /> Caricamento...
            </Alert>
          )}

          {!loading && (
            <>
              <div className="mb-3">
                <strong>Le tue carte:</strong>
                {renderCardList()}
              </div>
              <div>
                <b>Carte raccolte: {allCards.length} / 6 &nbsp; | &nbsp; Errori: {numLost} / 3</b>
              </div>

              {/* Situazione da indovinare */}
              {!gameOver && situation && (
                <>
                  <Alert variant="info" className="mt-3">
                    <b>Situzione da collocare:</b> &nbsp;
                    <img src={situation.image} alt="" width={50} style={{ verticalAlign: "middle" }} /> &nbsp;
                    <span style={{ fontWeight: 500 }}>{situation.description}</span>
                  </Alert>
                  <ProgressBar now={timer * 100 / 30} label={`${timer}s`} variant={timer > 10 ? "success" : "danger"} className="mb-3" />
                  {!showResult && (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group>
                        <Form.Label>Qual è la posizione corretta?</Form.Label>
                        <div>
                          {Array(allCards.length + 1).fill(0).map((_, i) => (
                            <Form.Check
                              inline
                              key={i}
                              label={
                                i === 0
                                  ? "Prima"
                                  : i === allCards.length
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
                  {/* Feedback round */}
                  {feedback && showResult && (
                    <Alert variant={feedback.type} className="mt-3">
                      {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
                      {!gameOver && (
                        <Button className="mt-3" onClick={handleNextRound} disabled={loading}>
                          Prossimo round
                        </Button>
                      )}
                    </Alert>
                  )}
                </>
              )}

              {/* Fine partita */}
              {gameOver && renderEndMessage()}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default GamePage;