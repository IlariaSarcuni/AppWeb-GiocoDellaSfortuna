import React from 'react';
import { Container } from 'react-bootstrap';

function Footer() {
  return (
    <>
      <footer className="footer mt-5 py-4 text-white fw-bold" style={{ backgroundColor: '#B4C3B3' }}>
        <Container className="text-center">
          <div className="mb-2">
            <i className="bi bi-cloud-drizzle-fill text-info me-1"></i>
            Sfortunity — Il gioco delle sfortune universitarie
          </div>
          <div className="text-muted small">
            &copy; 2025 Applicazioni Web I
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Footer;