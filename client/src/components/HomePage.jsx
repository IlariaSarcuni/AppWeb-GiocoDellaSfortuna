import { Row, Col, Container } from "react-bootstrap";
import React, { useEffect } from 'react';
import { Link } from "react-router";

function HomePage(props) {


  return (
    <Container className="screen text-center mt-5">
      <Row>
        <Col>
          <h1 className="title">Benvenuto su <span className="fw-bold">Sfortunity</span>!</h1>
          <p className="lead">
            Il gioco delle sfortune universitarie.<br />
            Dimostra la tua fortuna... o la tua sfortuna!
          </p>
          <div className="mb-3">            
            <ul className="text-start d-inline-block mt-2">
              <h5 className="mb-2 mt-0">Come funziona?</h5>
              <li>Ottieni 3 carte iniziali con situazioni sfortunate.</li>
              <li>Posiziona la nuova situazione nella giusta posizione tra le tue carte, senza vedere il suo punteggio!</li>
              <li>Indovina per vincere la carta. Vinci dopo aver raccolto 6 carte, perdi dopo 3 errori.</li>
              <li>
                {!props.loggedIn
                  ? <span>Puoi giocare una <span className="fw-bold">partita demo</span> dalla durata di un round.</span>
                  : <span>Accesso effettuato: puoi iniziare una partita completa o consultare la tua cronologia.</span>
                }
              </li>
            </ul>
          </div>
          <div className="btn-home d-flex justify-content-center gap-2">
            {!props.loggedIn && (
              <Link className='btn btn-primary' to="/demo">GIOCA UNA DEMO</Link>
            )}
            {props.loggedIn && (
              <>
                <Link className='btn btn-success' to="/game">GIOCA ORA</Link>
                <Link className='btn btn-secondary' to="/history">CRONOLOGIA PARTITE</Link>
              </>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;