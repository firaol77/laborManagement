import { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';
import PaymentMethods from './PaymentMethods';

const SuperAdminDashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newCompany, setNewCompany] = useState({
        name: '',
        adminUsername: '',
        adminPassword: ''
    });
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('home'); // 'home' or 'paymentMethods'

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/companies', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCompanies(response.data);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('Failed to fetch companies');
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/companies', {
                name: newCompany.name,
                adminUsername: newCompany.adminUsername,
                adminPassword: newCompany.adminPassword
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowModal(false);
            fetchCompanies();
            setNewCompany({ name: '', adminUsername: '', adminPassword: '' });
            setError('');
        } catch (err) {
            console.error('Error creating company:', err);
            setError(err.response?.data?.message || 'Failed to create company');
        }
    };

    const handleStatusToggle = async (companyId, currentStatus) => {
        try {
            await axios.patch(`http://localhost:3001/api/companies/${companyId}/status`, {
                status: currentStatus === 'active' ? 'inactive' : 'active'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchCompanies();
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update company status');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await axios.delete(`http://localhost:3001/api/companies/${companyId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                fetchCompanies();
            } catch (err) {
                console.error('Error deleting company:', err);
                setError('Failed to delete company');
            }
        }
    };

    const renderHeader = () => {
        if (currentView === 'home') {
            return (
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Super Admin Dashboard</h2>
                    <div>
                        <Button 
                            variant="info" 
                            className="me-2"
                            onClick={() => setCurrentView('paymentMethods')}
                        >
                            Payment Methods
                        </Button>
                        <Button variant="primary">
                            Create New Company
                        </Button>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{currentView === 'paymentMethods' ? 'Payment Methods' : ''}</h2>
                <Button 
                    variant="secondary"
                    onClick={() => setCurrentView('home')}
                >
                    Back to Dashboard
                </Button>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            {renderHeader()}
            
            {currentView === 'home' ? (
                <>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <Table striped bordered hover>
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
                            {companies.map(company => (
                                <tr key={company.id}>
                                    <td>{company.id}</td>
                                    <td>{company.name}</td>
                                    <td>
                                        <Badge bg={company.status === 'active' ? 'success' : 'danger'}>
                                            {company.status}
                                        </Badge>
                                    </td>
                                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {company.id === 1 ? (
                                            <Button 
                                                variant="warning" 
                                                disabled
                                                title="Super Admin Company cannot be deactivated"
                                            >
                                                Deactivate
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="warning"
                                                onClick={() => handleStatusToggle(company.id, company.status)}
                                            >
                                                {company.status === 'active' ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        )}
                                        {company.id !== 1 && (
                                            <Button
                                                variant="danger"
                                                className="ms-2"
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
                </>
            ) : currentView === 'paymentMethods' ? (
                <PaymentMethods />
            ) : null}

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Company</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateCompany}>
                        <Form.Group className="mb-3">
                            <Form.Label>Company Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCompany.name}
                                onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Admin Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCompany.adminUsername}
                                onChange={(e) => setNewCompany({...newCompany, adminUsername: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Admin Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={newCompany.adminPassword}
                                onChange={(e) => setNewCompany({...newCompany, adminPassword: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">Create Company</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;