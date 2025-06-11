import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router';

function NotFound() {
  return (
    <Container className="screen text-center mt-5">
      <Row>
        <Col>
          <h1 className="display-3 text-danger">404</h1>
          <h2>Pagina non trovata</h2>
          <p className="lead">
            Oops! La pagina che stai cercando non esiste.<br />
            Controlla l'indirizzo o torna alla <Link to="/" className="text-primary">Home Page</Link>.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;