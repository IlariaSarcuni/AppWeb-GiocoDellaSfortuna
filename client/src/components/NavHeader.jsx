import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router';
import { LogoutButton } from './AuthComponents';

function NavHeader(props) {
  return (
    <Navbar bg="success" data-bs-theme="dark" expand="lg">
      <Container fluid>
        <Link to="/" className="navbar-brand">HeapOverrun</Link>
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