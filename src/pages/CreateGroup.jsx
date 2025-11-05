import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import './CreateGroup.css';

const CHAOS_QUESTIONS = [
  'Jaki jest Twój ulubiony kolor?',
  'Jakie jest Twoje ulubione hobby?',
  'Jaki jest Twój ulubiony rodzaj jedzenia?',
  'Jaki byłby Twój idealny prezent?',
  'Jaka jest Twoja ulubiona świąteczna tradycja?'
];

function CreateGroup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    groupName: '',
    welcomeMessage: '',
    mode: 'standard',
    budget: '',
    eventDate: '',
    adminParticipating: false,
    adminName: '',
    adminEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Musisz być zalogowany');
      }

      // Validate required fields
      if (!formData.groupName || !formData.budget || !formData.eventDate) {
        throw new Error('Proszę wypełnić wszystkie wymagane pola');
      }

      if (formData.adminParticipating && (!formData.adminName || !formData.adminEmail)) {
        throw new Error('Proszę podać swoje imię i email, jeśli chcesz uczestniczyć');
      }

      // Create group document
      const groupData = {
        groupName: formData.groupName,
        welcomeMessage: formData.welcomeMessage || '',
        mode: formData.mode,
        budget: parseFloat(formData.budget),
        eventDate: new Date(formData.eventDate),
        adminId: user.uid,
        adminEmail: user.email,
        status: 'open',
        participants: [],
        createdAt: new Date(),
        chaosQuestions: formData.mode === 'chaos' ? CHAOS_QUESTIONS : []
      };

      // Add admin as participant if participating
      if (formData.adminParticipating) {
        groupData.participants.push({
          name: formData.adminName,
          email: formData.adminEmail,
          userId: user.uid,
          isAdmin: true,
          answers: formData.mode === 'chaos' ? {} : null,
          joinedAt: new Date()
        });
      }

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      navigate(`/group/${docRef.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1>🎄 Utwórz Grupę Mikołajkową</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nazwa Grupy *</label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleInputChange}
              required
              placeholder="np. Mikołajkowa impreza"
            />
          </div>

          <div className="form-group">
            <label>Wiadomość Powitalna</label>
            <textarea
              name="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={handleInputChange}
              placeholder="Ciepła wiadomość dla uczestników dołączających do Twojej grupy..."
            />
          </div>

          <div className="form-group">
            <label>Tryb *</label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
            >
              <option value="standard">📋 Standardowy - Uczestnicy od razu wiedzą, komu kupują</option>
              <option value="chaos">🎲 Chaos - Uczestnicy otrzymują podpowiedzi na podstawie odpowiedzi</option>
            </select>
          </div>

          <div className="form-group">
            <label>Limit Budżetu (PLN) *</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              required
              min="1"
              step="0.01"
              placeholder="50.00"
            />
          </div>

          <div className="form-group">
            <label>Data Wydarzenia *</label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="adminParticipating"
                checked={formData.adminParticipating}
                onChange={handleInputChange}
              />
              Uczestniczę w tym Mikołajkowym
            </label>
          </div>

          {formData.adminParticipating && (
            <>
              <div className="form-group">
                <label>Twoje Imię *</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  required={formData.adminParticipating}
                  placeholder="Twoje imię"
                />
              </div>

              <div className="form-group">
                <label>Twój Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  required={formData.adminParticipating}
                  placeholder="twoj@email.com"
                />
              </div>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Tworzenie...' : 'Utwórz Grupę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;

