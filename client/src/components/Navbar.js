import { useState, useEffect } from 'react';
import { Navbar as BootstrapNavbar, Nav, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [token, setToken] = useState(localStorage.getItem('token')); // Track token in state
  const location = useLocation(); // Detect route changes
  const navigate = useNavigate();

  // Update token state when route changes or on mount
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [location]); // Re-run when location changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null); // Update state to force re-render
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <BootstrapNavbar.Brand as={Link} to="/">Labor Management</BootstrapNavbar.Brand>
      <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BootstrapNavbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto">
          {!token ? (
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          ) : (
            <>
              {localStorage.getItem('role') === 'super_admin' && (
                <Nav.Link as={Link} to="/super-admin">Super Admin Dashboard</Nav.Link>
              )}
              {localStorage.getItem('role') === 'company_admin' && (
                <Nav.Link as={Link} to="/company-admin">Company Admin Dashboard</Nav.Link>
              )}
              {localStorage.getItem('role') === 'worker_manager' && (
                <Nav.Link as={Link} to="/worker-manager">Worker Manager Dashboard</Nav.Link>
              )}
              <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </Nav>
      </BootstrapNavbar.Collapse>
    </BootstrapNavbar>
  );
};

export default Navbar;