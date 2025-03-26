"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/toaster";
import { apiRequest } from "../utils/axios-config"; // Use apiRequest exclusively
import Modal from "./ui/modal";
import Spinner from "./ui/spinner";
import { Building, Users, Plus, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronRight, Eye } from "lucide-react";

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", adminUsername: "", adminPassword: "" });
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [companyAdmins, setCompanyAdmins] = useState({});
  const [workerManagers, setWorkerManagers] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("role"));
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminDetailsModal, setShowAdminDetailsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("get", "/companies");
      setCompanies(response.data);

      const expandedState = {};
      response.data.forEach((company) => {
        expandedState[company.id] = false;
      });
      setExpandedCompanies(expandedState);

      fetchAllCompanyAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch companies");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllCompanyAdmins = async () => {
    try {
      const response = await apiRequest("get", "/admin/company-admins");
      const adminsByCompany = {};
      response.data.forEach((admin) => {
        if (!adminsByCompany[admin.company_id]) {
          adminsByCompany[admin.company_id] = [];
        }
        adminsByCompany[admin.company_id].push(admin);
      });
      setCompanyAdmins(adminsByCompany);
    } catch (err) {
      toast.error("Failed to fetch company admins");
    }
  };

  const fetchWorkerManagers = async (companyId) => {
    try {
      const response = await apiRequest("get", `/companies/${companyId}/worker-managers`);
      setWorkerManagers((prev) => ({
        ...prev,
        [companyId]: response.data,
      }));
    } catch (err) {
      toast.error(`Failed to fetch worker managers for company ${companyId}`);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiRequest("post", "/companies", newCompany);
      setShowCompanyModal(false);
      setNewCompany({ name: "", adminUsername: "", adminPassword: "" });
      fetchCompanies();
      toast.success("Company and admin created successfully");
    } catch (err) {
      console.error("Create company error:", err.response?.data || err);
      toast.error(err.response?.data?.message || err.message || "Failed to create company");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyStatusToggle = async (companyId, currentStatus) => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await apiRequest("patch", `/companies/${companyId}/status`, { status: newStatus });
      fetchCompanies();
      if (newStatus === "active") {
        toast.success(`Company activated successfully. Company admins have also been activated.`);
      } else {
        toast.success(`Company deactivated successfully. Company admins and worker managers have also been deactivated.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update company status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminStatusToggle = async (adminId, currentStatus) => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await apiRequest("patch", `/admin/company-admins/${adminId}/status`, { status: newStatus });
      fetchAllCompanyAdmins();
      toast.success(`Admin ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update admin status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerManagerStatusToggle = async (managerId, currentStatus) => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await apiRequest("patch", `/worker-managers/${managerId}/status`, { status: newStatus });
      const manager = Object.entries(workerManagers).flatMap(([companyId, managers]) =>
        managers.find((m) => m.id === managerId)
      )[0];
      if (manager) {
        fetchWorkerManagers(manager.company_id);
      }
      toast.success(`Worker Manager ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update worker manager status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this company? This will also delete all associated admins and worker managers."
      )
    ) {
      setIsLoading(true);
      try {
        await apiRequest("delete", `/companies/${companyId}`);
        fetchCompanies();
        toast.success("Company deleted successfully");
      } catch (err) {
        console.error("Error deleting company:", err.message || err);
        toast.error(err.response?.data?.message || "Failed to delete company");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("post", "/auth/logout", {});
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/login");
    }
  };

  const toggleCompanyExpand = (companyId) => {
    setExpandedCompanies((prev) => {
      const newState = {
        ...prev,
        [companyId]: !prev[companyId],
      };
      if (newState[companyId]) {
        fetchWorkerManagers(companyId);
      }
      return newState;
    });
  };

  const viewAdminDetails = (admin) => {
    setSelectedAdmin(admin);
    setShowAdminDetailsModal(true);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="container mt-4 fade-in">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Super Admin Dashboard</h2>
        <div className="d-flex flex-md-row flex-column">
          <button className="btn btn-primary me-md-2 mb-2 mb-md-0" onClick={() => setShowCompanyModal(true)}>
            <Plus size={16} className="me-1" /> Create New Company
          </button>
          {isLoggedIn && (
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <Building size={18} className="me-2" /> Companies
          </h3>
          <span className="badge badge-primary">{companies.length} Companies</span>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="mt-2">Loading companies...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
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
                    <>
                      <tr key={company.id} className={expandedCompanies[company.id] ? "bg-light" : ""}>
                        <td>{company.id}</td>
                        <td>
                          <button
                            className="btn btn-link text-decoration-none p-0 d-flex align-items-center"
                            onClick={() => toggleCompanyExpand(company.id)}
                          >
                            {expandedCompanies[company.id] ? (
                              <ChevronDown size={16} className="me-1" />
                            ) : (
                              <ChevronRight size={16} className="me-1" />
                            )}
                            {company.name}
                          </button>
                        </td>
                        <td>
                          <span className={`badge ${company.status === "active" ? "badge-active" : "badge-inactive"}`}>
                            {company.status}
                          </span>
                        </td>
                        <td>{new Date(company.created_at).toLocaleDateString()}</td>
                        <td>
                          {company.id === 1 ? (
                            <button
                              className="btn btn-warning btn-sm"
                              disabled
                              title="Super Admin Company cannot be deactivated"
                            >
                              <ToggleLeft size={14} className="me-1" /> Deactivate
                            </button>
                          ) : (
                            <button
                              className={`btn ${company.status === "active" ? "btn-warning" : "btn-success"} btn-sm btn-action`}
                              onClick={() => handleCompanyStatusToggle(company.id, company.status)}
                            >
                              {company.status === "active" ? (
                                <>
                                  <ToggleLeft size={14} className="me-1" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={14} className="me-1" /> Activate
                                </>
                              )}
                            </button>
                          )}
                          {company.id !== 1 && (
                            <button
                              className="btn btn-danger btn-sm btn-action"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Trash2 size={14} className="me-1" /> Delete
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedCompanies[company.id] && (
                        <>
                          <tr className="bg-light">
                            <td colSpan={5} className="border-0 pt-0">
                              <div className="ps-4 mb-2">
                                <h5 className="mb-2">
                                  <Users size={16} className="me-1" /> Company Admin
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-sm border">
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {companyAdmins[company.id]?.map((admin) => (
                                        <tr key={admin.id}>
                                          <td>{admin.id}</td>
                                          <td>{admin.username}</td>
                                          <td>
                                            <span
                                              className={`badge ${admin.status === "active" ? "badge-active" : "badge-inactive"}`}
                                            >
                                              {admin.status}
                                            </span>
                                          </td>
                                          <td>
                                            <button
                                              className="btn btn-info btn-sm btn-action"
                                              onClick={() => viewAdminDetails(admin)}
                                            >
                                              <Eye size={14} className="me-1" /> Details
                                            </button>
                                            <button
                                              className={`btn ${admin.status === "active" ? "btn-warning" : "btn-success"} btn-sm btn-action`}
                                              onClick={() => handleAdminStatusToggle(admin.id, admin.status)}
                                            >
                                              {admin.status === "active" ? (
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
                                      {(!companyAdmins[company.id] || companyAdmins[company.id].length === 0) && (
                                        <tr>
                                          <td colSpan={4} className="text-center">
                                            No company admin found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="ps-4 mb-3">
                                <h5 className="mb-2">
                                  <Users size={16} className="me-1" /> Worker Managers
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-sm border">
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {workerManagers[company.id]?.map((manager) => (
                                        <tr key={manager.id}>
                                          <td>{manager.id}</td>
                                          <td>{manager.username}</td>
                                          <td>
                                            <span
                                              className={`badge ${manager.status === "active" ? "badge-active" : "badge-inactive"}`}
                                            >
                                              {manager.status}
                                            </span>
                                          </td>
                                          <td>
                                            <button
                                              className={`btn ${manager.status === "active" ? "btn-warning" : "btn-success"} btn-sm btn-action`}
                                              onClick={() =>
                                                handleWorkerManagerStatusToggle(manager.id, manager.status)
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
                                      {(!workerManagers[company.id] || workerManagers[company.id].length === 0) && (
                                        <tr>
                                          <td colSpan={4} className="text-center">
                                            No worker managers found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} title="Create New Company">
        <form onSubmit={handleCreateCompany}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input
              type="text"
              value={newCompany.adminUsername}
              onChange={(e) => setNewCompany({ ...newCompany, adminUsername: e.target.value })}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input
              type="password"
              value={newCompany.adminPassword}
              onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
              required
              className="form-control"
            />
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowCompanyModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="small" className="me-2" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAdminDetailsModal}
        onClose={() => setShowAdminDetailsModal(false)}
        title="Company Admin Details"
      >
        {selectedAdmin && (
          <div>
            <div className="mb-3">
              <h6>Basic Information</h6>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th>ID</th>
                    <td>{selectedAdmin.id}</td>
                  </tr>
                  <tr>
                    <th>Username</th>
                    <td>{selectedAdmin.username}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span
                        className={`badge ${selectedAdmin.status === "active" ? "badge-active" : "badge-inactive"}`}
                      >
                        {selectedAdmin.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Company ID</th>
                    <td>{selectedAdmin.company_id}</td>
                  </tr>
                  <tr>
                    <th>Created At</th>
                    <td>{new Date(selectedAdmin.created_at).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary" onClick={() => setShowAdminDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;