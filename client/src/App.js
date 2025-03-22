import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CompanyAdminDashboard from './components/CompanyAdminDashboard';
import WorkerManagerDashboard from './components/WorkerManagerDashboard';

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} /> {/* Fixed from <excludeHome /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/company-admin" element={<CompanyAdminDashboard />} />
          <Route path="/worker-manager" element={<WorkerManagerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;