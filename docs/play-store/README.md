# Play Store Listing Pack

This folder contains the materials needed to prepare `Atelier` for a Google Play listing.

Core app metadata verified from the codebase:

- App name: `Atelier`
- Package name: `com.zenithblue.ateliernovels`
- Version: `1.0.0`
- Android version code: `1`
- Build output: Android App Bundle via `eas build --platform android --profile production`

Included files:

- `listing-copy.md`: Play Store title, short description, full description, category, and promotional copy
- `submission-metadata.json`: structured listing metadata for quick copy/reference
- `release-checklist.md`: release and submission checklist
- `data-safety.md`: Play Console Data safety worksheet based on the current implementation
- `privacy-policy.md`: public-facing privacy policy draft you can publish
- `content-rating.md`: guidance for the content rating questionnaire
- `assets-checklist.md`: screenshot, icon, and feature graphic requirements

Manual items still required before submission:

- Replace placeholder contact details in `privacy-policy.md` and `submission-metadata.json`
- Publish `privacy-policy.md` at a public URL
- Capture final Play Store screenshots from the production build
- Create a 1024 x 500 feature graphic
- Review whether the app includes copyrighted third-party novel sources and confirm distribution rights
- Do not claim subscriptions, trials, or premium access in the store listing unless Play Billing is actually implemented and active
