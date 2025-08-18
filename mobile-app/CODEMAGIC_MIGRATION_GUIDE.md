# Codemagic Migration Guide

This guide will help you migrate from Microsoft App Center to Codemagic for building your React Native mobile app.

## 🚀 Quick Setup Steps

### 1. Create Codemagic Account
1. Go to [codemagic.io](https://codemagic.io)
2. Sign up with your GitHub/GitLab/Bitbucket account
3. Connect your repository

### 2. Configure Repository
1. Add the `codemagic.yaml` file to your repository root (already created)
2. Commit and push the configuration file
3. Codemagic will automatically detect the configuration

### 3. Environment Variables Setup

In Codemagic dashboard, go to your app settings and add these environment variables:

#### Android Signing (Required for release builds)
```
CM_KEYSTORE: <base64-encoded-keystore-file>
CM_KEYSTORE_PASSWORD: <your-keystore-password>
CM_KEY_ALIAS: <your-key-alias>
CM_KEY_PASSWORD: <your-key-password>
```

#### Google Play Publishing (Optional)
```
GCLOUD_SERVICE_ACCOUNT_CREDENTIALS: <google-service-account-json>
GOOGLE_PLAY_TRACK: internal
```

#### iOS Signing (For iOS builds)
- Configure iOS signing certificates in Codemagic dashboard
- Add provisioning profiles
- Set bundle identifier: `com.siya.portal.mobile`

### 4. Update Project Configuration

#### Update package.json scripts
Add these scripts to your `mobile-app/package.json`:

```json
{
  "scripts": {
    "android:release": "npx expo run:android --variant release",
    "ios:release": "npx expo run:ios --configuration Release",
    "web:build": "npx expo export:web",
    "test:ci": "npm test -- --coverage --watchAll=false"
  }
}
```

#### Update app.json for proper configuration
Ensure your `app.json` has correct settings:

```json
{
  "expo": {
    "name": "Siya Portal Mobile",
    "slug": "siya-portal-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.siya.portal.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.siya.portal.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## 🔧 Fixing Common Build Issues

### Issue 1: OneDrive Sync Problems
**Problem**: Files in OneDrive can cause build failures due to sync conflicts.

**Solution**: Move your project to a non-synced directory:
```bash
# Move project out of OneDrive
mkdir C:\Projects
move "C:\Users\Herbert\OneDrive\Apps\Siya\siya-portal" "C:\Projects\siya-portal"
```

### Issue 2: Node.js Environment Issues
**Problem**: Corrupted Node.js installation causing build failures.

**Solution**: Clean reinstall Node.js:
1. Uninstall Node.js from Control Panel
2. Delete these folders:
   - `C:\Users\Herbert\AppData\Roaming\npm`
   - `C:\Users\Herbert\AppData\Roaming\npm-cache`
3. Download and install latest LTS Node.js from [nodejs.org](https://nodejs.org)
4. Reinstall dependencies:
   ```bash
   cd C:\Projects\siya-portal\mobile-app
   npm install
   ```

### Issue 3: Dependency Conflicts
**Problem**: Peer dependency conflicts preventing builds.

**Solution**: Use legacy peer deps:
```bash
npm install --legacy-peer-deps
```

### Issue 4: Android Build Issues
**Problem**: Missing Android SDK or build tools.

**Solution**: Codemagic handles this automatically, but ensure your `codemagic.yaml` has:
```yaml
environment:
  android_signing:
    - keystore_reference
  node: 18.17.0
  npm: 9
  ndk: r25b
  java: 11
```

## 📱 Platform-Specific Configuration

### Android Configuration
1. **Keystore Setup**: Upload your keystore file to Codemagic
2. **Package Name**: Ensure `com.siya.portal.mobile` is consistent
3. **Gradle Configuration**: Codemagic will handle gradle builds automatically

### iOS Configuration
1. **Bundle Identifier**: Set to `com.siya.portal.mobile`
2. **Certificates**: Upload iOS distribution certificates
3. **Provisioning Profiles**: Add App Store provisioning profiles
4. **App Store Connect**: Configure for TestFlight/App Store publishing

### Web Configuration
1. **Build Output**: Exports to `dist/` directory
2. **Deployment**: Can be deployed to various hosting services
3. **Environment**: Uses Linux instance for faster builds

## 🚀 Triggering Builds

### Automatic Triggers
Builds will automatically trigger on:
- Push to `main` or `develop` branches
- Pull requests
- Git tags

### Manual Triggers
1. Go to Codemagic dashboard
2. Select your app
3. Click "Start new build"
4. Choose workflow and branch

## 📊 Monitoring Builds

### Build Logs
- Real-time build logs in Codemagic dashboard
- Download logs for debugging
- Email notifications on success/failure

### Artifacts
- APK files for Android
- IPA files for iOS
- Web build files
- Test coverage reports

## 🔄 Migration from App Center

### Remove App Center Dependencies
1. Remove App Center packages:
   ```bash
   npm uninstall appcenter appcenter-analytics appcenter-crashes
   ```

2. Remove App Center imports from your code:
   ```typescript
   // Remove these lines from App.tsx
   import AppCenter from 'appcenter';
   import Analytics from 'appcenter-analytics';
   import Crashes from 'appcenter-crashes';
   ```

3. Delete App Center configuration files:
   - `appcenter-config.json`
   - `appcenter-post-build.sh`
   - `APPCENTER_SETUP.md`

### Alternative Analytics (Optional)
If you need analytics, consider:
- Firebase Analytics
- Google Analytics
- Amplitude
- Mixpanel

## 🛠️ Troubleshooting

### Build Fails with "Unknown Error"
1. Check build logs in Codemagic dashboard
2. Verify environment variables are set correctly
3. Ensure `codemagic.yaml` syntax is valid
4. Check if all dependencies are properly installed

### Android Signing Issues
1. Verify keystore file is uploaded correctly
2. Check keystore password and alias
3. Ensure package name matches in all configurations

### iOS Build Issues
1. Verify certificates are valid and not expired
2. Check provisioning profiles match bundle identifier
3. Ensure Xcode version compatibility

### Dependency Issues
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and reinstall
3. Use `--legacy-peer-deps` flag if needed

## 📞 Support

- **Codemagic Documentation**: [docs.codemagic.io](https://docs.codemagic.io)
- **Codemagic Support**: Available in dashboard
- **Community**: Codemagic Slack community

## ✅ Post-Migration Checklist

- [ ] Codemagic account created and repository connected
- [ ] `codemagic.yaml` file committed to repository
- [ ] Environment variables configured in Codemagic dashboard
- [ ] Android keystore uploaded and configured
- [ ] iOS certificates and provisioning profiles configured
- [ ] Test build triggered successfully
- [ ] App Center dependencies removed from project
- [ ] Build artifacts generated correctly
- [ ] Email notifications configured
- [ ] Publishing to stores configured (optional)

---

**Note**: After migration, your first few builds might take longer as Codemagic sets up the environment. Subsequent builds will be faster due to caching.