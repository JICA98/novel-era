# Release Checklist

## 1. Metadata

- Confirm app name is final: `Atelier`
- Confirm Play title to use: recommended `Atelier: Light Novel Reader`
- Confirm support email
- Confirm public website or leave blank if not used
- Publish privacy policy and add its public URL to Play Console
- Confirm category: `Books & Reference`
- Confirm pricing model
- Confirm whether the app truly has no ads

## 2. Policy and Compliance

- Verify you have rights to distribute, index, or link the supported novel sources surfaced by the app
- Review Play policies for user-generated or third-party content if the app indexes remote catalogs
- Review the Data safety answers in `data-safety.md`
- Review the rating answers in `content-rating.md`
- Make sure store copy does not promise subscriptions, trials, or premium access unless implemented
- Make sure any account deletion obligations are satisfied if remote account data is retained

## 3. Assets

- App icon: already present in project
- Adaptive icon: already present in project
- Feature graphic: create a 1024 x 500 asset
- Phone screenshots: create at least 4
- 7-inch tablet screenshots: optional but recommended if tablet support is claimed
- 10-inch tablet screenshots: optional but recommended if tablet support is claimed

## 4. Technical Readiness

- Run `npm install`
- Run `npm run lint`
- Run your Android smoke test on a production-like build
- Verify Google sign-in works on Android release builds
- Verify email sign-in, sign-up, and sign-out
- Verify search works against each intended production source
- Verify favorites and chapter tracking persist across app restarts
- Verify backup and restore against Firebase Realtime Database
- Verify EPUB export
- Verify PDF export
- Verify TTS controls
- Verify app launch icon, splash, and adaptive icon on device
- Verify upgrade path from internal testing builds if any

## 5. Versioning and Build

- Confirm `expo.version` is correct
- Confirm Android `versionCode` is correct
- Build AAB:

```bash
eas build --platform android --profile production
```

- Submit to internal testing first:

```bash
eas submit --platform android --profile production
```

## 6. Play Console Entry

- Copy the title, short description, and full description from `listing-copy.md`
- Fill app access details if reviewers need credentials
- Add contact details
- Add privacy policy URL
- Upload AAB
- Upload screenshots and feature graphic
- Complete content rating
- Complete Data safety
- Set target audience
- Roll out to internal testing first

## 7. Post-Upload Review

- Install from Play internal testing
- Verify fresh install
- Verify update install
- Verify sign-in on a non-debug build
- Verify crash-free startup
- Verify no broken external links or source fetch failures on first-run
