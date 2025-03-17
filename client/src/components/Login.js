import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Attempting login with:', { username });
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                username,
                password,
            });
            console.log('Login response:', response.data);
            
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            
            // Decode and store user data
            const tokenData = JSON.parse(atob(response.data.token.split('.')[1]));
            console.log('Decoded token data:', tokenData);
            
            localStorage.setItem('role', tokenData.role);
            localStorage.setItem('user', JSON.stringify(tokenData));
            
            // Redirect based on role
            if (tokenData.role === 'super_admin') {
                console.log('Redirecting to super admin dashboard');
                window.location.href = '/super-admin';
            } else if (tokenData.role === 'company_admin') {
                console.log('Redirecting to company admin dashboard');
                window.location.href = '/company-admin';
            } else {
                console.log('Unknown role:', tokenData.role);
            }
        } catch (err) {
            console.error('Login error:', err.response?.data || err);
            setError(err.response?.data?.error || 'Invalid credentials');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Login</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group controlId="password" className="mt-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                    Login
                </Button>
            </Form>
        </div>
    );
};

export default Login;

// When logging in, use:
// username: superadmin
// password: admin123