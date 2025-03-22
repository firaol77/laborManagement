import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Nav, Tab, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';

const WorkerManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('workers');
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [filteredPayrollData, setFilteredPayrollData] = useState([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', photo: null, bankName: '', accountNumber: '', regdate: '' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [payrollRules, setPayrollRules] = useState({ standard_working_hours: 8, daily_rate: 0, overtime_rate: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeData, setOvertimeData] = useState({ workerId: '', hours: '', allWorkers: false, deduct: false });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [payrollPeriod, setPayrollPeriod] = useState({ startDate: '', endDate: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('role')); // Check login state
  const navigate = useNavigate();

  // Use useCallback to memoize fetchPayroll
  const fetchPayroll = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/workers/payroll', {
        withCredentials: true,
        params: { startDate: payrollPeriod.startDate, endDate: payrollPeriod.endDate },
      });
      setPayrollData(response.data);
      setFilteredPayrollData(response.data);
    } catch (err) {
      setError('Failed to fetch payroll data');
    }
  }, [payrollPeriod.startDate, payrollPeriod.endDate]);

  useEffect(() => {
    if (!isLoggedIn) navigate('/login');
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, isLoggedIn, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter((worker) =>
        worker.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkers(filtered);
    }
  }, [searchQuery, workers]);

  useEffect(() => {
    if (payrollSearchQuery.trim() === '') {
      setFilteredPayrollData(payrollData);
    } else {
      const filtered = payrollData.filter((entry) =>
        entry.name.toLowerCase().includes(payrollSearchQuery.toLowerCase())
      );
      setFilteredPayrollData(filtered);
    }
  }, [payrollSearchQuery, payrollData]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWorkers();
      fetchPayrollRules();
      fetchPendingRequests();
      if (payrollPeriod.startDate && payrollPeriod.endDate) fetchPayroll();
    }
  }, [payrollPeriod, isLoggedIn, fetchPayroll]); // Include fetchPayroll in the dependency array

  const fetchWorkers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/workers', { withCredentials: true });
      setWorkers(response.data);
      setFilteredWorkers(response.data);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError('Failed to fetch workers');
    }
  };

  const fetchPayrollRules = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/payroll-rules', { withCredentials: true });
      setPayrollRules({
        standard_working_hours: 8,
        daily_rate: parseFloat(response.data.daily_rate) || 0,
        overtime_rate: parseFloat(response.data.overtime_rate) || 0,
      });
    } catch (err) {
      console.error('Error fetching payroll rules:', err);
      setError('Failed to fetch payroll rules');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pending-requests/my', { withCredentials: true });
      setMyRequests(response.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError('Failed to fetch pending requests');
    }
  };

  const handleToggleWorkerStatus = async (workerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.put(`http://localhost:3001/api/workers/${workerId}/status`, { status: newStatus }, { withCredentials: true });
      fetchWorkers(); // Refresh the worker list
      setSuccess(`Worker status updated to ${newStatus}`);
    } catch (err) {
      setError('Failed to update worker status');
    }
  };

  const handleDeleteWorker = async (workerId) => {
    try {
      await axios.delete(`http://localhost:3001/api/workers/${workerId}`, { withCredentials: true });
      fetchWorkers(); // Refresh the worker list
      setSuccess('Worker deleted successfully');
    } catch (err) {
      setError('Failed to delete worker');
    }
  };

  const exportWorkersToExcel = () => {
    if (!payrollRules) {
      alert('Payroll rules not loaded yet.');
      return;
    }
    const data = filteredWorkers.map((worker) => ({
      ID: worker.id,
      Name: worker.name,
      'Daily Rate': payrollRules.daily_rate.toFixed(2),
      'Overtime Rate': payrollRules.overtime_rate.toFixed(2),
      'Overtime Hours': worker.overtime_hours || 0,
      Status: worker.status,
      'Bank Name': worker.bankName || 'N/A',
      'Account Number': worker.accountNumber || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workers');
    XLSX.writeFile(wb, 'Worker_Payroll_Data.xlsx');
  };

  const exportPayrollToExcel = () => {
    const data = filteredPayrollData.map((entry) => ({
      ID: entry.workerId,
      Name: entry.name,
      'Days Worked': entry.daysWorked,
      'Regular Hours': entry.regularHours,
      'Overtime Hours': entry.overtimeHours,
      'Daily Pay (Br)': entry.dailyPay.toFixed(2),
      'Overtime Pay (Br)': entry.overtimePay.toFixed(2),
      'Total Salary (Br)': entry.totalSalary.toFixed(2),
      'Bank Name': entry.bankName || 'N/A',
      'Account Number': entry.accountNumber || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${payrollPeriod.startDate}_to_${payrollPeriod.endDate}.xlsx`);
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

  const handleCreateWorkerRequest = async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        formData.append('type', 'new_worker');
        formData.append('details', JSON.stringify({
            name: newWorker.name,
            bankName: newWorker.bankName,
            accountNumber: newWorker.accountNumber,
        }));
        if (newWorker.photo) {
            formData.append('photo', newWorker.photo);
        }

        await axios.post('http://localhost:3001/api/pending-requests', formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        setShowWorkerModal(false);
        setNewWorker({ name: '', photo: null, bankName: '', accountNumber: '' });
        setPhotoPreview(null);
        fetchPendingRequests();
        setSuccess('Worker registration request submitted');
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit worker request');
    }
};

  const handleOvertimeRequest = async (e) => {
    e.preventDefault();
    try {
      const details = overtimeData.allWorkers
        ? { hours: parseFloat(overtimeData.hours), deduct: overtimeData.deduct }
        : { workerId: overtimeData.workerId, hours: parseFloat(overtimeData.hours), deduct: overtimeData.deduct };
      await axios.post('http://localhost:3001/api/pending-requests', {
        type: overtimeData.allWorkers ? 'overtime_group' : 'overtime_individual',
        details: JSON.stringify(details),
      }, { withCredentials: true });

      setShowOvertimeModal(false);
      setOvertimeData({ workerId: '', hours: '', allWorkers: false, deduct: false });
      fetchPendingRequests();
      setSuccess('Overtime request submitted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit overtime request');
    }
  };

  const handleViewPhoto = (photoUrl) => {
    if (!photoUrl) {
      setError('No photo available for this worker');
      return;
    }
    const fullUrl = photoUrl.startsWith('http') ? photoUrl : `http://localhost:3001${photoUrl}`;
    setSelectedPhoto(fullUrl);
    setShowPhotoModal(true);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
        <h2>Worker Manager Dashboard</h2>
        {isLoggedIn && (
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
        <Nav variant="tabs" defaultActiveKey="workers" className="mb-3">
          <Nav.Item><Nav.Link eventKey="workers">Workers</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="pending-requests">Pending Requests</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="payroll">Payroll Rules</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="payroll-calc">Payroll Calculation</Nav.Link></Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="workers">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
              <h3>Manage Workers</h3>
              <div className="d-flex flex-md-row flex-column align-items-md-center">
                <Form.Control
                  type="text"
                  placeholder="Search workers by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="me-md-2 mb-2 mb-md-0"
                  style={{ width: '200px' }}
                />
                <Button variant="primary" onClick={() => setShowWorkerModal(true)} className="me-md-2 mb-2 mb-md-0">Add New Worker</Button>
                <Button variant="info" onClick={() => setShowOvertimeModal(true)} className="me-md-2 mb-2 mb-md-0">Request Overtime</Button>
                <Button variant="success" onClick={exportWorkersToExcel}>Export to Excel</Button>
              </div>
            </div>
            {filteredWorkers.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                      <th>Registration Date</th>
                      <th>Daily Rate</th>
                      <th>Overtime Rate</th>
                      <th>Overtime Hours</th>
                      <th>Status</th>
                      <th>Photo</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => (
                      <tr key={worker.id}>
                        <td>{worker.id}</td>
                        <td>{worker.name}</td>
                        <td>{worker.bankName || 'N/A'}</td>
                        <td>{worker.accountNumber || 'N/A'}</td>
                        <td>{new Date(worker.regDate).toLocaleDateString()}</td>
                        <td>{payrollRules.daily_rate.toFixed(2)} Br</td>
                        <td>{payrollRules.overtime_rate.toFixed(2)} Br</td>
                        <td>{worker.overtime_hours || 0}</td>
                        <td><Badge bg={worker.status === 'active' ? 'success' : 'danger'}>{worker.status}</Badge></td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewPhoto(worker.photo_url)}
                            disabled={!worker.photo_url || worker.photo_url === ''}
                          >
                            View Picture
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant={worker.status === 'active' ? 'warning' : 'success'}
                            onClick={() => handleToggleWorkerStatus(worker.id, worker.status)}
                            className="btn-action"
                          >
                            {worker.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteWorker(worker.id)}
                            className="btn-action ms-md-2"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p>No workers found.</p>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="pending-requests">
            <h3>My Pending Requests</h3>
            {myRequests.length > 0 ? (
              <div className="table-responsive">
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
                    {myRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.request_type}</td>
                        <td>
                          {request.request_type === 'new_worker' && <>Worker: {request.request_data.name}</>}
                          {request.request_type === 'overtime_individual' && (
                            <>Worker ID: {request.request_data.workerId}, Hours: {request.request_data.hours}{request.request_data.deduct ? ' (Deduct)' : ''}</>
                          )}
                          {request.request_type === 'overtime_group' && (
                            <>Hours: {request.request_data.hours} (All Workers){request.request_data.deduct ? ' (Deduct)' : ''}</>
                          )}
                        </td>
                        <td><Badge bg={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'danger'}>{request.status}</Badge></td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p>No pending requests found.</p>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="payroll">
            <h3>Payroll Rules</h3>
            {payrollRules ? (
              <div className="payroll-rules-card">
                <div className="card-header"><h5>Current Payroll Rules</h5></div>
                <div className="card-body">
                  <Table bordered>
                    <tbody>
                      <tr><th>Standard Working Hours/Day</th><td>{payrollRules.standard_working_hours} hours</td></tr>
                      <tr><th>Daily Rate</th><td>{payrollRules.daily_rate.toFixed(2)} Br</td></tr>
                      <tr><th>Overtime Rate (per hour)</th><td>{payrollRules.overtime_rate.toFixed(2)} Br</td></tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              <p>Loading payroll rules...</p>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="payroll-calc">
            <h3>Payroll Calculation</h3>
            <Form className="mb-3">
              <Form.Group className="d-flex align-items-center flex-md-row flex-column">
                <Form.Label className="me-md-2 mb-2 mb-md-0">Start Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={payrollPeriod.startDate}
                  onChange={(e) => setPayrollPeriod({ ...payrollPeriod, startDate: e.target.value })}
                  className="me-md-3 mb-2 mb-md-0"
                />
                <Form.Label className="me-md-2 mb-2 mb-md-0">End Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={payrollPeriod.endDate}
                  onChange={(e) => setPayrollPeriod({ ...payrollPeriod, endDate: e.target.value })}
                />
              </Form.Group>
            </Form>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
              <Form.Control
                type="text"
                placeholder="Search payroll by name..."
                value={payrollSearchQuery}
                onChange={(e) => setPayrollSearchQuery(e.target.value)}
                style={{ width: '200px' }}
                className="mb-2 mb-md-0"
              />
              <Button
                variant="success"
                onClick={exportPayrollToExcel}
                disabled={filteredPayrollData.length === 0}
              >
                Export to Excel
              </Button>
            </div>
            {payrollData.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>Registration Date</th>
                    <th>Daily Rate</th>
                    <th>Overtime Rate</th>
                    <th>Overtime Hours</th>
                    <th>Status</th>
                    <th>Photo</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id}>
                      <td>{worker.id}</td>
                      <td>{worker.name}</td>
                      <td>{worker.bankname || 'N/A'}</td> {/* Add bankname */}
                      <td>{worker.accountnumber || 'N/A'}</td> {/* Add accountnumber */}
                      <td>{worker.regdate ? new Date(worker.regdate).toLocaleDateString() : 'N/A'}</td> {/* Add regdate */}
                      <td>{payrollRules.daily_rate.toFixed(2)} Br</td>
                      <td>{payrollRules.overtime_rate.toFixed(2)} Br</td>
                      <td>{worker.overtime_hours || 0}</td>
                      <td>
                        <Badge className={worker.status === 'active' ? 'status-active' : 'status-inactive'}>
                          {worker.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewPhoto(worker.photo_url)}
                          disabled={!worker.photo_url}
                        >
                          View Photo
                        </Button>
                      </td>
                      <td>
                        <Button
                          variant={worker.status === 'active' ? 'warning' : 'success'}
                          onClick={() => handleToggleWorkerStatus(worker.id, worker.status)}
                          className="btn-action"
                        >
                          {worker.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="btn-action ms-md-2"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              </div>
            ) : (
              <p>Select a date range to calculate payroll.</p>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <Modal show={showWorkerModal} onHide={() => setShowWorkerModal(false)}>
      <Modal.Header closeButton><Modal.Title>Add New Worker</Modal.Title></Modal.Header>
      <Modal.Body>
          <Form onSubmit={handleCreateWorkerRequest}>
              <Form.Group className="mb-3">
                  <Form.Label>Photo</Form.Label>
                  <div className="mb-2">
                      {photoPreview && <img src={photoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />}
                  </div>
                  <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                          const file = e.target.files[0];
                          setNewWorker({ ...newWorker, photo: file });
                          setPhotoPreview(URL.createObjectURL(file));
                      }}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                      type="text"
                      value={newWorker.name}
                      onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                      required
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                      type="text"
                      value={newWorker.bankName}
                      onChange={(e) => setNewWorker({ ...newWorker, bankName: e.target.value })}
                      required
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Account Number</Form.Label>
                  <Form.Control
                      type="text"
                      value={newWorker.accountNumber}
                      onChange={(e) => setNewWorker({ ...newWorker, accountNumber: e.target.value })}
                      required
                  />
              </Form.Group>
              <Button type="submit" variant="primary">Submit Request</Button>
          </Form>
      </Modal.Body>
  </Modal>

      <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)}>
        <Modal.Header closeButton><Modal.Title>Request Overtime</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleOvertimeRequest}>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Apply to all workers"
                checked={overtimeData.allWorkers}
                onChange={(e) => setOvertimeData({ ...overtimeData, allWorkers: e.target.checked })}
              />
            </Form.Group>
            {!overtimeData.allWorkers && (
              <Form.Group className="mb-3">
                <Form.Label>Worker</Form.Label>
                <Form.Select
                  value={overtimeData.workerId}
                  onChange={(e) => setOvertimeData({ ...overtimeData, workerId: e.target.value })}
                  required
                >
                  <option value="">Select worker</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Hours</Form.Label>
              <Form.Control
                type="number"
                step="0.5"
                value={overtimeData.hours}
                onChange={(e) => setOvertimeData({ ...overtimeData, hours: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Deduct Overtime"
                checked={overtimeData.deduct}
                onChange={(e) => setOvertimeData({ ...overtimeData, deduct: e.target.checked })}
              />
            </Form.Group>
            <Button type="submit" variant="primary">
              {overtimeData.deduct ? 'Request Overtime Deduction' : 'Request Overtime Addition'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)}>
        <Modal.Header closeButton><Modal.Title>Worker Photo</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedPhoto ? (
            <img 
              src={selectedPhoto} 
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} 
              alt="Worker" 
              onError={() => setError('Failed to load photo')}
            />
          ) : (
            <p>No photo available.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default WorkerManagerDashboard;