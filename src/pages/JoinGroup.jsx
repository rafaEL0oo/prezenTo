import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import './JoinGroup.css';

function JoinGroup() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    answers: {}
  });

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    } else {
      setError('Nieprawidłowy link do grupy');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    setError('');
    setGroup(null);

    try {
      // Clean and validate groupId
      const cleanGroupId = groupId?.trim();
      
      if (!cleanGroupId || cleanGroupId.length === 0) {
        setError('Nieprawidłowe ID grupy');
        setLoading(false);
        return;
      }
      
      // Validate - Firestore IDs shouldn't contain slashes
      if (cleanGroupId.includes('/')) {
        setError('Nieprawidłowy format ID grupy');
        setLoading(false);
        return;
      }
      
      console.log('Fetching group with ID:', cleanGroupId);
      const docRef = doc(db, 'groups', cleanGroupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() };
        setGroup(groupData);
        
        // Check if group is closed
        if (groupData.status === 'closed' || groupData.status === 'drawn') {
          setError('Ta grupa jest zamknięta. Mikołajowie zostali już przypisani!');
        } else if (groupData.status !== 'open') {
          setError('Ta grupa nie jest otwarta dla nowych uczestników.');
        }
      } else {
        console.error('Group not found with ID:', cleanGroupId);
        setError('Nie ma grupy z tym ID. Sprawdź link i upewnij się, że jest poprawny.');
      }
    } catch (err) {
      console.error('Error fetching group:', err);
      // Handle Firestore permission errors and other errors
      let errorMessage = 'Nie udało się załadować grupy. ';
      if (err.code === 'permission-denied') {
        errorMessage += 'Odmowa dostępu - nie masz dostępu do tej grupy.';
      } else if (err.code === 'unavailable') {
        errorMessage += 'Usługa Firebase jest tymczasowo niedostępna. Spróbuj ponownie później.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Spróbuj ponownie później.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('answer_')) {
      const questionIndex = name.split('_')[1];
      setFormData({
        ...formData,
        answers: {
          ...formData.answers,
          [questionIndex]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Check if email already exists
      const existingParticipant = group.participants?.find(
        p => p.email.toLowerCase() === formData.email.toLowerCase()
      );

      if (existingParticipant) {
        throw new Error('Ten email jest już zarejestrowany w tej grupie');
      }

      const participantData = {
        name: formData.name,
        email: formData.email,
        answers: group.mode === 'chaos' ? formData.answers : null,
        joinedAt: new Date()
      };

      // Use the group.id from the fetched data
      const finalGroupId = group.id;
      console.log('Updating group with ID:', finalGroupId);
      
      await updateDoc(doc(db, 'groups', finalGroupId), {
        participants: arrayUnion(participantData)
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Error state (no group loaded)
  if (error && !group) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>❌ Nie można dołączyć do grupy</h1>
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success message after joining
  if (success) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎉 Witaj w {group.groupName}!</h1>
          <div className="alert alert-success">
            <p>Pomyślnie dołączyłeś do grupy! Admin rozpocznie losowanie, gdy wszyscy dołączą.</p>
            <p>Otrzymasz powiadomienie e-mail, gdy losowanie zostanie zakończone.</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (group loaded but has error)
  if (group && error) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎄 {group.groupName || 'Grupa'}</h1>
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Group closed/drawn state
  if (group && (group.status === 'closed' || group.status === 'drawn')) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎄 {group.groupName}</h1>
          <div className="alert alert-error">
            <p>Ta grupa jest zamknięta i Mikołajowie zostali już przypisani!</p>
          </div>
        </div>
      </div>
    );
  }

  // Main form - group is loaded and open
  return (
    <div className="page-container">
      <div className="card">
        {group.photoURL && (
          <img src={group.photoURL} alt={group.groupName} className="group-photo" />
        )}
        
        <h1>🎅 Zostałeś zaproszony!</h1>
        <h2>{group.groupName}</h2>
        
        {group.welcomeMessage && (
          <div className="welcome-message">
            <p>{group.welcomeMessage}</p>
          </div>
        )}

        <div className="group-info">
          <p><strong>📅 Data Wydarzenia:</strong> {new Date(group.eventDate?.toDate()).toLocaleDateString('pl-PL')}</p>
          <p><strong>💰 Budżet:</strong> {group.budget} zł</p>
          <p><strong>🎮 Tryb:</strong> {group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standardowy'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Twoje Imię *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Twoje imię"
            />
          </div>

          <div className="form-group">
            <label>Twój Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="twoj@email.com"
            />
          </div>

          {group.mode === 'chaos' && group.chaosQuestions && (
            <div className="questions-section">
              <h3>Odpowiedz na te pytania, aby pomóc swojemu Mikołajowi:</h3>
              {group.chaosQuestions.map((question, index) => (
                <div key={index} className="form-group">
                  <label>{question}</label>
                  <input
                    type="text"
                    name={`answer_${index}`}
                    value={formData.answers[index] || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Twoja odpowiedź..."
                  />
                </div>
              ))}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Dołączanie...' : 'Dołącz do Grupy'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinGroup;
