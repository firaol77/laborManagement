import { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';

const WorkerManagerDashboard = () => {
    const [activeTab, setActiveTab] = useState('workers');
    const [workers, setWorkers] = useState([]);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [overtimeType, setOvertimeType] = useState('individual');
    const [myRequests, setMyRequests] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newWorker, setNewWorker] = useState({
        name: '',
        photo: null,
        daily_rate: '',
    });

    const [overtimeRate, setOvertimeRate] = useState('');

    useEffect(() => {
        fetchWorkers();
        fetchMyRequests();
    }, []);

    const fetchWorkers = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/workers', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setWorkers(response.data);
        } catch (err) {
            setError('Failed to fetch workers');
        }
    };

    const fetchMyRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/my-requests', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMyRequests(response.data);
        } catch (err) {
            setError('Failed to fetch requests');
        }
    };

    const handleCreateWorkerRequest = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newWorker.name);
            formData.append('daily_rate', newWorker.daily_rate);
            if (newWorker.photo) {
                formData.append('photo', newWorker.photo);
            }

            await axios.post('http://localhost:3001/api/worker-requests', formData, {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowWorkerModal(false);
            setNewWorker({ name: '', photo: null, daily_rate: '' });
            setSuccess('Worker registration request submitted');
            fetchMyRequests();
        } catch (err) {
            setError('Failed to submit worker request');
        }
    };

    const handleOvertimeRequest = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/overtime-requests', {
                worker_ids: overtimeType === 'group' ? workers.map(w => w.id) : selectedWorkers,
                overtime_rate: overtimeRate,
                type: overtimeType
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setShowOvertimeModal(false);
            setOvertimeRate('');
            setSelectedWorkers([]);
            setSuccess('Overtime request submitted');
            fetchMyRequests();
        } catch (err) {
            setError('Failed to submit overtime request');
        }
    };

    return (
        <div className="container mt-4">
            <h2>Worker Manager Dashboard</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                        <Nav.Link eventKey="workers">Workers</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="my-requests">
                            My Requests
                            {myRequests.filter(r => r.status === 'pending').length > 0 && (
                                <Badge bg="warning" className="ms-2">
                                    {myRequests.filter(r => r.status === 'pending').length}
                                </Badge>
                            )}
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey="workers">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3>Manage Workers</h3>
                            <div>
                                <Button 
                                    variant="warning" 
                                    className="me-2"
                                    onClick={() => {
                                        setOvertimeType('group');
                                        setShowOvertimeModal(true);
                                    }}
                                >
                                    Request Group Overtime
                                </Button>
                                <Button 
                                    variant="primary"
                                    onClick={() => setShowWorkerModal(true)}
                                >
                                    Register New Worker
                                </Button>
                            </div>
                        </div>

                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>
                                        <Form.Check 
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedWorkers(workers.map(w => w.id));
                                                } else {
                                                    setSelectedWorkers([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th>Photo</th>
                                    <th>Worker ID</th>
                                    <th>Name</th>
                                    <th>Daily Rate</th>
                                    <th>Overtime Rate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(worker => (
                                    <tr key={worker.id}>
                                        <td>
                                            <Form.Check 
                                                type="checkbox"
                                                checked={selectedWorkers.includes(worker.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedWorkers([...selectedWorkers, worker.id]);
                                                    } else {
                                                        setSelectedWorkers(
                                                            selectedWorkers.filter(id => id !== worker.id)
                                                        );
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>
                                            {worker.photo_url && (
                                                <img 
                                                    src={`http://localhost:3001/${worker.photo_url}`}
                                                    alt="Worker"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    className="rounded-circle"
                                                />
                                            )}
                                        </td>
                                        <td>{worker.worker_id}</td>
                                        <td>{worker.name}</td>
                                        <td>${worker.daily_rate}</td>
                                        <td>${worker.overtime_rate}</td>
                                        <td>
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedWorkers([worker.id]);
                                                    setOvertimeType('individual');
                                                    setShowOvertimeModal(true);
                                                }}
                                            >
                                                Request Overtime
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab.Pane>

                    <Tab.Pane eventKey="my-requests">
                        <h3>My Requests</h3>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myRequests.map(request => (
                                    <tr key={request.id}>
                                        <td>{request.request_type}</td>
                                        <td>
                                            {request.request_type === 'new_worker' && (
                                                <>Worker: {request.request_data.name}</>
                                            )}
                                            {request.request_type.includes('overtime') && (
                                                <>Rate: ${request.request_data.overtime_rate}/hr</>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg={
                                                request.status === 'approved' ? 'success' :
                                                request.status === 'rejected' ? 'danger' : 'warning'
                                            }>
                                                {request.status}
                                            </Badge>
                                        </td>
                                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            {/* Register Worker Modal */}
            <Modal show={showWorkerModal} onHide={() => setShowWorkerModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Register New Worker</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateWorkerRequest}>
                        <Form.Group className="mb-3">
                            <Form.Label>Worker Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newWorker.name}
                                onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Photo</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewWorker({
                                    ...newWorker,
                                    photo: e.target.files[0]
                                })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Daily Rate</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={newWorker.daily_rate}
                                onChange={(e) => setNewWorker({
                                    ...newWorker,
                                    daily_rate: e.target.value
                                })}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">
                            Submit Request
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Overtime Modal */}
            <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {overtimeType === 'group' ? 'Request Group Overtime' : 'Request Individual Overtime'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleOvertimeRequest}>
                        <Form.Group className="mb-3">
                            <Form.Label>Overtime Rate (per hour)</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={overtimeRate}
                                onChange={(e) => setOvertimeRate(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">
                            Submit Request
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default WorkerManagerDashboard;
