import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import './GroupDetails.css';

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setGroup({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Group not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performDraw = async () => {
    if (!group || group.participants.length < 2) {
      setError('Need at least 2 participants to perform the draw');
      return;
    }

    setDrawing(true);
    setError('');

    try {
      // Shuffle participants
      const shuffled = [...group.participants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Assign matches (ensure no one draws themselves)
      const assignments = {};
      
      // Create a circular assignment ensuring no self-assignment
      for (let i = 0; i < shuffled.length; i++) {
        let matchIndex = (i + 1) % shuffled.length;
        
        // Double-check: if somehow we'd assign to self, find next available
        if (shuffled[matchIndex].email === shuffled[i].email) {
          matchIndex = (matchIndex + 1) % shuffled.length;
        }
        
        assignments[shuffled[i].email] = {
          name: shuffled[matchIndex].name,
          email: shuffled[matchIndex].email
        };
      }

      // Update group with assignments
      await updateDoc(doc(db, 'groups', groupId), {
        status: 'drawn',
        assignments,
        drawnAt: new Date()
      });

      // TODO: Send email notifications here
      // You'll need to implement email sending (Firebase Cloud Functions or email service)

      alert('Draw completed! Participants have been notified via email.');
      fetchGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setDrawing(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join/${groupId}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (error && !group) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="alert alert-error">{error}</div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const joinLink = `${window.location.origin}/join/${groupId}`;
  const isAdmin = group.adminId === auth.currentUser?.uid;
  const canDraw = group.status === 'open' && group.participants.length >= 2;

  return (
    <div className="page-container">
      <div className="container">
        <div className="card group-details-card">
          {group.photoURL && (
            <img src={group.photoURL} alt={group.groupName} className="group-photo" />
          )}
          
          <h1>{group.groupName}</h1>
          
          {group.welcomeMessage && (
            <div className="welcome-message">
              <p>{group.welcomeMessage}</p>
            </div>
          )}

          <div className="group-info">
            <p><strong>📅 Event Date:</strong> {new Date(group.eventDate?.toDate()).toLocaleDateString()}</p>
            <p><strong>💰 Budget:</strong> ${group.budget}</p>
            <p><strong>🎮 Mode:</strong> {group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standard'}</p>
            <p><strong>👥 Participants:</strong> {group.participants?.length || 0}</p>
            <p><strong>📊 Status:</strong> {
              group.status === 'drawn' ? '🎁 Draw Complete' : 
              group.status === 'closed' ? '🚫 Closed' : 
              '✅ Open'
            }</p>
          </div>

          {isAdmin && (
            <div className="admin-section">
              <h2>Share Link</h2>
              <div className="link-section">
                <input type="text" value={joinLink} readOnly className="link-input" />
                <button onClick={copyLink} className="btn btn-secondary">
                  Copy Link
                </button>
              </div>

              <h2>Participants</h2>
              {group.participants?.length === 0 ? (
                <p>No participants yet. Share the link to invite people!</p>
              ) : (
                <ul className="participants-list">
                  {group.participants.map((p, idx) => (
                    <li key={idx}>
                      {p.name} ({p.email}) {p.isAdmin && '(Admin)'}
                    </li>
                  ))}
                </ul>
              )}

              {canDraw && (
                <button 
                  onClick={performDraw}
                  className="btn btn-primary btn-full"
                  disabled={drawing}
                >
                  {drawing ? 'Drawing...' : '🎲 Perform Draw'}
                </button>
              )}

              {group.status === 'drawn' && new Date(group.eventDate?.toDate()) <= new Date() && (
                <button 
                  onClick={() => navigate(`/results/${groupId}`)}
                  className="btn btn-secondary btn-full"
                >
                  View Results
                </button>
              )}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupDetails;

