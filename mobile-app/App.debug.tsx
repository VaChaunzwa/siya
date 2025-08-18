import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from './src/components/ErrorBoundary';
import DebugApp from './src/components/DebugApp';
import { theme } from './src/theme/theme';

// Simple debug version of the app to isolate crash issues
export default function App() {
  console.log('🚀 Debug App starting...');
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <DebugApp />
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}