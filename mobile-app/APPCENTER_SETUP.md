# Microsoft App Center Setup Guide

This guide will help you set up Microsoft App Center for your React Native mobile app.

## Prerequisites

1. Microsoft App Center account (free at https://appcenter.ms)
2. Your React Native project (already configured)
3. App Center CLI (optional but recommended)

## Step 1: Create Apps in App Center

1. Go to https://appcenter.ms and sign in
2. Click "Add new app"
3. Create two apps:
   - **Android App**: 
     - App name: `Siya Portal Mobile Android`
     - OS: `Android`
     - Platform: `React Native`
   - **iOS App**: 
     - App name: `Siya Portal Mobile iOS`
     - OS: `iOS`
     - Platform: `React Native`

## Step 2: Get App Secrets

After creating the apps:
1. Go to each app's Settings > App secrets
2. Copy the App Secret for each platform
3. Update the secrets in your code:

### Option A: Update App.tsx directly
Replace the placeholders in `App.tsx`:
```typescript
AppCenter.start({
  appSecret: {
    android: "YOUR_ACTUAL_ANDROID_APP_SECRET",
    ios: "YOUR_ACTUAL_IOS_APP_SECRET"
  },
  services: [Analytics, Crashes]
});
```

### Option B: Use appcenter-config.json (Recommended)
Update `appcenter-config.json` with your actual secrets:
```json
{
  "android": {
    "app_secret": "YOUR_ACTUAL_ANDROID_APP_SECRET"
  },
  "ios": {
    "app_secret": "YOUR_ACTUAL_IOS_APP_SECRET"
  }
}
```

## Step 3: Configure Build Settings

### For Android:
1. In App Center, go to your Android app
2. Click "Build" in the left sidebar
3. Connect your repository (GitHub, Azure DevOps, Bitbucket)
4. Select the branch you want to build
5. Configure build settings:
   - **Project**: `mobile-app/android`
   - **Module**: `app`
   - **Variant**: `release` (for production) or `debug` (for testing)
   - **Build frequency**: Choose based on your needs

### For iOS:
1. In App Center, go to your iOS app
2. Click "Build" in the left sidebar
3. Connect your repository
4. Select the branch you want to build
5. Configure build settings:
   - **Project**: `mobile-app/ios`
   - **Scheme**: `SiyaPortalMobile`
   - **Xcode version**: Latest stable
   - **Build frequency**: Choose based on your needs

## Step 4: Set Up Code Signing (iOS)

For iOS builds, you'll need:
1. Apple Developer account
2. Provisioning profiles
3. Certificates

Upload these in App Center under Build > Configure > Code signing

## Step 5: Set Up Distribution

1. Go to "Distribute" in App Center
2. Create distribution groups:
   - **Internal Testers**: Your development team
   - **Beta Testers**: External beta testers
   - **Production**: For store releases

## Step 6: Configure Analytics and Crash Reporting

The SDK is already configured in your app. You can:

### Track Custom Events:
```typescript
import Analytics from 'appcenter-analytics';

// Track a custom event
Analytics.trackEvent('User Login', { method: 'email' });
```

### Handle Crashes:
```typescript
import Crashes from 'appcenter-crashes';

// Check if app crashed in last session
Crashes.hasCrashedInLastSession().then((hasCrashed) => {
  if (hasCrashed) {
    // Handle crash scenario
  }
});
```

## Step 7: Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env` file in mobile-app directory:
```
APPCENTER_ANDROID_SECRET=your_android_secret
APPCENTER_IOS_SECRET=your_ios_secret
```

2. Install react-native-config:
```bash
npm install react-native-config
```

3. Update App.tsx to use environment variables

## Step 8: Build Scripts (Optional)

The `appcenter-post-build.sh` script is already created. You can customize it to:
- Run additional tests
- Upload source maps
- Send notifications
- Custom deployment steps

## Useful App Center CLI Commands

Install App Center CLI:
```bash
npm install -g appcenter-cli
```

Login:
```bash
appcenter login
```

List your apps:
```bash
appcenter apps list
```

Start a build:
```bash
appcenter build queue --app your-org/your-app --branch main
```

## Troubleshooting

### Common Issues:

1. **Build fails**: Check your build configuration and ensure all dependencies are properly installed
2. **Code signing issues (iOS)**: Verify your certificates and provisioning profiles
3. **Analytics not working**: Ensure App Center is properly initialized before tracking events
4. **Crashes not reported**: Check that the app secret is correct and the app is properly configured

### Support:
- App Center Documentation: https://docs.microsoft.com/en-us/appcenter/
- Community Support: https://github.com/Microsoft/appcenter

## Next Steps

1. Replace placeholder app secrets with actual values
2. Test the build process
3. Set up distribution groups
4. Configure notifications
5. Integrate with your CI/CD pipeline

Your React Native app is now ready for Microsoft App Center! 🚀