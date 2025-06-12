import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router';
import { LogoutButton } from './AuthPage';

function NavHeader(props) {
  return (
    <Navbar bg="success" data-bs-theme="dark" expand="lg">
      <Container fluid>
        <Link to="/" className="navbar-brand ms-3">Sfortunity</Link>
        <div className="ms-auto me-3">
          {props.loggedIn ? (
            <LogoutButton logout={props.handleLogout} />
          ) : (
            <Link to="/login" className="btn btn-outline-light">
              Login
            </Link>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavHeader;