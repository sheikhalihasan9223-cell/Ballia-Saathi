## Firebase backend setup

This app now supports Firebase Auth, Cloud Firestore, and Firebase Storage.
If Firebase environment variables are missing, the app falls back to the local demo storage.

### 1. Create the Firebase project

1. Open the Firebase Console.
2. Create a project.
3. Add a Web app.
4. Copy the Firebase config values.

### 2. Add environment variables

Copy `.env.example` to `.env.local` and fill in the values from Firebase:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Restart `npm run dev` after changing `.env.local`.

### 3. Enable Firebase products

In Firebase Console:

1. Authentication: enable Email/Password.
2. Authentication: enable Google if you want Google login.
3. Firestore Database: create a database.
4. Storage: create a storage bucket.

### 4. Add local domain

In Authentication settings, add this authorized domain:

```text
127.0.0.1
```

Firebase usually includes `localhost` automatically, but this app is currently served from `127.0.0.1`.

### 5. Security rules

Use `firestore.rules` for Firestore and `storage.rules` for Storage.

### 6. Collections used by the app

The app stores records in these Firestore collections:

```text
user
product
banner
coupon
order
address
wishlist
supportTicket
riderLocation
```
