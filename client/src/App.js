"use client"

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "./App.css"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./components/Login"
import SuperAdminDashboard from "./components/SuperAdminDashboard"
import CompanyAdminDashboard from "./components/CompanyAdminDashboard"
import WorkerManagerDashboard from "./components/WorkerManagerDashboard"
import { Toaster } from "./components/ui/toaster"
import { useEffect, useState } from "react"

// Protected route component
const ProtectedRoute = ({ element, allowedRoles }) => {
  const role = localStorage.getItem("role")

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.includes(role) || role === "super_admin") {
    return element
  }

  return <Navigate to="/" replace />
}

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"))

  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = localStorage.getItem("role")
      setRole(newRole)
      // You can add additional logic here that uses the role if needed
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/super-admin"
              element={<ProtectedRoute element={<SuperAdminDashboard />} allowedRoles={["super_admin"]} />}
            />
            <Route
              path="/company-admin"
              element={<ProtectedRoute element={<CompanyAdminDashboard />} allowedRoles={["company_admin"]} />}
            />
            <Route
              path="/worker-manager"
              element={<ProtectedRoute element={<WorkerManagerDashboard />} allowedRoles={["worker_manager"]} />}
            />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

