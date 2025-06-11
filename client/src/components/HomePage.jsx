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
            Il gioco delle sfortune universitarie ispirato a "Stuff Happens".<br />
            Dimostra la tua fortuna... o la tua sfortuna!
          </p>
          <div className="mb-3">
            <strong>Come funziona?</strong>
            <ul className="text-start d-inline-block mt-2">
              <li>Ottieni 3 carte iniziali con situazioni sfortunate.</li>
              <li>Posiziona la nuova situazione nella giusta posizione tra le tue carte, senza vedere il suo punteggio!</li>
              <li>Indovina per vincere la carta. Vinci dopo aver raccolto 6 carte, perdi dopo 3 errori.</li>
              <li>
                {!props.loggedIn
                  ? <span>Puoi giocare una <span className="text-primary">partita demo</span> senza registrazione (1 solo round).</span>
                  : <span>Accedi per giocare partite complete e vedere la tua cronologia!</span>
                }
              </li>
            </ul>
          </div>
          <div className="btn-home d-flex justify-content-center gap-2">
            {!props.loggedIn && (
              <Link className='btn btn-primary' to="/demo">GIOCA UNA DEMO</Link>
            )}
            {props.loggedIn && (
              <Link className='btn btn-success' to="/game">GIOCA ORA</Link>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;