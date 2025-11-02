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

function App() {
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

  // Use basename for GitHub Pages, empty for local development
  const basename = import.meta.env.PROD ? '/prezenTo' : '';

  return (
    <Router basename={basename}>
      <div className="App">
        <Snowflakes />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/create-group" element={user ? <CreateGroup /> : <Navigate to="/login" />} />
          <Route path="/group/:groupId" element={user ? <GroupDetails /> : <Navigate to="/login" />} />
          <Route path="/join/:groupId" element={<JoinGroup />} />
          <Route path="/results/:groupId" element={<Results />} />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
