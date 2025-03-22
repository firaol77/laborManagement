import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Modal, Nav, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const CompanyAdminDashboard = () => {
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
  const [showPayrollRulesModal, setShowPayrollRulesModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [newManager, setNewManager] = useState({ username: '', password: '' });
  const [workerManagers, setWorkerManagers] = useState([]);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeData, setOvertimeData] = useState({ workerId: '', hours: '', allWorkers: false, deduct: false });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [payrollPeriod, setPayrollPeriod] = useState({ startDate: '', endDate: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('role')); // Check login state
  const navigate = useNavigate();
  const dailyRate = payrollRules?.daily_rate ?? 0;
  const formattedDailyRate = dailyRate.toFixed(2);

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
      fetchWorkerManagers();
      if (payrollPeriod.startDate && payrollPeriod.endDate) fetchPayroll();
    }
  }, [payrollPeriod, isLoggedIn, fetchPayroll]); // Include fetchPayroll in the dependency array

  const fetchWorkers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/workers', { withCredentials: true });
      setWorkers(response.data);
      setFilteredWorkers(response.data);
    } catch (err) {
      setError('Failed to fetch workers');
    }
  };

  const fetchPayrollRules = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/payroll-rules', { withCredentials: true });
      setPayrollRules({
        standard_working_hours: response.data.standard_working_hours || 8,
        daily_rate: Number(response.data.daily_rate) || 0,
        overtime_rate: Number(response.data.overtime_rate) || 0,
      });
    } catch (err) {
      setError('Failed to fetch payroll rules');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pending-requests', { withCredentials: true });
      setPendingRequests(response.data);
    } catch (err) {
      setError('Failed to fetch pending requests');
    }
  };

  const fetchWorkerManagers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/worker-managers', { withCredentials: true });
      setWorkerManagers(response.data);
    } catch (err) {
      setError('Failed to fetch worker managers');
    }
  };
  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        formData.append('name', newWorker.name);
        formData.append('photo', newWorker.photo);
        formData.append('bankName', newWorker.bankName);
        formData.append('accountNumber', newWorker.accountNumber);

        await axios.post('http://localhost:3001/api/workers', formData, { withCredentials: true });
        setShowWorkerModal(false);
        setNewWorker({ name: '', photo: null, bankName: '', accountNumber: '' });
        setPhotoPreview(null);
        fetchWorkers();
        setSuccess('Worker created successfully');
    } catch (err) {
        setError(err.response?.data?.error || 'Failed to create worker');
        console.error('Worker creation error:', err.response?.data || err);
    }
  };

  const handleUpdatePayrollRules = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        standard_working_hours: Number(payrollRules.standard_working_hours),
        daily_rate: Number(payrollRules.daily_rate),
        overtime_rate: Number(payrollRules.overtime_rate),
      };
      await axios.post('http://localhost:3001/api/payroll-rules', payload, { withCredentials: true });
      setShowPayrollRulesModal(false);
      setSuccess('Payroll rules updated successfully');
      fetchPayrollRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payroll rules');
      console.error('Payroll rules update error:', err.response?.data || err);
    }
  };

  const handleApproveRequest = async (requestId, approve) => {
    try {
      await axios.post(
        `http://localhost:3001/api/pending-requests/${requestId}`,
        { action: approve ? 'approve' : 'reject' },
        { withCredentials: true }
      );
      fetchPendingRequests();
      fetchWorkers();
      setSuccess(`Request ${approve ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      setError('Failed to process request');
    }
  };

  const handleApproveAll = async () => {
    try {
        await axios.post('http://localhost:3001/api/pending-requests/approve-all', {}, { withCredentials: true });
        setSuccess('All requests approved successfully');
        fetchPendingRequests();
        fetchWorkers();
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to approve all requests');
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/worker-managers', { ...newManager, role: 'worker_manager' }, { withCredentials: true });
      setShowManagerModal(false);
      setNewManager({ username: '', password: '' });
      setSuccess('Worker manager created successfully');
      fetchWorkerManagers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create manager');
    }
  };

  const handleUpdateManagerStatus = async (managerId, status) => {
    try {
      await axios.patch(`http://localhost:3001/api/worker-managers/${managerId}/status`, { status }, { withCredentials: true });
      setSuccess(`Worker Manager ${status} successfully`);
      fetchWorkerManagers();
    } catch (err) {
      setError('Failed to update Worker Manager status');
    }
  };

  const handleApplyOvertime = async (e, deduct = false) => {
    e.preventDefault();
    try {
      const payload = overtimeData.allWorkers
        ? { hours: parseFloat(overtimeData.hours), allWorkers: true, deduct }
        : { workerId: overtimeData.workerId, hours: parseFloat(overtimeData.hours), deduct };

      await axios.post('http://localhost:3001/api/workers/overtime', payload, { withCredentials: true });
      setShowOvertimeModal(false);
      setOvertimeData({ workerId: '', hours: '', allWorkers: false, deduct: false });
      fetchWorkers();
      setSuccess(`${deduct ? 'Overtime deducted' : 'Overtime applied'} successfully`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${deduct ? 'deduct' : 'apply'} overtime`);
    }
  };

  const handleToggleWorkerStatus = async (workerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(`http://localhost:3001/api/workers/${workerId}/status`, { status: newStatus }, { withCredentials: true });
      setSuccess(`Worker ${newStatus} successfully`);
      fetchWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update worker status');
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await axios.delete(`http://localhost:3001/api/workers/${workerId}`, { withCredentials: true });
        setSuccess('Worker deleted successfully');
        fetchWorkers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete worker');
      }
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
      <div className="dashboard-header d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
        <h2 className="dashboard-title">Company Admin Dashboard</h2>
        {isLoggedIn && (
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
        <Nav variant="tabs" className="flex-md-row flex-column">
          <Nav.Item><Nav.Link eventKey="workers" active={activeTab === 'workers'} onClick={() => setActiveTab('workers')}>Workers</Nav.Link></Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pending-requests" active={activeTab === 'pending-requests'} onClick={() => setActiveTab('pending-requests')}>
              Pending Requests
              {pendingRequests.filter((r) => r.status === 'pending').length > 0 && (
                <Badge bg="warning" className="ms-2">{pendingRequests.filter((r) => r.status === 'pending').length}</Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item><Nav.Link eventKey="payroll" active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')}>Payroll Management</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="worker-managers" active={activeTab === 'worker-managers'} onClick={() => setActiveTab('worker-managers')}>Worker Managers</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="payroll-calc" active={activeTab === 'payroll-calc'} onClick={() => setActiveTab('payroll-calc')}>Payroll Calculation</Nav.Link></Nav.Item>
        </Nav>
        <Button variant="primary" onClick={() => setShowManagerModal(true)} className="mt-2 mt-md-0">Add Worker Manager</Button>
      </div>

      {activeTab === 'workers' && (
        <>
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
              <Button variant="info" onClick={() => setShowOvertimeModal(true)} className="me-md-2 mb-2 mb-md-0">Apply Overtime</Button>
              <Button variant="success" onClick={exportWorkersToExcel}>Export to Excel</Button>
            </div>
          </div>
          <div className="table-responsive">
          <Table striped bordered hover className="company-table">
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
                  <td>{worker.regDate ? new Date(worker.regDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{(payrollRules?.daily_rate ?? 0).toFixed(2)} Br</td>
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
        </>
      )}

      {activeTab === 'pending-requests' && (
        <>
          <h3>Pending Requests</h3>
          <Button variant="success" onClick={handleApproveAll} className="mb-3">Approve All</Button>
          <div className="table-responsive">
            <Table striped bordered hover className="pending-requests-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
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
                    <td>
                      <Badge className={`status-${request.status}`}>{request.status}</Badge>
                    </td>
                    <td>{request.created_by_username || 'Unknown'}</td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            onClick={() => handleApproveRequest(request.id, true)}
                            className="btn-action"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleApproveRequest(request.id, false)}
                            className="btn-action ms-md-2"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {activeTab === 'payroll' && (
        <>
          <h3>Payroll Management</h3>
          <Button variant="primary" onClick={() => setShowPayrollRulesModal(true)} className="mb-3">Update Payroll Rules</Button>
          <div className="payroll-rules-card">
            <h5>Current Payroll Rules</h5>
            <Table bordered>
              <tbody>
                <tr><th>Standard Working Hours/Day</th><td>{payrollRules.standard_working_hours} hours</td></tr>
                <tr><th>Daily Rate</th><td>{(payrollRules?.daily_rate ?? 0).toFixed(2)} Br</td></tr>
                <tr><th>Overtime Rate (per hour)</th><td>{payrollRules.overtime_rate.toFixed(2)} Br</td></tr>
              </tbody>
            </Table>
          </div>
        </>
      )}

      {activeTab === 'worker-managers' && (
        <>
          <h3>Worker Managers</h3>
          <div className="table-responsive">
            <Table striped bordered hover className="company-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workerManagers.map((manager) => (
                  <tr key={manager.id}>
                    <td>{manager.id}</td>
                    <td>{manager.username}</td>
                    <td>
                      <Badge className={manager.status === 'active' ? 'status-active' : 'status-inactive'}>
                        {manager.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant={manager.status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleUpdateManagerStatus(manager.id, manager.status === 'active' ? 'inactive' : 'active')}
                        className="btn-action"
                      >
                        {manager.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {activeTab === 'payroll-calc' && (
        <>
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
              <Table striped bordered hover className="company-table">
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
                      <td>{(payrollRules?.daily_rate ?? 0).toFixed(2)} Br</td>
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
        </>
      )}

      <Modal show={showWorkerModal} onHide={() => setShowWorkerModal(false)} dialogClassName="modal-form">
          <Modal.Header closeButton>
              <Modal.Title>Add New Worker</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Form onSubmit={handleCreateWorker}>
                  <Form.Group className="form-group">
                      <Form.Label className="form-label">Photo</Form.Label>
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
                          className="form-control"
                      />
                  </Form.Group>
                  <Form.Group className="form-group">
                      <Form.Label className="form-label">Name</Form.Label>
                      <Form.Control
                          type="text"
                          value={newWorker.name}
                          onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                          required
                          className="form-control"
                      />
                  </Form.Group>
                  <Form.Group className="form-group">
                      <Form.Label className="form-label">Bank Name</Form.Label>
                      <Form.Control
                          type="text"
                          value={newWorker.bankName}
                          onChange={(e) => setNewWorker({ ...newWorker, bankName: e.target.value })}
                          required
                          className="form-control"
                      />
                  </Form.Group>
                  <Form.Group className="form-group">
                      <Form.Label className="form-label">Account Number</Form.Label>
                      <Form.Control
                          type="text"
                          value={newWorker.accountNumber}
                          onChange={(e) => setNewWorker({ ...newWorker, accountNumber: e.target.value })}
                          required
                          className="form-control"
                      />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="btn-create">Create Worker</Button>
              </Form>
          </Modal.Body>
      </Modal>

      <Modal show={showPayrollRulesModal} onHide={() => setShowPayrollRulesModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Update Payroll Rules</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdatePayrollRules}>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Standard Working Hours/Day</Form.Label>
              <Form.Control
                type="number"
                value={payrollRules.standard_working_hours}
                onChange={(e) => setPayrollRules({ ...payrollRules, standard_working_hours: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Daily Rate (Br)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={payrollRules.daily_rate}
                onChange={(e) => setPayrollRules({ ...payrollRules, daily_rate: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Overtime Rate (Br/hour)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={payrollRules.overtime_rate}
                onChange={(e) => setPayrollRules({ ...payrollRules, overtime_rate: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="btn-create">Update Rules</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showManagerModal} onHide={() => setShowManagerModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Add Worker Manager</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateManager}>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Username</Form.Label>
              <Form.Control
                type="text"
                value={newManager.username}
                onChange={(e) => setNewManager({ ...newManager, username: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control
                type="password"
                value={newManager.password}
                onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="btn-create">Create Manager</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Apply Overtime</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => handleApplyOvertime(e, overtimeData.deduct)}>
            <Form.Group className="form-group">
              <Form.Check
                type="checkbox"
                label="Apply to all workers"
                checked={overtimeData.allWorkers}
                onChange={(e) => setOvertimeData({ ...overtimeData, allWorkers: e.target.checked })}
              />
            </Form.Group>
            {!overtimeData.allWorkers && (
              <Form.Group className="form-group">
                <Form.Label className="form-label">Worker</Form.Label>
                <Form.Select
                  value={overtimeData.workerId}
                  onChange={(e) => setOvertimeData({ ...overtimeData, workerId: e.target.value })}
                  required
                  className="form-control"
                >
                  <option value="">Select worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="form-group">
              <Form.Label className="form-label">Hours</Form.Label>
              <Form.Control
                type="number"
                step="0.5"
                value={overtimeData.hours}
                onChange={(e) => setOvertimeData({ ...overtimeData, hours: e.target.value })}
                required
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Check
                type="checkbox"
                label="Deduct Overtime"
                checked={overtimeData.deduct}
                onChange={(e) => setOvertimeData({ ...overtimeData, deduct: e.target.checked })}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="btn-create">
              {overtimeData.deduct ? 'Deduct Overtime' : 'Apply Overtime'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} dialogClassName="modal-form">
        <Modal.Header closeButton>
          <Modal.Title>Worker Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPhoto ? (
            <img
              src={selectedPhoto}
              alt="Worker"
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
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

export default CompanyAdminDashboard;