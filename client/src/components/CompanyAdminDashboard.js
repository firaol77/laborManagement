"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import { useNavigate } from "react-router-dom"
import Modal from "./ui/modal"
import Spinner from "./ui/spinner"
import { toast } from "./ui/toaster"
import {
  Users,
  FileSpreadsheet,
  Settings,
  ClipboardList,
  Calculator,
  Plus,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react"

const CompanyAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("workers")
  const [workers, setWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [payrollSearchQuery, setPayrollSearchQuery] = useState("")
  const [filteredPayrollData, setFilteredPayrollData] = useState([])
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [newWorker, setNewWorker] = useState({ name: "", photo: null, bankName: "", accountNumber: "", regdate: "" })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [payrollRules, setPayrollRules] = useState({ standard_working_hours: 8, daily_rate: 0, overtime_rate: 0 })
  const [showPayrollRulesModal, setShowPayrollRulesModal] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [newManager, setNewManager] = useState({ username: "", password: "" })
  const [workerManagers, setWorkerManagers] = useState([])
  const [showOvertimeModal, setShowOvertimeModal] = useState(false)
  const [overtimeData, setOvertimeData] = useState({ workerId: "", hours: "", allWorkers: false, deduct: false })
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [payrollData, setPayrollData] = useState([])
  const [payrollPeriod, setPayrollPeriod] = useState({ startDate: "", endDate: "" })
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("role"))
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Use useCallback to memoize fetchPayroll
  const fetchPayroll = useCallback(async () => {
    if (!payrollPeriod.startDate || !payrollPeriod.endDate) return

    setIsLoading(true)
    try {
      // First, get the workers
      const workersResponse = await axios.get("http://localhost:3001/api/workers", {
        withCredentials: true,
      })

      // Then, get the payroll rules
      const rulesResponse = await axios.get("http://localhost:3001/api/payroll-rules", {
        withCredentials: true,
      })

      const workers = workersResponse.data
      const rules = rulesResponse.data

      // Calculate days between start and end dates (inclusive)
      const startDate = new Date(payrollPeriod.startDate)
      const endDate = new Date(payrollPeriod.endDate)
      const daysDiff = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1

      // Calculate payroll for each worker
      const payrollData = workers.map((worker) => {
        // Only count active workers
        const isActive = worker.status === "active"
        const daysWorked = isActive ? daysDiff : 0
        const regularHours = daysWorked * (rules.standard_working_hours || 8)
        const overtimeHours = Number(worker.overtime_hours || 0)
        const dailyRate = Number(rules.daily_rate || 0)
        const overtimeRate = Number(rules.overtime_rate || 0)

        const dailyPay = daysWorked * dailyRate
        const overtimePay = overtimeHours * overtimeRate
        const totalSalary = dailyPay + overtimePay

        return {
          workerId: worker.id,
          name: worker.name,
          daysWorked,
          regularHours,
          overtimeHours,
          dailyPay,
          overtimePay,
          totalSalary,
          bankName: worker.bankName || worker.bank_name || worker.bankname || "N/A",
          accountNumber: worker.accountNumber || worker.account_number || worker.accountnumber || "N/A",
        }
      })

      setPayrollData(payrollData)
      setFilteredPayrollData(payrollData)
    } catch (err) {
      console.error("Payroll calculation error:", err)
      toast.error("Failed to fetch payroll data")
    } finally {
      setIsLoading(false)
    }
  }, [payrollPeriod.startDate, payrollPeriod.endDate])

  useEffect(() => {
    if (!isLoggedIn) navigate("/login")
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkers(workers)
    } else {
      const filtered = workers.filter((worker) => worker.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredWorkers(filtered)
    }
  }, [searchQuery, workers])

  useEffect(() => {
    if (payrollSearchQuery.trim() === "") {
      setFilteredPayrollData(payrollData)
    } else {
      const filtered = payrollData.filter((entry) =>
        entry.name.toLowerCase().includes(payrollSearchQuery.toLowerCase()),
      )
      setFilteredPayrollData(filtered)
    }
  }, [payrollSearchQuery, payrollData])

  useEffect(() => {
    if (isLoggedIn) {
      fetchWorkers()
      fetchPayrollRules()
      fetchPendingRequests()
      fetchWorkerManagers()
      if (payrollPeriod.startDate && payrollPeriod.endDate) fetchPayroll()
    }
  }, [payrollPeriod, isLoggedIn, fetchPayroll])

  // Update the fetchWorkers function to properly handle field names
  const fetchWorkers = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("http://localhost:3001/api/workers", { withCredentials: true })

      // Normalize worker data to ensure consistent field names
      const normalizedWorkers = response.data.map((worker) => ({
        ...worker,
        bankName: worker.bankName || worker.bank_name || worker.bankname || "N/A",
        accountNumber: worker.accountNumber || worker.account_number || worker.accountnumber || "N/A",
        regdate:
          worker.regdate ||
          worker.regDate ||
          worker.registration_date ||
          new Date(worker.created_at).toISOString().split("T")[0],
      }))

      setWorkers(normalizedWorkers)
      setFilteredWorkers(normalizedWorkers)
    } catch (err) {
      toast.error("Failed to fetch workers")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayrollRules = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/payroll-rules", { withCredentials: true })
      setPayrollRules({
        standard_working_hours: Number(response.data.standard_working_hours) || 8,
        daily_rate: Number(response.data.daily_rate) || 0,
        overtime_rate: Number(response.data.overtime_rate) || 0,
      })
    } catch (err) {
      toast.error("Failed to fetch payroll rules")
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/pending-requests", { withCredentials: true })
      setPendingRequests(response.data)
    } catch (err) {
      toast.error("Failed to fetch pending requests")
    }
  }

  const fetchWorkerManagers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/worker-managers", { withCredentials: true })
      setWorkerManagers(response.data)
    } catch (err) {
      toast.error("Failed to fetch worker managers")
    }
  }

  // Update the handleCreateWorker function to include registration date
  const handleCreateWorker = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", newWorker.name)
      formData.append("bankName", newWorker.bankName)
      formData.append("accountNumber", newWorker.accountNumber)
      formData.append("regdate", new Date().toISOString().split("T")[0]) // Add today's date as registration date

      if (newWorker.photo) {
        formData.append("photo", newWorker.photo)
      }

      await axios.post("http://localhost:3001/api/workers", formData, { withCredentials: true })
      setShowWorkerModal(false)
      setNewWorker({ name: "", photo: null, bankName: "", accountNumber: "", regdate: "" })
      setPhotoPreview(null)
      fetchWorkers()
      toast.success("Worker created successfully")
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create worker")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePayrollRules = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = {
        standard_working_hours: Number(payrollRules.standard_working_hours),
        daily_rate: Number(payrollRules.daily_rate),
        overtime_rate: Number(payrollRules.overtime_rate),
      }
      await axios.post("http://localhost:3001/api/payroll-rules", payload, { withCredentials: true })
      setShowPayrollRulesModal(false)
      toast.success("Payroll rules updated successfully")
      fetchPayrollRules()
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update payroll rules")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId, approve) => {
    setIsLoading(true)
    try {
      await axios.post(
        `http://localhost:3001/api/pending-requests/${requestId}`,
        { action: approve ? "approve" : "reject" },
        { withCredentials: true },
      )
      fetchPendingRequests()
      fetchWorkers()
      toast.success(`Request ${approve ? "approved" : "rejected"} successfully`)
    } catch (err) {
      toast.error("Failed to process request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveAll = async () => {
    setIsLoading(true)
    try {
      await axios.post("http://localhost:3001/api/pending-requests/approve-all", {}, { withCredentials: true })
      toast.success("All requests approved successfully")
      fetchPendingRequests()
      fetchWorkers()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve all requests")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateManager = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await axios.post(
        "http://localhost:3001/api/worker-managers",
        { ...newManager, role: "worker_manager" },
        { withCredentials: true },
      )
      setShowManagerModal(false)
      setNewManager({ username: "", password: "" })
      toast.success("Worker manager created successfully")
      fetchWorkerManagers()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create manager")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateManagerStatus = async (managerId, status) => {
    setIsLoading(true)
    try {
      await axios.patch(
        `http://localhost:3001/api/worker-managers/${managerId}/status`,
        { status },
        { withCredentials: true },
      )
      toast.success(`Worker Manager ${status} successfully`)
      fetchWorkerManagers()
    } catch (err) {
      toast.error("Failed to update Worker Manager status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyOvertime = async (e, deduct = false) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = overtimeData.allWorkers
        ? { hours: Number(overtimeData.hours), allWorkers: true, deduct }
        : { workerId: overtimeData.workerId, hours: Number(overtimeData.hours), deduct }

      await axios.post("http://localhost:3001/api/workers/overtime", payload, { withCredentials: true })
      setShowOvertimeModal(false)
      setOvertimeData({ workerId: "", hours: "", allWorkers: false, deduct: false })
      fetchWorkers()
      toast.success(`${deduct ? "Overtime deducted" : "Overtime applied"} successfully`)
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${deduct ? "deduct" : "apply"} overtime`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleWorkerStatus = async (workerId, currentStatus) => {
    setIsLoading(true)
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await axios.patch(
        `http://localhost:3001/api/workers/${workerId}/status`,
        { status: newStatus },
        { withCredentials: true },
      )
      toast.success(`Worker ${newStatus} successfully`)
      fetchWorkers()
    } catch (err) {
      console.error("Error updating worker status:", err.response?.data || err)
      toast.error(err.response?.data?.message || "Failed to update worker status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWorker = async (workerId) => {
    if (window.confirm("Are you sure you want to delete this worker?")) {
      setIsLoading(true)
      try {
        await axios.delete(`http://localhost:3001/api/workers/${workerId}`, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        })
        toast.success("Worker deleted successfully")
        fetchWorkers()
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete worker")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const exportWorkersToExcel = () => {
    if (!payrollRules) {
      toast.warning("Payroll rules not loaded yet.")
      return
    }
    const data = filteredWorkers.map((worker) => ({
      ID: worker.id,
      Name: worker.name,
      "Daily Rate": Number(payrollRules.daily_rate).toFixed(2),
      "Overtime Rate": Number(payrollRules.overtime_rate).toFixed(2),
      "Overtime Hours": worker.overtime_hours || 0,
      Status: worker.status,
      "Bank Name": worker.bankName || worker.bank_name || "N/A",
      "Account Number": worker.accountNumber || worker.account_number || "N/A",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Workers")
    XLSX.writeFile(wb, "Worker_Payroll_Data.xlsx")
    toast.success("Workers data exported successfully")
  }

  const exportPayrollToExcel = () => {
    const data = filteredPayrollData.map((entry) => ({
      ID: entry.workerId,
      Name: entry.name,
      "Days Worked": entry.daysWorked,
      "Regular Hours": entry.regularHours,
      "Overtime Hours": entry.overtimeHours,
      "Daily Pay (Br)": Number(entry.dailyPay).toFixed(2),
      "Overtime Pay (Br)": Number(entry.overtimePay).toFixed(2),
      "Total Salary (Br)": Number(entry.totalSalary).toFixed(2),
      "Bank Name": entry.bankName || entry.bank_name || "N/A",
      "Account Number": entry.accountNumber || entry.account_number || "N/A",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payroll")
    XLSX.writeFile(wb, `Payroll_${payrollPeriod.startDate}_to_${payrollPeriod.endDate}.xlsx`)
    toast.success("Payroll data exported successfully")
  }

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3001/api/auth/logout", {}, { withCredentials: true })
      localStorage.clear()
      setIsLoggedIn(false)
      navigate("/login")
    } catch (err) {
      console.error("Logout error:", err)
      localStorage.clear()
      setIsLoggedIn(false)
      navigate("/login")
    }
  }

  const handleViewPhoto = (photoUrl) => {
    if (!photoUrl) {
      toast.warning("No photo available for this worker")
      return
    }
    const fullUrl = photoUrl.startsWith("http") ? photoUrl : `http://localhost:3001${photoUrl}`
    setSelectedPhoto(fullUrl)
    setShowPhotoModal(true)
  }

  if (!isLoggedIn) return null

  const renderTabContent = () => {
    switch (activeTab) {
      case "workers":
        return (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
              <h3 className="mb-md-0 mb-2">Manage Workers</h3>
              <div className="d-flex flex-md-row flex-column align-items-md-center gap-2">
                <input
                  type="text"
                  placeholder="Search workers by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control me-md-2 mb-2 mb-md-0"
                  style={{ width: "200px" }}
                />
                <button className="btn btn-primary me-md-2 mb-2 mb-md-0" onClick={() => setShowWorkerModal(true)}>
                  <Plus size={16} className="me-1" /> Add New Worker
                </button>
                <button className="btn btn-info me-md-2 mb-2 mb-md-0" onClick={() => setShowOvertimeModal(true)}>
                  <Clock size={16} className="me-1" /> Apply Overtime
                </button>
                <button className="btn btn-success" onClick={exportWorkersToExcel}>
                  <FileSpreadsheet size={16} className="me-1" /> Export to Excel
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner />
                <p className="mt-2">Loading workers...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
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
                        <td>{worker.bankname || worker.bank_name || worker.bankName || "N/A"}</td>
                        <td>{worker.accountnumber || worker.account_number || worker.accountNumber || "N/A"}</td>
                        <td>
                          {worker.regdate || worker.regDate || worker.registration_date
                            ? new Date(
                                worker.regdate || worker.regDate || worker.registration_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>{Number(worker.daily_rate || payrollRules.daily_rate || 0).toFixed(2)} Br</td>
                        <td>{Number(worker.overtime_rate || payrollRules.overtime_rate || 0).toFixed(2)} Br</td>
                        <td>{Number(worker.overtime_hours || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${worker.status === "active" ? "badge-active" : "badge-inactive"}`}>
                            {worker.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewPhoto(worker.photo_url)}
                            disabled={!worker.photo_url}
                          >
                            <Eye size={14} className="me-1" /> View Photo
                          </button>
                        </td>
                        <td>
                          <button
                            className={`btn ${worker.status === "active" ? "btn-warning" : "btn-success"} btn-sm btn-action`}
                            onClick={() => handleToggleWorkerStatus(worker.id, worker.status)}
                          >
                            {worker.status === "active" ? (
                              <>
                                <ToggleLeft size={14} className="me-1" /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight size={14} className="me-1" /> Activate
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-action"
                            onClick={() => handleDeleteWorker(worker.id)}
                          >
                            <Trash2 size={14} className="me-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )

      case "pending-requests":
        return (
          <>
            <h3 className="mb-3">Pending Requests</h3>
            <button className="btn btn-success mb-3" onClick={handleApproveAll}>
              <CheckCircle size={16} className="me-1" /> Approve All
            </button>
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner />
                <p className="mt-2">Loading requests...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
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
                          {request.request_type === "new_worker" && <>Worker: {request.request_data.name}</>}
                          {request.request_type === "overtime_individual" && (
                            <>
                              Worker ID: {request.request_data.workerId}, Hours: {request.request_data.hours}
                              {request.request_data.deduct ? " (Deduct)" : ""}
                            </>
                          )}
                          {request.request_type === "overtime_group" && (
                            <>
                              Hours: {request.request_data.hours} (All Workers)
                              {request.request_data.deduct ? " (Deduct)" : ""}
                            </>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${request.status}`}>{request.status}</span>
                        </td>
                        <td>{request.created_by_username || "Unknown"}</td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                        <td>
                          {request.status === "pending" && (
                            <>
                              <button
                                className="btn btn-success btn-sm btn-action"
                                onClick={() => handleApproveRequest(request.id, true)}
                              >
                                <CheckCircle size={14} className="me-1" /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm btn-action"
                                onClick={() => handleApproveRequest(request.id, false)}
                              >
                                <XCircle size={14} className="me-1" /> Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )

      case "payroll":
        return (
          <>
            <h3 className="mb-3">Payroll Management</h3>
            <button className="btn btn-primary mb-3" onClick={() => setShowPayrollRulesModal(true)}>
              <Settings size={16} className="me-1" /> Update Payroll Rules
            </button>
            <div className="card">
              <div className="card-header">
                <h5>Current Payroll Rules</h5>
              </div>
              <div className="card-body">
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Standard Working Hours/Day</th>
                      <td>{Number(payrollRules.standard_working_hours || 8)}</td>
                    </tr>
                    <tr>
                      <th>Daily Rate</th>
                      <td>{Number(payrollRules.daily_rate || 0).toFixed(2)} Br</td>
                    </tr>
                    <tr>
                      <th>Overtime Rate (per hour)</th>
                      <td>{Number(payrollRules.overtime_rate || 0).toFixed(2)} Br</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )

      case "worker-managers":
        return (
          <>
            <h3 className="mb-3">Worker Managers</h3>
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner />
                <p className="mt-2">Loading worker managers...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
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
                          <span className={`badge ${manager.status === "active" ? "badge-active" : "badge-inactive"}`}>
                            {manager.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${manager.status === "active" ? "btn-warning" : "btn-success"} btn-sm btn-action`}
                            onClick={() =>
                              handleUpdateManagerStatus(manager.id, manager.status === "active" ? "inactive" : "active")
                            }
                          >
                            {manager.status === "active" ? (
                              <>
                                <ToggleLeft size={14} className="me-1" /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight size={14} className="me-1" /> Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )

      case "payroll-calc":
        return (
          <>
            <h3 className="mb-3">Payroll Calculation</h3>
            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center flex-md-row flex-column mb-3">
                  <label className="me-md-2 mb-2 mb-md-0">Start Date:</label>
                  <input
                    type="date"
                    value={payrollPeriod.startDate}
                    onChange={(e) => setPayrollPeriod({ ...payrollPeriod, startDate: e.target.value })}
                    className="form-control me-md-3 mb-2 mb-md-0"
                    style={{ maxWidth: "200px" }}
                  />
                  <label className="me-md-2 mb-2 mb-md-0">End Date:</label>
                  <input
                    type="date"
                    value={payrollPeriod.endDate}
                    onChange={(e) => setPayrollPeriod({ ...payrollPeriod, endDate: e.target.value })}
                    className="form-control"
                    style={{ maxWidth: "200px" }}
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center flex-md-row flex-column">
                  <input
                    type="text"
                    placeholder="Search payroll by name..."
                    value={payrollSearchQuery}
                    onChange={(e) => setPayrollSearchQuery(e.target.value)}
                    style={{ maxWidth: "200px" }}
                    className="form-control mb-2 mb-md-0"
                  />
                  <button
                    className="btn btn-success"
                    onClick={exportPayrollToExcel}
                    disabled={filteredPayrollData.length === 0}
                  >
                    <FileSpreadsheet size={16} className="me-1" /> Export to Excel
                  </button>
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner />
                <p className="mt-2">Loading payroll data...</p>
              </div>
            ) : payrollData.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Days Worked</th>
                      <th>Regular Hours</th>
                      <th>Overtime Hours</th>
                      <th>Daily Pay (Br)</th>
                      <th>Overtime Pay (Br)</th>
                      <th>Total Salary (Br)</th>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrollData.map((entry) => (
                      <tr key={entry.workerId}>
                        <td>{entry.workerId}</td>
                        <td>{entry.name}</td>
                        <td>{entry.daysWorked}</td>
                        <td>{entry.regularHours}</td>
                        <td>{entry.overtimeHours}</td>
                        <td>{Number(entry.dailyPay).toFixed(2)}</td>
                        <td>{Number(entry.overtimePay).toFixed(2)}</td>
                        <td>{Number(entry.totalSalary).toFixed(2)}</td>
                        <td>{entry.bankname || entry.bank_name || entry.bankName || "N/A"}</td>
                        <td>{entry.accountnumber || entry.account_number || entry.accountNumber || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center">
                  <p>Select a date range to calculate payroll.</p>
                </div>
              </div>
            )}
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mt-4 fade-in">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Company Admin Dashboard</h2>
        {isLoggedIn && (
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-md-row flex-column">
        <div className="tabs mb-md-0 mb-3 w-100 md:w-auto">
          <div className={`tab ${activeTab === "workers" ? "active" : ""}`} onClick={() => setActiveTab("workers")}>
            <Users size={16} className="me-1" /> Workers
          </div>
          <div
            className={`tab ${activeTab === "pending-requests" ? "active" : ""}`}
            onClick={() => setActiveTab("pending-requests")}
          >
            <ClipboardList size={16} className="me-1" />
            Pending Requests
            {pendingRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="badge badge-warning ms-1">
                {pendingRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </div>
          <div className={`tab ${activeTab === "payroll" ? "active" : ""}`} onClick={() => setActiveTab("payroll")}>
            <Settings size={16} className="me-1" /> Payroll Management
          </div>
          <div
            className={`tab ${activeTab === "worker-managers" ? "active" : ""}`}
            onClick={() => setActiveTab("worker-managers")}
          >
            <Users size={16} className="me-1" /> Worker Managers
          </div>
          <div
            className={`tab ${activeTab === "payroll-calc" ? "active" : ""}`}
            onClick={() => setActiveTab("payroll-calc")}
          >
            <Calculator size={16} className="me-1" /> Payroll Calculation
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowManagerModal(true)}>
          <Plus size={16} className="me-1" /> Add Worker Manager
        </button>
      </div>

      {renderTabContent()}

      {/* Worker Modal */}
      {showWorkerModal && (
        <Modal isOpen={showWorkerModal} onClose={() => setShowWorkerModal(false)} title="Add New Worker">
          <form onSubmit={handleCreateWorker}>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <div className="mb-2">
                {photoPreview && (
                  <img src={photoPreview || "/placeholder.svg"} alt="Preview" className="photo-preview" />
                )}
              </div>
              <div className="d-flex flex-column">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      setNewWorker({ ...newWorker, photo: file })
                      setPhotoPreview(URL.createObjectURL(file))
                    }
                  }}
                  className="form-control mb-2"
                />
                <small className="text-muted">On mobile devices, you can take a photo directly with your camera.</small>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                value={newWorker.bankName}
                onChange={(e) => setNewWorker({ ...newWorker, bankName: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                value={newWorker.accountNumber}
                onChange={(e) => setNewWorker({ ...newWorker, accountNumber: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setShowWorkerModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="small" className="me-2" />
                    Creating...
                  </>
                ) : (
                  "Create Worker"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payroll Rules Modal */}
      {showPayrollRulesModal && (
        <Modal
          isOpen={showPayrollRulesModal}
          onClose={() => setShowPayrollRulesModal(false)}
          title="Update Payroll Rules"
        >
          <form onSubmit={handleUpdatePayrollRules}>
            <div className="form-group">
              <label className="form-label">Standard Working Hours/Day</label>
              <input
                type="number"
                value={payrollRules.standard_working_hours}
                onChange={(e) => setPayrollRules({ ...payrollRules, standard_working_hours: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Daily Rate (Br)</label>
              <input
                type="number"
                step="0.01"
                value={payrollRules.daily_rate}
                onChange={(e) => setPayrollRules({ ...payrollRules, daily_rate: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Overtime Rate (Br/hour)</label>
              <input
                type="number"
                step="0.01"
                value={payrollRules.overtime_rate}
                onChange={(e) => setPayrollRules({ ...payrollRules, overtime_rate: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setShowPayrollRulesModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="small" className="me-2" />
                    Updating...
                  </>
                ) : (
                  "Update Rules"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manager Modal */}
      {showManagerModal && (
        <Modal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} title="Add Worker Manager">
          <form onSubmit={handleCreateManager}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={newManager.username}
                onChange={(e) => setNewManager({ ...newManager, username: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={newManager.password}
                onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setShowManagerModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="small" className="me-2" />
                    Creating...
                  </>
                ) : (
                  "Create Manager"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Overtime Modal */}
      {showOvertimeModal && (
        <Modal isOpen={showOvertimeModal} onClose={() => setShowOvertimeModal(false)} title="Apply Overtime">
          <form onSubmit={(e) => handleApplyOvertime(e, overtimeData.deduct)}>
            <div className="form-group">
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  id="allWorkers"
                  checked={overtimeData.allWorkers}
                  onChange={(e) => setOvertimeData({ ...overtimeData, allWorkers: e.target.checked })}
                  className="me-2"
                />
                <label htmlFor="allWorkers" className="form-label mb-0">
                  Apply to all workers
                </label>
              </div>
            </div>
            {!overtimeData.allWorkers && (
              <div className="form-group">
                <label className="form-label">Worker</label>
                <select
                  value={overtimeData.workerId}
                  onChange={(e) => setOvertimeData({ ...overtimeData, workerId: e.target.value })}
                  required
                  className="form-control"
                >
                  <option value="">Select worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Hours</label>
              <input
                type="number"
                step="0.5"
                value={overtimeData.hours}
                onChange={(e) => setOvertimeData({ ...overtimeData, hours: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  id="deductOvertime"
                  checked={overtimeData.deduct}
                  onChange={(e) => setOvertimeData({ ...overtimeData, deduct: e.target.checked })}
                  className="me-2"
                />
                <label htmlFor="deductOvertime" className="form-label mb-0">
                  Deduct Overtime
                </label>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button type="button" className="btn btn-secondary me-2" onClick={() => setShowOvertimeModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="small" className="me-2" />
                    {overtimeData.deduct ? "Deducting..." : "Applying..."}
                  </>
                ) : overtimeData.deduct ? (
                  "Deduct Overtime"
                ) : (
                  "Apply Overtime"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Worker Photo">
          {selectedPhoto ? (
            <img
              src={selectedPhoto || "/placeholder.svg"}
              alt="Worker"
              style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }}
              onError={() => toast.error("Failed to load photo")}
            />
          ) : (
            <p>No photo available.</p>
          )}
        </Modal>
      )}
    </div>
  )
}

export default CompanyAdminDashboard

