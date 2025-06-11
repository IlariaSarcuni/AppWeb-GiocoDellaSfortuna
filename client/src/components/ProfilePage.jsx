import React, { useEffect, useState } from "react";
import { Container, Row, Col, Alert, Spinner, Table, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        setError(null);
        // Recupera la sessione utente corrente
        const userRes = await fetch("http://localhost:3001/api/sessions/current", { credentials: "include" });
        if (!userRes.ok) throw new Error("Sessione utente non trovata.");
        const user = await userRes.json();
        // Prendi la cronologia partite
        const res = await fetch(`http://localhost:3001/api/games/user/${user.user_id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Errore nel recupero delle partite.");
        const data = await res.json();
        setGames(data);
      } catch (err) {
        setError(err.message || "Errore imprevisto!");
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  function handleGoToSummary(game) {
    navigate("/game/summary", { state: { gameId: game.game_id, result: game.status } });
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Il tuo profilo</h2>
      {loading && (
        <Row><Col className="text-center"><Spinner animation="border" /> <span>Caricamento...</span></Col></Row>
      )}
      {error && (
        <Row><Col><Alert variant="danger">{error}</Alert></Col></Row>
      )}
      {!loading && !error && (
        <>
          <h4>Cronologia partite</h4>
          {games.length === 0 ? (
            <Alert variant="info">Non hai ancora giocato nessuna partita!</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => (
                  <tr key={game.game_id}>
                    <td>{new Date(game.date).toLocaleString()}</td>
                    <td>
                      {game.status === "win" && <Badge bg="success">Vinta</Badge>}
                      {game.status === "lose" && <Badge bg="danger">Persa</Badge>}
                      {game.status === "ongoing" && <Badge bg="warning" text="dark">In corso</Badge>}
                    </td>
                    <td>
                      {(game.status === "win" || game.status === "lose") && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleGoToSummary(game)}
                        >
                          Riepilogo
                        </Button>
                      )}
                      {game.status === "ongoing" && (
                        <span className="text-muted">In corso</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </Container>
  );
}

export default ProfilePage;