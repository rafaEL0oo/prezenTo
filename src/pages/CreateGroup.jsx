import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import './CreateGroup.css';

const CHAOS_QUESTIONS = [
  'What is your favorite color?',
  'What is your favorite hobby?',
  'What is your favorite type of food?',
  'What would be your ideal gift?',
  'What is your favorite holiday tradition?'
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
        throw new Error('You must be logged in');
      }

      // Validate required fields
      if (!formData.groupName || !formData.budget || !formData.eventDate) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.adminParticipating && (!formData.adminName || !formData.adminEmail)) {
        throw new Error('Please provide your name and email if participating');
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
        <h1>🎄 Create Secret Santa Group</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleInputChange}
              required
              placeholder="e.g., Secret Santa at Chudy & Ola's"
            />
          </div>

          <div className="form-group">
            <label>Welcome Message</label>
            <textarea
              name="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={handleInputChange}
              placeholder="A warm message for participants joining your group..."
            />
          </div>

          <div className="form-group">
            <label>Mode *</label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
            >
              <option value="standard">📋 Standard - Participants know their match immediately</option>
              <option value="chaos">🎲 Chaos - Participants receive hints based on answers</option>
            </select>
          </div>

          <div className="form-group">
            <label>Budget Limit ($) *</label>
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
            <label>Event Date *</label>
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
              I am participating in this Secret Santa
            </label>
          </div>

          {formData.adminParticipating && (
            <>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  required={formData.adminParticipating}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Your Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  required={formData.adminParticipating}
                  placeholder="your@email.com"
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
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;

