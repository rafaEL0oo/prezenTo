import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  // Use basename for GitHub Pages, empty for local development
  const basename = import.meta.env.PROD ? '/prezenTo' : '';

  return (
    <Router basename={basename}>
      <div className="App">
        <Snowflakes />
        <Routes>
          <Route path="/join/:groupId" element={<JoinGroup />} />
          <Route path="/results/:groupId" element={<Results />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
