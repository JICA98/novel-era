# Data Safety Worksheet

This worksheet is based on the current repository implementation and should be reviewed before submission.

## Observed Data Handling In Code

Based on the current codebase, the app can collect or process:

- Email address
  - Used for email/password authentication
- User ID
  - Firebase Auth UID used to associate cloud backup data
- Authentication provider
  - Stored in app state to show signed-in method
- User preferences
  - Theme, typography, TTS settings, preferred repository, profile fields
- Optional profile data
  - `displayName`, `tagline`
- Reading progress and favorites
  - Chapter tracker and novel tracker data
- Novel and repository reference data in backup payloads
  - Repo IDs, novel IDs, and supporting novel metadata used to reconstruct trackers
- Device model name
  - Included in backup metadata via `expo-device`

Not verified in Android native behavior:

- Android analytics collection was not verified as active in the Android build path
- Advertising SDKs were not found in the inspected files
- Precise location, contacts, messages, photos, files outside app workflows, payment info, health data, and microphone/camera capture were not observed

## Likely Play Console Answers

These are likely, not guaranteed. Recheck before submission.

### Does the app collect or share any of the required user data types?

Likely answer:

`Yes`

Reason:

- Email sign-in and Google sign-in process account identity data
- Firebase cloud backup stores user-linked settings and reading-tracker data remotely

### Is data encrypted in transit?

Likely answer:

`Yes`

Reason:

- Firebase Auth and Firebase Realtime Database use TLS in transit

### Can users request that their data is deleted?

Current status:

- Not verified from the repository

Recommendation:

- Provide a support email deletion path at minimum
- If possible, add an in-app or web account deletion flow before release

## Candidate Data Type Mapping

### Personal info

- Email address: collected
- User IDs: collected

### App activity

- In-app search terms: not verified as remotely transmitted
- App interactions: local tracking exists; remote analytics not verified on Android

### App info and performance

- Crash logs: not verified
- Diagnostics: not verified

### Other user-generated or user-linked content

- Preferences/profile fields: collected if backup is used
- Reading progress/favorites: collected if backup is used

## Recommended Console Selections

Use these as a draft:

- Data collected: `Email address`, `User IDs`, `App activity or other user-linked content` if you treat reading trackers as user-linked cloud data
- Data shared: likely `No`, unless any third-party SDK shares user data for its own purposes
- Purpose: `App functionality`, `Account management`, possibly `Personalization`
- Collection is optional: `Yes` for cloud backup and optional sign-in, `No` if sign-in becomes mandatory
- Deletion support: do not mark this as fully supported unless you have a real deletion process

## Important Review Notes

- If users can use the app fully without signing in, state that sign-in is optional
- If cloud backup only happens after sign-in and a user action, describe that clearly
- If you later enable analytics, crash reporting, ads, or subscriptions, update this worksheet and the Play Console answers
