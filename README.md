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

## Cloud Backup purchase (Android)

This app gates Cloud Backup/Restore behind a one-time Google Play purchase on Android.

- Product ID: `cloud_backup_lifetime` (configure this in the Play Console under In‑app products > Managed products)
- Module: `react-native-iap@^14`

To test purchases:

1. Set up a Google Play Console app with a closed/internal testing track.
2. Create the managed product `cloud_backup_lifetime` and set it to Active.
3. Add your test account as a license tester and install the internal app build (AAB) via Play.
4. In the app, go to Settings → Account → Backup/Restore; on Android you’ll see a paywall dialog if not purchased.
5. Use “Confirm” to buy; “Restore Purchase” is available if you previously purchased.

Notes:

- Purchases are stored as an entitlement in preferences (`entitlements.cloudBackup`).
- iOS is currently not implemented; the flow is Android‑only.
