import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login with:', credentials);
      const response = await axios.post(
        'http://localhost:3001/api/auth/login',
        credentials,
        { withCredentials: true }
      );
      console.log('Login response:', response.data);

      const { user } = response.data;
      const role = user.role;

      localStorage.setItem('role', role);

      if (role === 'super_admin') {
        console.log('Redirecting to super admin dashboard');
        navigate('/super-admin');
      } else if (role === 'company_admin') {
        console.log('Redirecting to company admin dashboard');
        navigate('/company-admin');
      } else if (role === 'worker_manager') {
        console.log('Redirecting to worker manager dashboard');
        navigate('/worker-manager');
      } else {
        console.log('Unknown role:', role);
        setError('Unknown role. Please contact the administrator.');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="container mt-4">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Login</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin} className="worker-creation-form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            placeholder="Enter username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            placeholder="Enter password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-create">Login</button>
      </form>
    </div>
  );
};

export default Login;