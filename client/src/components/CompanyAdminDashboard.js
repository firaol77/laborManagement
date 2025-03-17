import { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Nav, Tab, Image, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

const CompanyAdminDashboard = () => {
    const [workers, setWorkers] = useState([]);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [newWorker, setNewWorker] = useState({
        name: '',
        daily_rate: '',
        overtime_rate: ''
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [payrollRules, setPayrollRules] = useState({
        standard_working_hours: 8,
        daily_rate: 0,
        overtime_rate: 0
    });
    const [showPayrollRulesModal, setShowPayrollRulesModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [overtimeType, setOvertimeType] = useState('individual'); // 'individual' or 'group'
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [newManager, setNewManager] = useState({
        username: '',
        password: '',
    });
    const [overtimeRate, setOvertimeRate] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showRequestsModal, setShowRequestsModal] = useState(false);

    useEffect(() => {
        fetchWorkers();
        fetchPayrollRules();
        fetchPendingRequests();
    }, []);

    const fetchWorkers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3001/api/workers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkers(response.data);
        } catch (err) {
            console.error('Error fetching workers:', err);
        }
    };

    const fetchPayrollRules = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/payroll-rules', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data) {
                setPayrollRules(response.data);
            }
        } catch (err) {
            console.error('Error fetching payroll rules:', err);
            setError('Failed to fetch payroll rules');
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/pending-requests', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPendingRequests(response.data);
        } catch (err) {
            setError('Failed to fetch pending requests');
        }
    };

    const handleUpdatePayrollRules = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/payroll-rules', payrollRules, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowPayrollRulesModal(false);
            setSuccess('Payroll rules updated successfully');
            fetchPayrollRules();
        } catch (err) {
            console.error('Error updating payroll rules:', err);
            setError('Failed to update payroll rules');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewWorker({ ...newWorker, photo: file });
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    const handleCreateWorker = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3001/api/workers', newWorker, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowWorkerModal(false);
            setNewWorker({ name: '', daily_rate: '', overtime_rate: '' });
            fetchWorkers();
        } catch (err) {
            console.error('Error creating worker:', err);
        }
    };

    const handleOvertimeRequest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3001/api/overtime-requests`, {
                worker_id: selectedWorker.id,
                overtime_hours: selectedWorker.overtime_hours
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowOvertimeModal(false);
            setSelectedWorker(null);
            fetchWorkers();
        } catch (err) {
            console.error('Error submitting overtime request:', err);
        }
    };

    // Create Worker Manager
    const handleCreateManager = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/worker-managers', {
                ...newManager,
                role: 'worker_manager'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowManagerModal(false);
            setNewManager({ username: '', password: '' });
            setSuccess('Worker manager created successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create manager');
        }
    };

    // Apply Overtime
    const handleApplyOvertime = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/overtime', {
                worker_ids: overtimeType === 'group' ? workers.map(w => w.id) : selectedWorkers,
                overtime_rate: overtimeRate
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowOvertimeModal(false);
            setOvertimeRate('');
            setSelectedWorkers([]);
            fetchWorkers();
            setSuccess('Overtime rate applied successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply overtime');
        }
    };

    const handleApproveRequest = async (requestId, approve = true) => {
        try {
            await axios.post(`http://localhost:3001/api/pending-requests/${requestId}`, {
                status: approve ? 'approved' : 'rejected'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchPendingRequests();
            setSuccess(`Request ${approve ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            setError('Failed to process request');
        }
    };

    const handleApproveAll = async () => {
        try {
            await axios.post('http://localhost:3001/api/pending-requests/approve-all', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchPendingRequests();
            setSuccess('All requests approved successfully');
        } catch (err) {
            setError('Failed to approve all requests');
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Company Admin Dashboard</h2>
                <Button variant="primary" onClick={() => setShowWorkerModal(true)}>
                    Add New Worker
                </Button>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Daily Rate</th>
                        <th>Overtime Rate</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {workers.map(worker => (
                        <tr key={worker.id}>
                            <td>{worker.id}</td>
                            <td>{worker.name}</td>
                            <td>${worker.daily_rate}</td>
                            <td>${worker.overtime_rate}</td>
                            <td>
                                <Badge bg={worker.status === 'active' ? 'success' : 'danger'}>
                                    {worker.status}
                                </Badge>
                            </td>
                            <td>
                                <Button
                                    variant="warning"
                                    className="me-2"
                                    onClick={() => {
                                        setSelectedWorker(worker);
                                        setShowOvertimeModal(true);
                                    }}
                                >
                                    Overtime
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Tab.Pane eventKey="payroll">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>Payroll Management</h3>
                    <Button 
                        variant="primary"
                        onClick={() => setShowPayrollRulesModal(true)}
                    >
                        Set Payroll Rules
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <div className="card mb-4">
                    <div className="card-header">
                        <h5>Current Payroll Rules</h5>
                    </div>
                    <div className="card-body">
                        <Table bordered>
                            <tbody>
                                <tr>
                                    <th>Standard Working Hours/Day</th>
                                    <td>{payrollRules.standard_working_hours} hours</td>
                                </tr>
                                <tr>
                                    <th>Daily Rate</th>
                                    <td>${payrollRules.daily_rate}</td>
                                </tr>
                                <tr>
                                    <th>Overtime Rate (per hour)</th>
                                    <td>${payrollRules.overtime_rate}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Tab.Pane>

            {/* Payroll Rules Modal */}
            <Modal show={showPayrollRulesModal} onHide={() => setShowPayrollRulesModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Set Payroll Rules</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdatePayrollRules}>
                        <Form.Group className="mb-3">
                            <Form.Label>Standard Working Hours per Day</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                max="24"
                                value={payrollRules.standard_working_hours}
                                onChange={(e) => setPayrollRules({
                                    ...payrollRules,
                                    standard_working_hours: Number(e.target.value)
                                })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Daily Rate ($)</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={payrollRules.daily_rate}
                                onChange={(e) => setPayrollRules({
                                    ...payrollRules,
                                    daily_rate: Number(e.target.value)
                                })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Overtime Rate per Hour ($)</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={payrollRules.overtime_rate}
                                onChange={(e) => setPayrollRules({
                                    ...payrollRules,
                                    overtime_rate: Number(e.target.value)
                                })}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">
                            Save Payroll Rules
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Add Worker Modal */}
            <Modal show={showWorkerModal} onHide={() => setShowWorkerModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Worker</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateWorker}>
                        <Form.Group className="mb-3">
                            <Form.Label>Worker Photo</Form.Label>
                            <div className="mb-2">
                                {photoPreview && (
                                    <Image 
                                        src={photoPreview} 
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                                        roundedCircle 
                                    />
                                )}
                            </div>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newWorker.name}
                                onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Daily Rate</Form.Label>
                            <Form.Control
                                type="number"
                                value={newWorker.daily_rate}
                                onChange={(e) => setNewWorker({...newWorker, daily_rate: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Overtime Rate</Form.Label>
                            <Form.Control
                                type="number"
                                value={newWorker.overtime_rate}
                                onChange={(e) => setNewWorker({...newWorker, overtime_rate: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Create Worker
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Worker Manager Modal */}
            <Modal show={showManagerModal} onHide={() => setShowManagerModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Worker Manager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateManager}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={newManager.username}
                                onChange={(e) => setNewManager({
                                    ...newManager,
                                    username: e.target.value
                                })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={newManager.password}
                                onChange={(e) => setNewManager({
                                    ...newManager,
                                    password: e.target.value
                                })}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">
                            Create Manager
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Overtime Modal */}
            <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Request Overtime</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleOvertimeRequest}>
                        <Form.Group className="mb-3">
                            <Form.Label>Overtime Hours</Form.Label>
                            <Form.Control
                                type="number"
                                value={selectedWorker?.overtime_hours || ''}
                                onChange={(e) => setSelectedWorker({
                                    ...selectedWorker,
                                    overtime_hours: e.target.value
                                })}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit Request
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Tab.Pane eventKey="pending-requests">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>Pending Requests</h3>
                    {pendingRequests.length > 0 && (
                        <Button 
                            variant="success"
                            onClick={handleApproveAll}
                        >
                            Approve All Requests
                        </Button>
                    )}
                </div>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Requested By</th>
                            <th>Details</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map(request => (
                            <tr key={request.id}>
                                <td>{request.request_type}</td>
                                <td>{request.requested_by_name}</td>
                                <td>
                                    {request.request_type === 'new_worker' && (
                                        <>Worker: {request.request_data.name}</>
                                    )}
                                    {request.request_type.includes('overtime') && (
                                        <>Rate: ${request.request_data.overtime_rate}/hr</>
                                    )}
                                </td>
                                <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleApproveRequest(request.id, true)}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleApproveRequest(request.id, false)}
                                    >
                                        Reject
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Tab.Pane>

            {/* Excel Export Button (available in all tabs) */}
            <div className="position-fixed bottom-0 end-0 m-4">
                <Button 
                    variant="success" 
                    onClick={() => {
                        window.location.href = 'http://localhost:3001/api/payroll/export-excel';
                    }}
                >
                    Export Payroll to Excel
                </Button>
            </div>
        </div>
    );
};

export default CompanyAdminDashboard;