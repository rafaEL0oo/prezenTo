import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import './Dashboard.css';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'groups'), where('adminId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const groupsList = [];
      querySnapshot.forEach((doc) => {
        groupsList.push({ id: doc.id, ...doc.data() });
      });
      setGroups(groupsList);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getStatus = (group) => {
    if (group.status === 'drawn') return 'status-drawn';
    if (group.status === 'closed') return 'status-closed';
    return 'status-open';
  };

  const getStatusText = (group) => {
    if (group.status === 'drawn') return '🎁 Losowanie Zakończone';
    if (group.status === 'closed') return '🚫 Zamknięte';
    return '✅ Otwarte';
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="page-container">
      <div className="container dashboard-container">
        <div className="dashboard-header">
          <h1>🎅 Witaj w PrezenTo!</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/create-group')} className="btn btn-primary">
              + Utwórz Nową Grupę
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              Wyloguj się
            </button>
          </div>
        </div>

        <h2>Twoje Grupy</h2>
        {groups.length === 0 ? (
          <div className="empty-state">
            <p>🎄 Brak grup! Utwórz swoją pierwszą grupę Mikołajkową, aby zacząć.</p>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => (
              <div key={group.id} className="group-card">
                <h3>{group.groupName}</h3>
                <p><strong>Data Wydarzenia:</strong> {new Date(group.eventDate?.toDate()).toLocaleDateString('pl-PL')}</p>
                <p><strong>Budżet:</strong> {group.budget} zł</p>
                <p><strong>Tryb:</strong> {group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standardowy'}</p>
                <p><strong>Uczestnicy:</strong> {group.participants?.length || 0}</p>
                <span className={`group-status ${getStatus(group)}`}>
                  {getStatusText(group)}
                </span>
                <div className="group-actions">
                  <button 
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="btn btn-primary"
                  >
                    Zobacz Szczegóły
                  </button>
                  {group.status === 'drawn' && new Date(group.eventDate?.toDate()) <= new Date() && (
                    <button 
                      onClick={() => navigate(`/results/${group.id}`)}
                      className="btn btn-secondary"
                    >
                      Zobacz Wyniki
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

