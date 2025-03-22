import { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Badge, Alert, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', adminUsername: '', adminPassword: '' });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', company_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('role')); // Check login state
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate('/login');
    if (currentView === 'home') fetchCompanies();
    if (currentView === 'admins') fetchAdmins();
  }, [currentView, isLoggedIn, navigate]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/companies', { withCredentials: true });
      setCompanies(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch companies');
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin/company-admins', { withCredentials: true });
      setAdmins(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch company admins');
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/companies', newCompany, { withCredentials: true });
      setShowCompanyModal(false);
      setNewCompany({ name: '', adminUsername: '', adminPassword: '' });
      fetchCompanies();
      setSuccess('Company and admin created successfully');
    } catch (err) {
      console.error('Create company error:', err.response?.data || err);
      setError(err.response?.data?.message || err.message || 'Failed to create company');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/admin/company-admins', newAdmin, { withCredentials: true });
      setShowAdminModal(false);
      setNewAdmin({ username: '', password: '', company_id: '' });
      fetchAdmins();
      setSuccess('Company Admin created successfully');
    } catch (err) {
      console.error('Create admin error:', err.response?.data || err);
      setError(err.response?.data?.message || err.message || 'Failed to create admin');
    }
  };

  const handleStatusToggle = async (companyId, currentStatus) => {
    try {
      await axios.patch(
        `http://localhost:3001/api/companies/${companyId}/status`,
        { status: currentStatus === 'active' ? 'inactive' : 'active' },
        { withCredentials: true }
      );
      fetchCompanies();
      setSuccess(`Company ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company status');
    }
  };

  const handleAdminStatusToggle = async (adminId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(
        `http://localhost:3001/api/admin/company-admins/${adminId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchAdmins();
      setSuccess(`Admin ${newStatus} successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update admin status');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await axios.delete(`http://localhost:3001/api/companies/${companyId}`, { withCredentials: true });
        fetchCompanies();
        setSuccess('Company deleted successfully');
      } catch (err) {
        console.error('Error deleting company:', err.message || err);
        setError(err.response?.data?.message || 'Failed to delete company');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/api/auth/logout', {}, { withCredentials: true });
      localStorage.clear();
      setIsLoggedIn(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.clear();
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  const renderHeader = () => {
    return (
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {currentView === 'home' ? 'Super Admin Dashboard' : 'Manage Company Admins'}
        </h2>
        <div className="d-flex flex-md-row flex-column">
          {currentView !== 'home' && (
            <Button variant="secondary" className="me-md-2 mb-2 mb-md-0" onClick={() => setCurrentView('home')}>
              Back to Dashboard
            </Button>
          )}
          {currentView === 'home' && (
            <>
              <Button variant="primary" onClick={() => setShowCompanyModal(true)} className="me-md-2 mb-2 mb-md-0">
                Create New Company
              </Button>
              {isLoggedIn && (
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </>
          )}
          {currentView === 'admins' && (
            <Button variant="primary" onClick={() => setShowAdminModal(true)}>
              Add Company Admin
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!isLoggedIn) return null; // Prevent rendering if not logged in

  return (
    <div className="container mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {renderHeader()}

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="home" active={currentView === 'home'} onClick={() => setCurrentView('home')}>
            Companies
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="admins" active={currentView === 'admins'} onClick={() => setCurrentView('admins')}>
            Company Admins
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {currentView === 'home' && (
        <div className="table-responsive">
          <Table striped bordered hover className="company-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.id}</td>
                  <td>{company.name}</td>
                  <td>
                    <Badge className={company.status === 'active' ? 'status-active' : 'status-inactive'}>
                      {company.status}
                    </Badge>
                  </td>
                  <td>{new Date(company.created_at).toLocaleDateString()}</td>
                  <td>
                    {company.id === 1 ? (
                      <Button variant="warning" disabled title="Super Admin Company cannot be deactivated">
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant={company.status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleStatusToggle(company.id, company.status)}
                        className="btn-action"
                      >
                        {company.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                    {company.id !== 1 && (
                      <Button
                        variant="danger"
                        className="btn-action ms-md-2"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {currentView === 'admins' && (
        <div className="table-responsive">
          <Table striped bordered hover className="company-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Company ID</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.username}</td>
                  <td>{admin.company_id}</td>
                  <td>
                    <Badge className={admin.status === 'active' ? 'status-active' : 'status-inactive'}>
                      {admin.status}
                    </Badge>
                  </td>
                  <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant={admin.status === 'active' ? 'warning' : 'success'}
                      onClick={() => handleAdminStatusToggle(admin.id, admin.status)}
                      className="btn-action"
                    >
                      {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Create New Company</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateCompany}>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Company Name</Form.Label>
              <Form.Control
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Admin Username</Form.Label>
              <Form.Control
                type="text"
                value={newCompany.adminUsername}
                onChange={(e) => setNewCompany({ ...newCompany, adminUsername: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Admin Password</Form.Label>
              <Form.Control
                type="password"
                value={newCompany.adminPassword}
                onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="btn-create">Create Company</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Add Company Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateAdmin}>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Username</Form.Label>
              <Form.Control
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Company</Form.Label>
              <Form.Select
                value={newAdmin.company_id}
                onChange={(e) => setNewAdmin({ ...newAdmin, company_id: e.target.value })}
                required
                className="form-control"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" className="btn-create">Create Admin</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;