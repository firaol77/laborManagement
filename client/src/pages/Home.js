import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const Home = () => {
  return (
    <div className="container mt-5 fade-in">
      <div className="card">
        <div className="card-body text-center">
          <h1 className="mb-4">Welcome to Labor Management System</h1>
          <p className="mb-4">A comprehensive solution for managing workers, payroll, and company administration.</p>
          <Link to="/login" className="btn btn-primary">
            Login to Access Dashboard <ArrowRight size={16} className="ms-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home

