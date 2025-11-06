import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import GroupDetails from './pages/GroupDetails';
import JoinGroup from './pages/JoinGroup';
import Results from './pages/Results';
import Loading from './components/Loading';
import Snowflakes from './components/Snowflakes';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return user ? children : <Navigate to="/login" />;
}

// Login route wrapper - redirects if already logged in
function LoginRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return user ? <Navigate to="/dashboard" /> : <Login />;
}

// Root redirect component - only redirects if we're exactly at the root path
// This component ensures we only redirect from the exact root, not during route transitions
function RootRedirect() {
  const location = useLocation();
  // At root, pathname will be '/' or ''
  // This check ensures we only redirect from exact root, preventing interference during URL normalization
  const isExactRoot = location.pathname === '/' || location.pathname === '';
  
  if (isExactRoot) {
    return <Navigate to="/login" replace />;
  }
  // If we somehow get here without matching a route, don't redirect
  return null;
}

// NotFound page component for unmatched routes
function NotFoundPage() {
  const location = useLocation();
  return (
    <div className="page-container">
      <div className="card">
        <h1>❌ Strona Nie Znaleziona</h1>
        <div className="alert alert-error">
          <p>Strona, której szukasz, nie istnieje.</p>
          <p>Ścieżka: {location.pathname}</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Snowflakes />
        <Routes>
          <Route path="/join/:groupId" element={<JoinGroup />} />
          <Route path="/results/:groupId" element={<Results />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/" element={<RootRedirect />} />
          {/* Catch-all route - should never be reached if routes are correct */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
