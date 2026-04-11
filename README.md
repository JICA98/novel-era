# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## First release checklist (Atelier)

1. Install dependencies and sign in to Expo/EAS.

```bash
npm install
eas whoami || eas login
```

2. Verify release metadata.

- App name: `Atelier`
- Android package: `com.zenithblue.ateliernovels`
- iOS bundle ID: `com.zenithblue.ateliernovels`
- Version: `1.0.0`
- Android `versionCode`: `1`
- iOS `buildNumber`: `1`

3. Build store binaries.

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

4. Submit builds.

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

5. Store rollout recommendations.

- Google Play: upload to internal testing first, validate install/update/in-app auth, then promote.
- App Store Connect: use TestFlight for smoke testing before App Review submission.

6. For next release, bump app version and build numbers.

- Set `expo.version` to next semantic version (for example `1.0.1`).
- Keep `production.autoIncrement` in `eas.json` enabled to auto-bump native versions on cloud builds.
