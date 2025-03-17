import { Navbar as BootstrapNavbar, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    };

    return (
        <BootstrapNavbar bg="dark" variant="dark" expand="lg">
            <BootstrapNavbar.Brand as={Link} to="/">Labor Management</BootstrapNavbar.Brand>
            <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
            <BootstrapNavbar.Collapse id="basic-navbar-nav">
                <Nav className="ml-auto">
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
                            <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
                        </>
                    )}
                </Nav>
            </BootstrapNavbar.Collapse>
        </BootstrapNavbar>
    );
};

export default Navbar;