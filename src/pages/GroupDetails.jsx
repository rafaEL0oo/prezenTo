import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { sendDrawNotificationsToAll, sendDrawNotification } from '../services/email';
import './GroupDetails.css';

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [resendingEmail, setResendingEmail] = useState(null); // Track which participant email is being resent

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
        setError('Grupa nie została znaleziona');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performDraw = async () => {
    if (!group || group.participants.length < 2) {
      setError('Potrzeba co najmniej 2 uczestników, aby przeprowadzić losowanie');
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

      // Send email notifications to all participants
      try {
        const emailResults = await sendDrawNotificationsToAll(
          group.participants,
          assignments,
          { ...group, assignments }
        );

        const successCount = emailResults.filter(r => r.success).length;
        const failureCount = emailResults.filter(r => !r.success).length;

        if (failureCount === 0) {
          alert(`Losowanie zakończone! Wszyscy ${successCount} uczestnicy zostali powiadomieni e-mailem.`);
        } else {
          alert(`Losowanie zakończone! ${successCount} uczestników zostało powiadomionych e-mailem. ${failureCount} e-mail(e) nie zostało wysłanych.`);
          console.error('Email sending errors:', emailResults.filter(r => !r.success));
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        alert(`Losowanie zakończone! Wystąpił jednak błąd podczas wysyłania powiadomień e-mail. Spróbuj ponownie lub powiadom uczestników ręcznie.`);
      }

      fetchGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setDrawing(false);
    }
  };

  const copyLink = () => {
    const basename = import.meta.env.PROD ? '/prezenTo' : '';
    const link = `${window.location.origin}${basename}/join/${groupId}`;
    navigator.clipboard.writeText(link);
    alert('Link skopiowany do schowka!');
  };

  const handleResendEmail = async (participant) => {
    if (!group.assignments || !group.assignments[participant.email]) {
      setError('Nie znaleziono przypisania dla tego uczestnika');
      return;
    }

    setResendingEmail(participant.email);
    setError('');

    try {
      const match = group.assignments[participant.email];
      await sendDrawNotification(participant, match, group);
      alert(`Powiadomienie e-mail zostało pomyślnie wysłane do ${participant.name}!`);
    } catch (err) {
      setError(`Nie udało się wysłać e-maila do ${participant.name}: ${err.message}`);
    } finally {
      setResendingEmail(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę grupę? Ta akcja nie może zostać cofnięta.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteDoc(doc(db, 'groups', groupId));
      alert('Grupa została pomyślnie usunięta!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
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
            Powrót do Panelu
          </button>
        </div>
      </div>
    );
  }

  const basename = import.meta.env.PROD ? '/prezenTo' : '';
  const joinLink = `${window.location.origin}${basename}/join/${groupId}`;
  const isAdmin = group.adminId === auth.currentUser?.uid;
  const canDraw = group.status === 'open' && group.participants.length >= 2;

  return (
    <div className="page-container">
      <div className="container">
        <div className="card group-details-card">
          <h1>{group.groupName}</h1>
          
          {group.welcomeMessage && (
            <div className="welcome-message">
              <p>{group.welcomeMessage}</p>
            </div>
          )}

          <div className="group-info">
            <p><strong>📅 Data Wydarzenia:</strong> {new Date(group.eventDate?.toDate()).toLocaleDateString('pl-PL')}</p>
            <p><strong>💰 Budżet:</strong> {group.budget} zł</p>
            <p><strong>🎮 Tryb:</strong> {group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standardowy'}</p>
            <p><strong>👥 Uczestnicy:</strong> {group.participants?.length || 0}</p>
            <p><strong>📊 Status:</strong> {
              group.status === 'drawn' ? '🎁 Losowanie Zakończone' : 
              group.status === 'closed' ? '🚫 Zamknięte' : 
              '✅ Otwarte'
            }</p>
          </div>

          {isAdmin && (
            <div className="admin-section">
              <h2>Link Udostępniania</h2>
              <div className="link-section">
                <input type="text" value={joinLink} readOnly className="link-input" />
                <button onClick={copyLink} className="btn btn-secondary">
                  Skopiuj Link
                </button>
              </div>

              <h2>Uczestnicy</h2>
              {group.participants?.length === 0 ? (
                <p>Brak uczestników. Udostępnij link, aby zaprosić ludzi!</p>
              ) : (
                <ul className="participants-list">
                  {group.participants.map((p, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span>
                        {p.name} {p.isAdmin && '(Admin)'}
                      </span>
                      {group.status === 'drawn' && group.assignments && group.assignments[p.email] && (
                        <button
                          onClick={() => handleResendEmail(p)}
                          className="btn btn-secondary"
                          disabled={resendingEmail === p.email}
                          style={{ 
                            padding: '0.25rem 0.75rem', 
                            fontSize: '0.875rem',
                            marginLeft: '1rem'
                          }}
                        >
                          {resendingEmail === p.email ? 'Wysyłanie...' : '📧 Wyślij Ponownie'}
                        </button>
                      )}
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
                  {drawing ? 'Losowanie...' : '🎲 Przeprowadź Losowanie'}
                </button>
              )}

              {group.status === 'drawn' && new Date(group.eventDate?.toDate()) <= new Date() && (
                <button 
                  onClick={() => navigate(`/results/${groupId}`)}
                  className="btn btn-secondary btn-full"
                >
                  Zobacz Wyniki
                </button>
              )}

              <button 
                onClick={handleDeleteGroup}
                className="btn btn-secondary btn-full"
                disabled={deleting}
                style={{ marginTop: '1rem', background: '#DC143C', color: 'white' }}
              >
                {deleting ? 'Usuwanie...' : '🗑️ Usuń Grupę'}
              </button>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }}>
            Powrót do Panelu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupDetails;

