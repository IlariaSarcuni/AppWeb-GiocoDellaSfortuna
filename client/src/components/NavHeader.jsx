import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router';
import { LogoutButton } from './AuthPage';

function NavHeader(props) {
  return (
    <Navbar bg="warning" data-bs-theme="dark" expand="lg">
      <Container fluid>
        <Link to="/" className="navbar-brand">Sfortunity</Link>
        {props.loggedIn ? (
          <LogoutButton logout={props.handleLogout} />
        ) : (
          <Link to="/login" className="btn btn-outline-light">
            Login
          </Link>
        )}
      </Container>
    </Navbar>
  );
}

export default NavHeader;