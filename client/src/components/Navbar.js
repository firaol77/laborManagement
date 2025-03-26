"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, LogOut } from "lucide-react"

const Navbar = () => {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setToken(localStorage.getItem("token"))
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    setToken(null)
    navigate("/login")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Labor Management
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {!token ? (
              <Link to="/login" className="px-3 py-2 rounded hover:bg-primary-hover transition-colors">
                Login
              </Link>
            ) : (
              <>
                {localStorage.getItem("role") === "super_admin" && (
                  <Link to="/super-admin" className="px-3 py-2 rounded hover:bg-primary-hover transition-colors">
                    Super Admin Dashboard
                  </Link>
                )}
                {localStorage.getItem("role") === "company_admin" && (
                  <Link to="/company-admin" className="px-3 py-2 rounded hover:bg-primary-hover transition-colors">
                    Company Admin Dashboard
                  </Link>
                )}
                {localStorage.getItem("role") === "worker_manager" && (
                  <Link to="/worker-manager" className="px-3 py-2 rounded hover:bg-primary-hover transition-colors">
                    Worker Manager Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 rounded border border-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary-hover py-2 px-4 slide-in">
          {!token ? (
            <Link to="/login" className="block py-2" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
          ) : (
            <>
              {localStorage.getItem("role") === "super_admin" && (
                <Link to="/super-admin" className="block py-2" onClick={() => setIsMenuOpen(false)}>
                  Super Admin Dashboard
                </Link>
              )}
              {localStorage.getItem("role") === "company_admin" && (
                <Link to="/company-admin" className="block py-2" onClick={() => setIsMenuOpen(false)}>
                  Company Admin Dashboard
                </Link>
              )}
              {localStorage.getItem("role") === "worker_manager" && (
                <Link to="/worker-manager" className="block py-2" onClick={() => setIsMenuOpen(false)}>
                  Worker Manager Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout()
                  setIsMenuOpen(false)
                }}
                className="flex items-center gap-1 py-2 w-full text-left"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar

