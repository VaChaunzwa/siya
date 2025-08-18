# Siya Portal Mobile App

A cross-platform React Native mobile application for the Siya Portal delivery management system, built with Expo.

## Features

- **Delivery Management**: View, track, and manage deliveries
- **Real-time Status Updates**: Track delivery progress and status
- **Delivery Notes**: Generate and share delivery documentation
- **Cross-platform**: Runs on iOS, Android, and Web
- **Modern UI**: Dark theme with gradient design system
- **Offline Support**: Works with limited connectivity

## Technology Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Expo Linear Gradient** for modern design
- **Vector Icons** for consistent iconography

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

## Installation

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

### Running on Different Platforms

- **iOS Simulator**: `npm run ios`
- **Android Emulator**: `npm run android`
- **Web Browser**: `npm run web`
- **Expo Go App**: Scan QR code with Expo Go app

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   └── DeliveryCard.tsx
├── screens/            # Screen components
│   ├── HomeScreen.tsx
│   ├── DeliveriesScreen.tsx
│   ├── DeliveryDetailScreen.tsx
│   └── DeliveryNoteScreen.tsx
├── theme/              # Design system and theming
│   └── theme.ts
└── types/              # TypeScript type definitions
```

### Key Components

- **HomeScreen**: Main dashboard with navigation cards
- **DeliveriesScreen**: List of all deliveries with filtering
- **DeliveryDetailScreen**: Detailed view of a specific delivery
- **DeliveryNoteScreen**: Delivery documentation and sharing
- **Header**: Reusable header with navigation and profile
- **SearchBar**: Search functionality across screens
- **DeliveryCard**: Individual delivery item display

### Design System

- **Colors**: Dark theme with purple/blue gradients
- **Typography**: System fonts with consistent sizing
- **Spacing**: 8px grid system
- **Elevation**: Material Design elevation levels
- **Status Colors**: Green (delivered), Orange (in-progress), Gray (pending)

## Building for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Backend Integration

The app is designed to integrate with the existing Siya Portal backend:

- API endpoints should be configured in environment variables
- Authentication tokens stored securely
- Offline data synchronization when connectivity is restored

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Test on both iOS and Android platforms
4. Update documentation for new features

## Performance Optimization

- Use FlatList for large data sets
- Implement image caching for better performance
- Lazy load screens and components
- Optimize bundle size with tree shaking

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS build issues**: Clean Xcode build folder
3. **Android build issues**: Clean Gradle cache
4. **Dependency conflicts**: Delete node_modules and reinstall

### Development Tips

- Use Expo Go for quick testing during development
- Enable Fast Refresh for better development experience
- Use Flipper for debugging React Native apps
- Test on real devices for accurate performance metrics

## License

This project is proprietary software for Siya Portal.