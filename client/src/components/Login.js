"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "./ui/toaster"
import Spinner from "./ui/spinner"
import { User, Lock } from "lucide-react"
import { apiRequest } from "../utils/axios-config"

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      // Use apiRequest directly
      const response = await apiRequest("post", "/auth/login", credentials)

      // Check if we received a token directly in the response
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token)
        console.log("Token stored in localStorage from login response")
      } else {
        console.log("No token in response data - relying on cookies")
      }

      const { user } = response.data
      const role = user.role

      // Store role in localStorage for client-side persistence
      localStorage.setItem("role", role)

      console.log("User role:", role)
      toast.success("Login successful")

      // Redirect based on role
      if (role === "super_admin") {
        console.log("Redirecting to super admin dashboard")
        navigate("/super-admin")
      } else if (role === "company_admin") {
        console.log("Redirecting to company admin dashboard")
        navigate("/company-admin")
      } else if (role === "worker_manager") {
        console.log("Redirecting to worker manager dashboard")
        navigate("/worker-manager")
      } else {
        console.log("Unknown role:", role)
        toast.error("Unknown role. Please contact the administrator.")
      }
    } catch (err) {
      console.error("Login error:", err)
      let errorMessage = "Invalid credentials"
      if (err.response) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response.status === 403) {
          errorMessage = "Your account has been deactivated"
        }
      }
      setErrorMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mt-4 fade-in">
      <div className="card max-w-md mx-auto">
        <div className="card-header">
          <h2 className="text-center">Login</h2>
        </div>
        <div className="card-body">
          {errorMessage && <div className="alert alert-danger mb-3">{errorMessage}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="d-flex align-items-center">
                <User size={18} className="me-2 text-secondary" />
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="d-flex align-items-center">
                <Lock size={18} className="me-2 text-secondary" />
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="small" className="me-2" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

