import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import './Results.css';

function Results() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() };
        setGroup(groupData);
        
        // Check if event date has passed
        const eventDate = groupData.eventDate?.toDate();
        if (eventDate && eventDate > new Date()) {
          setError('Wyniki będą dostępne po dacie wydarzenia.');
        } else if (!groupData.assignments) {
          setError('Losowanie nie zostało jeszcze przeprowadzone.');
        }
      } else {
        setError('Grupa nie została znaleziona');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (error || !group || !group.assignments) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="alert alert-error">{error || 'Wyniki niedostępne'}</div>
        </div>
      </div>
    );
  }

  const eventDate = group.eventDate?.toDate();
  const canView = eventDate && eventDate <= new Date();

  if (!canView) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎄 {group.groupName}</h1>
          <div className="alert alert-error">
            <p>Wyniki będą dostępne po {eventDate.toLocaleDateString('pl-PL')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="card results-card">
          <h1>🎁 Wyniki Mikołajkowe</h1>
          <h2>{group.groupName}</h2>
          
          <div className="results-info">
            <p><strong>Data Wydarzenia:</strong> {eventDate.toLocaleDateString('pl-PL')}</p>
            <p><strong>Łączna Liczba Uczestników:</strong> {group.participants?.length || 0}</p>
          </div>

          <div className="assignments-list">
            <h3>🎅 Kto Dla Kogo:</h3>
            {group.participants?.map((participant, idx) => {
              const assignment = group.assignments[participant.email];
              return (
                <div key={idx} className="assignment-card">
                  <div className="participant-name">
                    <strong>🎄 {participant.name}</strong>
                  </div>
                  <div className="arrow">↓</div>
                  <div className="assigned-name">
                    <strong>🎁 {assignment?.name || 'Nie przypisano'}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-note">
            <p>✨ Dziękujemy za udział w tej wymianie Mikołajkowej! ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;

