# PrezenTo - Secret Santa App 🎅

A magical Secret Santa web application built with React and Firebase, featuring both Standard and Chaos modes for gift exchanges!

## Features

- **Group Management**: Create and manage Secret Santa groups
- **Two Modes**:
  - **Standard**: Participants immediately know who they're buying for
  - **Chaos**: Participants receive hints based on answers to questions
- **Unique Share Links**: Generate and share unique links for participants
- **Participant Management**: Track who has joined your group
- **Draw System**: Automatic draw that ensures no one gets themselves
- **Results Viewing**: View final results after the event date
- **Santa-themed UI**: Beautiful, festive design with winter vibes

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage for group photos
5. Copy your Firebase config from Project Settings > General > Your apps
6. Update `src/firebase/config.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules

Set up your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      // Allow read for authenticated users and anyone with the join link
      allow read: if request.auth != null || resource.data.status == 'open';
      
      // Allow write for admins
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.adminId;
      
      // Allow participants to add themselves
      allow update: if request.auth == null && 
        request.resource.data.diff(resource.data).unaffectedKeys(resource.data.keys()).hasOnly(['participants']);
    }
  }
}
```

### 4. Storage Security Rules

Set up your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /group-photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Email Notifications (Optional)

To enable email notifications when the draw is performed:

1. Set up Firebase Cloud Functions
2. Install an email service (SendGrid, Mailgun, etc.)
3. Create a Cloud Function that triggers on group updates
4. Send emails when status changes to 'drawn'

You can add this functionality in the `GroupDetails.jsx` file where the `performDraw` function is located.

### 6. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Loading.jsx
│   └── Snowflakes.jsx
├── firebase/           # Firebase configuration
│   └── config.js
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CreateGroup.jsx
│   ├── GroupDetails.jsx
│   ├── JoinGroup.jsx
│   └── Results.jsx
├── App.jsx             # Main app component with routing
├── App.css             # Global styles
└── main.jsx            # Entry point
```

## Usage Flow

1. **Admin**: Log in and create a group
2. **Admin**: Set group details (name, budget, date, mode)
3. **Admin**: Share the unique join link with participants
4. **Participants**: Open the link and join with their name/email
5. **Participants (Chaos mode)**: Answer questions
6. **Admin**: Start the draw when everyone has joined
7. **All**: Receive email notifications (if configured)
8. **Admin**: View results after the event date

## Technologies Used

- React 19
- Firebase (Authentication, Firestore, Storage)
- React Router DOM
- Vite
- CSS3 with custom animations

## Future Enhancements

- Email notifications via Cloud Functions
- Real-time updates using Firestore listeners
- Mobile app version
- Gift ideas sharing
- Wishlist functionality
- Multiple event support per group

## License

MIT License - feel free to use this project for your own Secret Santa exchanges!

---

Made with ❤️ and 🎄 for magical Secret Santa experiences!
