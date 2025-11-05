/**
 * Email service using MailerSend API
 * Sends transactional emails to participants
 */

const MAILERSEND_API_KEY = import.meta.env.VITE_MAILERSEND_API_KEY || 'mlsn.1f236e646f1d07c8ae9624c30cf5c8d783586371e631d30c019959af1f37dcb9';
const MAILERSEND_API_URL = 'https://api.mailersend.com/v1/email';

/**
 * Send email notification to a participant about their Secret Santa match
 * @param {Object} participant - Participant object with name and email
 * @param {Object} match - Match object with name (and optionally email)
 * @param {Object} group - Group object with groupName, eventDate, budget, welcomeMessage, mode
 * @returns {Promise} - API response
 */
export async function sendDrawNotification(participant, match, group) {
  const eventDate = group.eventDate?.toDate ? group.eventDate.toDate() : new Date(group.eventDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const emailSubject = `🎁 Secret Santa Draw Results - ${group.groupName}`;

  // Create email HTML content
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .match-box {
          background: white;
          border: 3px solid #667eea;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .match-name {
          font-size: 28px;
          font-weight: bold;
          color: #667eea;
          margin: 10px 0;
        }
        .info-section {
          background: white;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
          border-left: 4px solid #764ba2;
        }
        .footer {
          text-align: center;
          color: #666;
          margin-top: 30px;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        h2 {
          color: #764ba2;
          margin-top: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎁 Secret Santa Draw Complete! 🎄</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${participant.name}</strong>,</p>
        <p>The Secret Santa draw for <strong>${group.groupName}</strong> has been completed!</p>
        
        <div class="match-box">
          <p style="margin: 0 0 10px 0; font-size: 18px;">🎯 Your Secret Santa match is:</p>
          <div class="match-name">${match.name}</div>
        </div>

        <div class="info-section">
          <h2>📅 Event Details</h2>
          <p><strong>Event Date:</strong> ${formattedDate}</p>
          <p><strong>Budget:</strong> $${group.budget}</p>
          <p><strong>Mode:</strong> ${group.mode === 'chaos' ? '🎲 Chaos' : '📋 Standard'}</p>
        </div>

        ${group.welcomeMessage ? `
        <div class="info-section">
          <h2>💬 Message from Organizer</h2>
          <p>${group.welcomeMessage}</p>
        </div>
        ` : ''}

        <p style="margin-top: 30px;">Happy gift giving! 🎉</p>
        
        <div class="footer">
          <p>This email was sent regarding the Secret Santa group: ${group.groupName}</p>
          <p>PrezenTo - Secret Santa Made Easy</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData = {
    from: {
      email: 'noreply@prezento.app', // You may want to configure this
      name: 'PrezenTo'
    },
    to: [
      {
        email: participant.email,
        name: participant.name
      }
    ],
    subject: emailSubject,
    html: emailContent
  };

  try {
    const response = await fetch(MAILERSEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to send email: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send email notifications to all participants after draw
 * @param {Array} participants - Array of participant objects
 * @param {Object} assignments - Object mapping participant emails to their matches
 * @param {Object} group - Group object with all group details
 * @returns {Promise<Array>} - Array of results (success/error for each email)
 */
export async function sendDrawNotificationsToAll(participants, assignments, group) {
  const results = [];

  for (const participant of participants) {
    const match = assignments[participant.email];
    if (!match) {
      results.push({
        participant: participant.email,
        success: false,
        error: 'No match found for participant'
      });
      continue;
    }

    try {
      await sendDrawNotification(participant, match, group);
      results.push({
        participant: participant.email,
        success: true
      });
    } catch (error) {
      results.push({
        participant: participant.email,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}


