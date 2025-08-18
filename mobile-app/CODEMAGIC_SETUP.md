# Codemagic Setup Guide for Siya Portal Mobile App

This guide will help you set up Codemagic CI/CD for your React Native Expo app.

## Prerequisites

1. **Codemagic Account**: Sign up at [codemagic.io](https://codemagic.io)
2. **Repository Access**: Connect your GitHub/GitLab/Bitbucket repository
3. **App Store Connect API Key** (for iOS builds)
4. **Google Play Console Service Account** (for Android builds)

## Configuration Files

### 1. codemagic.yaml
The main configuration file is already set up in your project root. It includes:
- **Android workflow**: Builds APK/AAB for Google Play
- **iOS workflow**: Builds IPA for App Store
- **Web workflow**: Builds web version using Expo

### 2. .easignore
Optimizes build times by excluding unnecessary files from the build archive.

## Environment Variables Setup

### Android Build Variables
In Codemagic dashboard, add these environment variables:

```bash
# Android Signing
CM_KEYSTORE=<base64_encoded_keystore_file>
CM_KEY_ALIAS=<your_key_alias>
CM_KEYSTORE_PASSWORD=<keystore_password>
CM_KEY_PASSWORD=<key_password>

# Google Play Publishing
GCLOUD_SERVICE_ACCOUNT_CREDENTIALS=<google_play_service_account_json>
GOOGLE_PLAY_TRACK=internal  # or alpha, beta, production
PACKAGE_NAME=com.siya.portal.mobile
```

### iOS Build Variables
```bash
# App Store Connect
APP_ID=<your_app_store_app_id>
BUNDLE_ID=com.siya.portal.mobile
XCODE_WORKSPACE=SiyaPortalMobile.xcworkspace
XCODE_SCHEME=SiyaPortalMobile
```

## Setting Up Android Signing

### 1. Generate Upload Key
```bash
keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Convert to Base64
```bash
base64 my-upload-key.keystore > keystore_base64.txt
```

### 3. Add to Codemagic
- Copy the base64 content
- Add as `CM_KEYSTORE` environment variable in Codemagic

## Setting Up iOS Signing

### 1. App Store Connect API Key
1. Go to App Store Connect > Users and Access > Keys
2. Create a new API key with Developer role
3. Download the .p8 file
4. Add the key to Codemagic integrations

### 2. Provisioning Profiles
Codemagic will automatically manage provisioning profiles when you:
1. Add your Apple Developer account
2. Configure iOS signing in the workflow

## Google Play Console Setup

### 1. Create Service Account
1. Go to Google Cloud Console
2. Create a new service account
3. Download the JSON key file
4. Grant necessary permissions in Google Play Console

### 2. Add to Codemagic
- Upload the JSON file content as `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`

## Workflow Triggers

The workflows are configured to trigger on:
- **Push** to `main` or `develop` branches
- **Pull requests** to these branches
- **Tags** (for release builds)

## Build Profiles

The configuration uses EAS build profiles:
- **Development**: For testing
- **Production**: For app store releases

## Customization

### Update Email Notifications
Replace `herbert.chaunzwa@example.com` with your actual email in:
- Android workflow
- iOS workflow
- Web workflow

### Modify Build Settings
Edit `codemagic.yaml` to:
- Change build duration limits
- Modify instance types
- Add custom scripts
- Configure different publishing options

## Troubleshooting

### Common Issues

1. **Kotlin compilation errors in expo-autolinking-settings-plugin**
   - This is usually caused by version incompatibilities
   - The project has been configured with:
     - Android Gradle Plugin: 8.2.1
     - Kotlin: 1.9.10
     - Gradle: 8.4
   - A Gradle clean step has been added to the build process

2. **Build fails with "No matching client found for environment-url"**
   - Ensure your App Store Connect integration is properly configured
   - Check that your bundle identifier matches in all configuration files

3. **Android build fails with signing errors**
   - Verify your keystore is properly uploaded to Codemagic
   - Check that all signing environment variables are set correctly

4. **iOS build fails with provisioning profile errors**
   - Ensure your certificates and provisioning profiles are valid
   - Check that your bundle identifier matches your provisioning profile

5. **Build times are too long**
   - Consider using a more powerful instance type
   - Optimize your dependencies and build scripts
   - Use caching strategies for node_modules and CocoaPods

6. **EAS build profile issues**
   - Use `debug` profile for debug builds
   - Use `production` profile for release builds
   - Both profiles are configured to output APK files for easier artifact collection

7. **Build Timeout**: Increase `max_build_duration` in workflow
8. **Dependency Issues**: Use `npm ci --legacy-peer-deps`
9. **Archive Size**: Ensure `.easignore` is properly configured

### Debug Steps
1. Check build logs in Codemagic dashboard
2. Verify environment variables are set correctly
3. Test builds locally using `eas build --local`
4. Check EAS configuration with `eas build:configure`

## Next Steps

1. **Connect Repository**: Link your Git repository to Codemagic
2. **Configure Variables**: Add all required environment variables
3. **Test Build**: Run a test build to verify configuration
4. **Set Up Publishing**: Configure automatic publishing to stores
5. **Monitor Builds**: Set up notifications and monitoring

## Useful Commands

```bash
# Test local build
eas build --platform android --profile production --local
eas build --platform ios --profile production --local

# Check configuration
eas build:configure

# View build status
eas build:list
```

## Support

- [Codemagic Documentation](https://docs.codemagic.io/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)