import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMethodName, setNewMethodName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Using token:', token);

            const response = await axios.get('http://localhost:3001/api/payment-methods', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Payment methods response:', response.data);
            setPaymentMethods(response.data);
        } catch (err) {
            console.error('Full error:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.error || 'Failed to fetch payment methods');
        }
    };

    const handleAddMethod = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3001/api/payment-methods', 
                { name: newMethodName },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setShowAddModal(false);
            setNewMethodName('');
            fetchPaymentMethods();
        } catch (err) {
            console.error('Error adding payment method:', err);
            setError(err.response?.data?.error || 'Failed to add payment method');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:3001/api/payment-methods/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Payment method deleted successfully');
                fetchPaymentMethods();
            } catch (err) {
                setError('Failed to delete payment method');
                console.error('Error:', err);
            }
        }
    };

    return (
        <div>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <div className="mb-3">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    Add New Payment Method
                </Button>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Bank Name</th>
                        <th>Created At</th>
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentMethods.map(method => (
                        <tr key={method.id}>
                            <td>{method.id}</td>
                            <td>{method.name}</td>
                            <td>{new Date(method.created_at).toLocaleDateString()}</td>
                            <td>{method.created_by}</td>
                            <td>
                                <Button 
                                    variant="danger" 
                                    size="sm"
                                    onClick={() => handleDelete(method.id)}
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Payment Method</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Bank Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={newMethodName}
                            onChange={(e) => setNewMethodName(e.target.value)}
                            placeholder="Enter bank name"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddMethod}>
                        Add Method
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PaymentMethods; 