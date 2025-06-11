import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Col, Container, Form, Row, ProgressBar, Card as BsCard } from "react-bootstrap";

// Utility per ordinare le carte per indice crescente
function sortCards(cards) {
  return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
}

function GamePage() {
  // Stato
  const [gameId, setGameId] = useState(null);
  const [initialCards, setInitialCards] = useState([]);
  const [wonCards, setWonCards] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundCard, setRoundCard] = useState(null);
  const [chosenPos, setChosenPos] = useState(null);
  const [timer, setTimer] = useState(30);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [roundsLost, setRoundsLost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waitingNext, setWaitingNext] = useState(false);

  const navigate = useNavigate();
  const timerRef = useRef();

  // Avvio partita: 1. Prendi utente 2. Carte 3. Crea partita
  useEffect(() => {
    async function startGame() {
      try {
        // Ottieni user
        const userRes = await fetch("http://localhost:3001/api/sessions/current", { credentials: "include" });
        if (!userRes.ok) throw new Error("Non autenticato");
        const user = await userRes.json();

        // Prendi 3 carte iniziali
        const cardsRes = await fetch("http://localhost:3001/api/cards?count=3", { credentials: "include" });
        const cards = await cardsRes.json();

        // Crea partita sul server
        const gameRes = await fetch("http://localhost:3001/api/games", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.user_id, initialCardIds: cards.map(c => c.card_id) }),
        });
        const { game_id } = await gameRes.json();
        setGameId(game_id);
        setInitialCards(sortCards(cards));
        setWonCards([]); // reset
        setRoundNumber(1);
        setRoundsLost(0);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError("Errore avvio partita: " + err.message);
        setLoading(false);
      }
    }
    startGame();
    // eslint-disable-next-line
  }, []);

  // Ogni round: recupera nuova carta da indovinare
  useEffect(() => {
    if (!gameId || loading) return;
    // Se partita già finita, non fare nulla
    if (wonCards.length >= 6 || roundsLost >= 3) return;

    async function fetchRoundCard() {
      // Carte da escludere: iniziali + già vinte + già giocate
      const exclude = [
        ...initialCards.map(c => c.card_id),
        ...wonCards.map(c => c.card_id),
      ];
      const params = new URLSearchParams();
      exclude.forEach(id => params.append("exclude", id));
      params.append("withMisfortuneIndex", "false");

      const res = await fetch(`http://localhost:3001/api/games/${gameId}/next-card?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setError("Nessuna altra carta disponibile o errore server.");
        setRoundCard(null);
        return;
      }
      const card = await res.json();
      setRoundCard(card);
      setChosenPos(null);
      setFeedback(null);
      setTimer(30);
      setWaitingNext(false);
    }
    fetchRoundCard();
    // eslint-disable-next-line
  }, [gameId, roundNumber, loading]);

  // Timer countdown
  useEffect(() => {
    if (feedback || loading || !roundCard) return;
    if (timer <= 0) {
      handleTimeExpire();
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [timer, feedback, loading, roundCard]);

  // Gestione scelta posizione
  function handlePositionChange(e) {
    setChosenPos(Number(e.target.value));
  }

  // Quando l'utente conferma la posizione
  async function handleSubmit(e) {
    e.preventDefault();
    if (chosenPos === null) {
      setFeedback({ type: "danger", msg: "Seleziona una posizione!" });
      return;
    }
    clearTimeout(timerRef.current);

    // Ottieni dettagli carta vera per confronto (indice sfortuna)
    const cardRes = await fetch(`http://localhost:3001/api/cards/${roundCard.card_id}`, { credentials: "include" });
    const cardFull = await cardRes.json();
    // Unisci carte in possesso
    const allCards = sortCards([...initialCards, ...wonCards]);
    // Trova posizione reale
    let pos = 0;
    while (pos < allCards.length && cardFull.misfortune_index > allCards[pos].misfortune_index) pos++;
    const guessedCorrectly = pos === chosenPos;

    // Salva round su server
    await fetch(`http://localhost:3001/api/games/${gameId}/rounds`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: roundCard.card_id,
        round_number: roundNumber,
        guessed_correctly: guessedCorrectly ? 1 : 0,
        chosen_position: chosenPos,
        time: 30 - timer,
      }),
    });

    // Feedback e aggiorna carte se vinto
    if (guessedCorrectly) {
      setWonCards(prev => sortCards([...prev, cardFull]));
      setFeedback({ type: "success", msg: "Bravo! Posizione corretta, hai vinto la carta." });
    } else {
      setRoundsLost(x => x + 1);
      setFeedback({
        type: "danger",
        msg: `Errore! La posizione corretta era ${pos + 1}.`,
        extra: `Indice di sfortuna reale: ${cardFull.misfortune_index}`,
      });
    }
    setWaitingNext(true);
  }

  // Se scade il tempo e non hai risposto
  async function handleTimeExpire() {
    clearTimeout(timerRef.current);
    setFeedback({ type: "danger", msg: "Tempo scaduto! Non hai vinto la carta." });
    setRoundsLost(x => x + 1);

    // Salva round come perso
    await fetch(`http://localhost:3001/api/games/${gameId}/rounds`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: roundCard.card_id,
        round_number: roundNumber,
        guessed_correctly: 0,
        chosen_position: null,
        time: 30,
      }),
    });
    setWaitingNext(true);
  }

  // Avanti round
  function handleNextRound() {
    setRoundNumber(n => n + 1);
    setTimer(30);
    setFeedback(null);
    setChosenPos(null);
  }

  // Fine partita: aggiorna stato su server e vai a summary
  useEffect(() => {
    if (!gameId || loading) return;
    if (wonCards.length >= 6 || roundsLost >= 3) {
      // PATCH stato partita
      fetch(`http://localhost:3001/api/games/${gameId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: wonCards.length >= 6 ? "win" : "lose" }),
      }).then(() =>
        setTimeout(() => navigate("/game/summary", { state: { gameId, result: wonCards.length >= 6 ? "win" : "lose" } }), 1500)
      );
    }
    // eslint-disable-next-line
  }, [wonCards, roundsLost, gameId, loading]);

  if (loading) return <Container className="text-center mt-5"><Alert variant="info">Caricamento partita...</Alert></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (wonCards.length >= 6 || roundsLost >= 3) {
    return (
      <Container className="text-center mt-5">
        <Alert variant={wonCards.length >= 6 ? "success" : "danger"}>
          Partita terminata! 
          {wonCards.length >= 6 ? " Hai vinto!" : " Hai perso!"}
        </Alert>
        <div>Riepilogo in arrivo...</div>
      </Container>
    );
  }

  // Tutte le carte in possesso
  const allCards = sortCards([...initialCards, ...wonCards]);

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="mx-auto">
          <h2 className="text-success">Partita in corso</h2>
          <div className="mb-2">
            <strong>Round:</strong> {roundNumber} / 10 &nbsp; | &nbsp;
            <strong>Carte raccolte:</strong> {wonCards.length + 3}/6 &nbsp; | &nbsp;
            <strong>Errori:</strong> {roundsLost}/3
          </div>
          <ProgressBar now={timer * 100 / 30} label={`${timer}s`} variant={timer > 10 ? "success" : "danger"} className="mb-3" />

          <h5>Le tue carte (ordinate per sfortuna):</h5>
          <Row className="mb-3">
            {allCards.map((c, idx) => (
              <Col key={c.card_id} xs={6} md={4} lg={2} className="mb-2">
                <BsCard border="primary" className="h-100">
                  <BsCard.Img variant="top" src={c.image} style={{ height: 70, objectFit: "cover" }} />
                  <BsCard.Body>
                    <BsCard.Text style={{ fontSize: "0.9em" }}>{c.description}</BsCard.Text>
                    <div className="text-muted" style={{ fontSize: "0.8em" }}>Indice: {c.misfortune_index}</div>
                  </BsCard.Body>
                </BsCard>
                {idx < allCards.length - 1 && (
                  <div className="text-center text-secondary" style={{ fontSize: "1.5em" }}>&darr;</div>
                )}
              </Col>
            ))}
          </Row>

          {roundCard && (
            <>
              <Alert variant="info">
                <b>Nuova carta da posizionare:</b> &nbsp;
                <img src={roundCard.image} alt="" width={50} style={{ verticalAlign: "middle" }} /> &nbsp;
                <span style={{ fontWeight: 500 }}>{roundCard.description}</span>
              </Alert>
              <Form onSubmit={handleSubmit}>
                <Form.Group>
                  <Form.Label>Dove la posizioni tra le tue carte?</Form.Label>
                  <div>
                    {Array(allCards.length + 1).fill(0).map((_, i) => (
                      <Form.Check
                        inline
                        key={i}
                        label={i === 0 ? "Prima di tutte" : i === allCards.length ? "Dopo tutte" : `Tra ${i} e ${i + 1}`}
                        name="position"
                        type="radio"
                        value={i}
                        checked={chosenPos === i}
                        onChange={handlePositionChange}
                        disabled={!!feedback}
                      />
                    ))}
                  </div>
                </Form.Group>
                <Button type="submit" className="mt-2" disabled={!!feedback || chosenPos === null || waitingNext}>
                  Conferma posizione
                </Button>
              </Form>
            </>
          )}

          {feedback &&
            <Alert variant={feedback.type} className="mt-3">
              {feedback.msg} {feedback.extra && <div>{feedback.extra}</div>}
              {waitingNext &&
                <div>
                  <Button className="mt-2" onClick={handleNextRound}>Prossimo round</Button>
                </div>
              }
            </Alert>
          }
        </Col>
      </Row>
    </Container>
  );
}

export default GamePage;