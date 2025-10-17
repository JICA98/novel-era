# Google Play Store Data Safety Submission Guide for Novel Era

## Quick Answers for Google Play Console

### 1. Does your app collect or share any of the required user data types?
**Answer: YES**

### 2. Is all of the user data collected by your app encrypted in transit?
**Answer: YES**

### 3. Which of the following methods of account creation does your app support?
**Select these options:**
- ✅ Username and password
- ✅ Username and other authentication  
- ✅ Username, password and other authentication
- ✅ OAuth
- ❌ Other
- ❌ My app does not allow users to create an account

### 4. Delete account URL
**Use this URL:** `https://novel-era.web.app/delete-account.html`

*Note: You'll need to host the `public/delete-account.html` file on your domain*

## Data Types to Declare

### Personal Info
- **Email addresses**: Collected for account creation and authentication
- **User IDs**: Collected for account management

### App Activity  
- **App interactions**: Collected for analytics and app functionality
- **In-app search history**: Collected for app functionality and personalization

### App Info and Performance
- **Crash logs**: Collected for analytics and debugging
- **Other app performance data**: Collected for analytics

## Data Usage Purposes
For each data type, select these purposes:
- **Account management** (for email and user ID)
- **Authentication** (for email and user ID) 
- **App functionality** (for app interactions, search history, performance data)
- **Analytics** (for app interactions, crash logs, performance data)
- **Personalization** (for search history)

## Data Sharing
**Answer: NO** - The app does not share data with third parties

## Data Security
- **Encrypted in transit**: YES
- **Users can request data deletion**: YES
- **Data retention**: Until user requests deletion (except crash logs: 90 days)

## Files Created

1. **`app/privacy/index.tsx`** - Main privacy screen for your app
2. **`app/privacy/web.tsx`** - Standalone web component version  
3. **`app/privacy/_layout.tsx`** - Navigation layout for privacy section
4. **`public/delete-account.html`** - Standalone HTML page for account deletion
5. **`config/data-safety.json`** - Reference file with all data safety information
6. **Updated `app/settings/_layout.tsx`** - Added privacy link to settings

## Implementation Notes

- The privacy screen is accessible via Settings > "Privacy & Data Policy"
- The standalone HTML file can be hosted at your domain for the delete account URL
- The web component can be deployed separately if needed
- All components include proper styling and are mobile-responsive
- Email functionality is built-in for account deletion requests

## Next Steps

1. ✅ **URLs Updated** - All URLs now use your website: `novel-era.web.app`
2. **Deploy Delete Account Page** - Follow `FIREBASE_DEPLOYMENT_GUIDE.md` to host the HTML file
3. **Update Support Email** - Replace `your-support-email@gmail.com` with your actual support email
4. **Fill out Google Play Console** - Use the data safety information provided
5. **Test Privacy Screens** - Navigate to Settings > Privacy & Data Policy in your app
6. **Submit App Update** - You're now compliant with data safety requirements

## Contact Information
All URLs have been updated to use your website: `novel-era.web.app`