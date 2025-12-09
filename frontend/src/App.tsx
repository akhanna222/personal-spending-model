import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Landing from './pages/Landing';
import Transactions from './pages/Transactions';
import Review from './pages/Review';
import Dashboard from './pages/Dashboard';

function App() {
  const [hasUploadedData, setHasUploadedData] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/"
            element={<Landing onUploadComplete={() => setHasUploadedData(true)} />}
          />
          <Route
            path="/transactions"
            element={hasUploadedData ? <Transactions /> : <Navigate to="/" />}
          />
          <Route
            path="/review"
            element={hasUploadedData ? <Review /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard"
            element={hasUploadedData ? <Dashboard /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
