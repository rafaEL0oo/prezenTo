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
      fetchGroup();
    } else {
      setError('Invalid group link');
      setLoading(false);
    }
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      setError('');
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() };
        setGroup(groupData);
        
        // Check if group is closed
        if (groupData.status === 'closed' || groupData.status === 'drawn') {
          setError('This group is closed. Santas have already been assigned!');
        } else if (groupData.status !== 'open') {
          setError('This group is not open for new participants.');
        }
      } else {
        setError('There is no group with that ID. Please check the link and make sure it is correct.');
      }
    } catch (err) {
      // Handle Firestore permission errors and other errors
      let errorMessage = 'Failed to load group. ';
      if (err.code === 'permission-denied') {
        errorMessage += 'You do not have permission to access this group. The group may be private or may require you to be logged in.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again later.';
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
        throw new Error('This email is already registered for this group');
      }

      const participantData = {
        name: formData.name,
        email: formData.email,
        answers: group.mode === 'chaos' ? formData.answers : null,
        joinedAt: new Date()
      };

      await updateDoc(doc(db, 'groups', groupId), {
        participants: arrayUnion(participantData)
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  // Show error if there's an error and no group was loaded
  if (error && !group) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>❌ Unable to Join Group</h1>
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎉 Welcome to {group.groupName}!</h1>
          <div className="alert alert-success">
            <p>You've successfully joined the group! The admin will start the draw once everyone has joined.</p>
            <p>You'll receive an email notification when the draw is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if group exists but is not accessible (closed, not open, etc.)
  if (group && error) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎄 {group.groupName || 'Group'}</h1>
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (group && (group.status === 'closed' || group.status === 'drawn')) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>🎄 {group.groupName}</h1>
          <div className="alert alert-error">
            <p>This group is closed and the Santas have already been assigned!</p>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: only render form if group exists and is accessible
  if (!group) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>❌ Unable to Load Group</h1>
          <div className="alert alert-error">
            <p>An unexpected error occurred. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        {group.photoURL && (
          <img src={group.photoURL} alt={group.groupName} className="group-photo" />
        )}
        
        <h1>🎅 You've been invited!</h1>
        <h2>{group.groupName}</h2>
        
        {group.welcomeMessage && (
          <div className="welcome-message">
            <p>{group.welcomeMessage}</p>
          </div>
        )}

        <div className="group-info">
          <p><strong>📅 Event Date:</strong> {new Date(group.eventDate?.toDate()).toLocaleDateString()}</p>
          <p><strong>💰 Budget:</strong> ${group.budget}</p>
          <p><strong>🎮 Mode:</strong> {group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standard'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label>Your Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
            />
          </div>

          {group.mode === 'chaos' && group.chaosQuestions && (
            <div className="questions-section">
              <h3>Answer these questions to help your Secret Santa:</h3>
              {group.chaosQuestions.map((question, index) => (
                <div key={index} className="form-group">
                  <label>{question}</label>
                  <input
                    type="text"
                    name={`answer_${index}`}
                    value={formData.answers[index] || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Your answer..."
                  />
                </div>
              ))}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinGroup;

