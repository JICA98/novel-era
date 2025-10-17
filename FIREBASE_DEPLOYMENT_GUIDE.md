# Firebase Hosting Deployment Guide

## Setup Firebase Hosting for Privacy Pages

Since your website is hosted at `https://novel-era.web.app/`, you can deploy the delete account page to Firebase Hosting.

### 1. Initialize Firebase Hosting (if not already done)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init hosting
```

### 2. Configure Firebase Hosting

Create or update `firebase.json` in your project root:

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/privacy-policy",
        "destination": "/privacy-policy.html"
      },
      {
        "source": "/delete-account",
        "destination": "/delete-account.html"
      }
    ]
  }
}
```

### 3. Create Privacy Policy Page

Create `public/privacy-policy.html` with your full privacy policy content (you may already have this).

### 4. Deploy to Firebase

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 5. Verify URLs

After deployment, these URLs should work:
- `https://novel-era.web.app/delete-account.html` - Direct HTML access
- `https://novel-era.web.app/delete-account` - Clean URL (via rewrite)
- `https://novel-era.web.app/privacy-policy` - Privacy policy page

### 6. Update Google Play Store

In Google Play Console, use this URL for the delete account link:
```
https://novel-era.web.app/delete-account
```

### 7. Update Support Email

Don't forget to replace `your-support-email@gmail.com` in all files with your actual support email address.

### Files to Update:
- `app/privacy/index.tsx`
- `app/privacy/web.tsx`  
- `public/delete-account.html`
- `config/data-safety.json`

### Quick Replace Command:
You can use find and replace in your IDE to replace all instances of:
- Find: `your-support-email@gmail.com`
- Replace: `your-actual-email@gmail.com`