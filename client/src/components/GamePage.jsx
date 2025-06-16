import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Alert, Form, Button, ProgressBar, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router";
import API from "../API.mjs";
import '../index.css';

function sortCards(cards) {
  return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
}

let isGameSetupInProgress = false;

function GamePage(props) {
  const [loading, setLoading] = useState(false);
  const [isCreatingGameState, setIsCreatingGameState] = useState(false);
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
  const [playedCards, setPlayedCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || showResult || gameOver || !gameId || isCreatingGameState) return;
    if (timer <= 0) {
      handleSubmit(null, true);
      return;
    }
    const t = setTimeout(() => setTimer((old) => old - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, loading, showResult, gameOver, gameId, isCreatingGameState]);

  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  async function handleStartGame() {
    if (isGameSetupInProgress) {
      return;
    }

    isGameSetupInProgress = true;
    setIsCreatingGameState(true);
    setLoading(true);
    setFeedback(null); // Pulisce feedback precedenti

    setGameOver(false);
    setStatus("ongoing");
    setTimer(30);
    setShowResult(false);
    setRoundNumber(1);
    setChosenPos(null);
    setNumWon(0);
    setNumLost(0);
    setWonCards([]);
    setAllCards([]);
    setGameId(null); // Resetta gameId all'inizio

    try {
      const { game_id } = await API.createGame();
      setGameId(game_id);

      const initCardsData = await API.getInitialCards();
      const sortedInitCards = sortCards(initCardsData);
      setInitialCards(sortedInitCards);
      setAllCards(sortedInitCards);
      initialCardsStateRef.current = sortedInitCards;

      await API.saveInitialCards(game_id, initCardsData.map(c => c.card_id));

      const sit = await API.getSituation(game_id);
      setSituation(sit);
      
      setWonCards([]);
      setIsFirstLoad(false);

    } catch (err) {
      const errorMessage = err?.message || ('Errore sconosciuto durante la creazione della partita.');
      setFeedback({ type: "danger", msg: `Errore creazione partita: ${errorMessage}` });
      setGameId(null); // Assicura che gameId sia null in caso di errore
    } finally {
      isGameSetupInProgress = false;
      setIsCreatingGameState(false);
      setLoading(false);
    }
  }
  
  async function handleSubmit(e, timeout = false) {
    if (e) e.preventDefault();
    setFeedback(null); // Pulisce feedback precedenti prima di validare/sottomettere

    if (loading || !situation || situation.misfortune_index == null) {
      setFeedback({ type: "danger", msg: "La situazione non è pronta. Riprova." });
      if (situation) setPlayedCards(prev => [...prev, situation]);
      setShowResult(true);
      return;
    }
    if (chosenPos === null && !timeout) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" }); // Verrà mostrato vicino al form
      return;
    }

    let misfortuneIndex = situation.misfortune_index;
    let sorted = sortCards(allCards);
    let pos = 0;
    while (pos < sorted.length && misfortuneIndex > sorted[pos].misfortune_index) pos++;
    const guessedCorrectly = !timeout && pos === chosenPos;

    try {
      const { round_id } = await API.addRound(gameId, situation.card_id, roundNumber);
      roundIdRef.current = round_id;

      await API.updateRoundResult(round_id, guessedCorrectly ? 1 : 0, chosenPos);

      if (guessedCorrectly) {
        setFeedback({
          type: "success",
          msg: "Complimenti, posizione corretta!",
          extra: `Indice di sfortuna: ${misfortuneIndex}`
        });
        const updated = sortCards([...allCards, situation]);
        setAllCards(updated);
        setNumWon((nw) => nw + 1);

        const updatedWon = await API.getWonCards(gameId);
        setWonCards(updatedWon);

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
            : "Errore! Non hai indovinato la posizione corretta."
        });
        setNumLost((nl) => nl + 1);

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

  async function handleNextRound() {
    setLoading(true);
    setChosenPos(null);
    setTimer(30);
    setFeedback(null); // Pulisce feedback precedenti
    setShowResult(false);

    try {
      const sit = await API.getSituation(gameId);
      setSituation(sit);
      setRoundNumber(rn => rn + 1);
    } catch (err) { 
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Errore sconosciuto durante il caricamento della situazione.');
      setFeedback({ type: "danger", msg: `Errore nel caricamento della situazione: ${errorMessage}. Riprova.` });
    }
    setLoading(false);
  }

  function handleShowSummary() {
    navigate(`/game/summary`, { state: { gameId: gameId, playedCards: playedCards } });
  }

  useEffect(() => {
    if (!gameId && isFirstLoad && !isGameSetupInProgress && !feedback) { 
      handleStartGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isFirstLoad]); 


  function renderCardList() {
    const sorted = sortCards(allCards);
    return (
      <Row className="justify-content-center mb-4 align-items-stretch">
        {situation && (
          <Col xs={12} sm={6} md={4} lg={3} className="mb-3 d-flex align-items-stretch">
            <Card border="warning" className="card-warning h-100 w-100">
              {situation.image && (
                <Card.Img
                  variant="top"
                  src={`http://localhost:3001/img/${situation.image}`}
                  alt="img"
                  className="card-img-top"
                />
              )}
              <Card.Body className="text-center d-flex flex-column justify-content-center">
                <Card.Title className="card-title">Nuova situazione</Card.Title>
                <Card.Text className="fw-semibold" style={{ fontSize: "1.03rem" }}>
                  {situation.description}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
        {sorted.map((c) => (
          <Col key={c.card_id} xs={12} sm={6} md={4} lg={3} className="mb-3 d-flex align-items-stretch">
            <Card className="card-default h-100 w-100">
              {c.image && (
                <Card.Img
                  variant="top"
                  src={`http://localhost:3001/img/${c.image}`}
                  alt="img"
                  className="card-img-top"
                />
              )}
              <Card.Body className="d-flex flex-column justify-content-between">
                <Card.Text>{c.description}</Card.Text>
                <div className="misfortune-index">
                  {c.misfortune_index}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  function renderEndMessage() {
    if (status === "win") {
      return (
        <>
          <Alert variant="success" className="mt-3">
            <h4>Hai vinto!</h4>
            <p>Hai raccolto tutte le 6 carte!</p>
          </Alert>
          <div className="mt-3">
            <Button className="me-2" onClick={handleShowSummary}>Vedi riepilogo</Button>
          </div>
        </>
      );
    }
    if (status === "lose") {
      return (
        <>
          <Alert variant="danger" className="mt-3">
            <h4>Partita persa!</h4>
            <p>Hai commesso 3 errori. Riprova!</p>
          </Alert>
          <div className="mt-3 mb-3">
            <Button className="me-2" onClick={handleShowSummary}>Vedi riepilogo</Button>
          </div>
        </>
      );
    }
    return null;
  }
  
  // Schermata di caricamento iniziale per la creazione della partita
  if (isFirstLoad && isCreatingGameState) { 
      return (
          <Container className="text-center mt-5">
              <Spinner animation="border" role="status">
                  <span className="visually-hidden">Creazione partita in corso...</span>
              </Spinner>
              <p>Creazione partita in corso...</p>
          </Container>
      );
  }

  // Se la creazione della partita è fallita (gameId è null e c'è un feedback di errore)
  // e non siamo nel mezzo di un tentativo di creazione.
  if (!gameId && feedback && feedback.type === 'danger' && !isCreatingGameState) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">{feedback.msg}</Alert>
        <Button onClick={() => {
          // Non serve setFeedback(null) qui perché handleStartGame lo farà o lo sovrascriverà
          handleStartGame(); 
        }} className="mt-3">
          Riprova a iniziare una nuova partita
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-3 mb-3">
      {/* Spinner di caricamento generico (es. durante handleNextRound) */}
      {loading && !isCreatingGameState && 
        <Container className="text-center mt-5">
          <Spinner animation="border" />
          <p>Caricamento...</p>
        </Container>
      }

      {/* Interfaccia di gioco principale (mostrata solo se gameId esiste e non c'è un caricamento critico) */}
      {gameId && !loading && (
        <Row>
          <Col md={8} className="mx-auto">
            <>
              <div className="mb-3">
                <h2>Round n°{roundNumber}:</h2>
                {renderCardList()}
              </div>
              <div>
                <p className="fw-bold fs-4">
                  Carte raccolte: {allCards.length} / 6 &nbsp; | &nbsp; Errori: {numLost} / 3
                </p>
              </div>

              {/* Alert per errori non legati al risultato del form (es. fallimento caricamento situazione) */}
              {feedback && !showResult && feedback.type === 'danger' && feedback.msg !== "Seleziona una posizione!" && (
                <Alert variant="danger" className="mt-3">{feedback.msg}</Alert>
              )}

              {!gameOver && situation && (
                <>
                  <ProgressBar now={timer * 100 / 30} label={`${timer}s`} variant={timer > 10 ? "success" : "danger"} className="mb-3" />
                  {!showResult && (
                    <Form onSubmit={handleSubmit}>
                      {/* Alert per validazione "Seleziona una posizione!" */}
                      {feedback && feedback.msg === "Seleziona una posizione!" && !showResult && (
                        <Alert variant="warning" className="mt-0 mb-3">{feedback.msg}</Alert>
                      )}
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
                      <Button type="submit" className="mt-3 mb-3" disabled={showResult || loading}>
                        Conferma
                      </Button>
                    </Form>
                  )}
                  
                  {/* Feedback dopo aver sottomesso il form (successo/errore/timeout) */}
                  {feedback && showResult && (
                    <>
                      <Alert variant={feedback.type} className="mt-3">
                        {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
                      </Alert>
                      {!gameOver && ( // Mostra "Prossimo round" solo se il gioco non è finito
                        <Button className="mt-2 mb-3" onClick={handleNextRound} disabled={loading}>
                          Prossimo round
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
              {gameOver && renderEndMessage()}
            </>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default GamePage;