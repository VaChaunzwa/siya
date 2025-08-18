import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import API_BASE_URL from '../services/apiConfig';

const DebugApp: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testAsyncStorage = async () => {
    try {
      addDebugInfo('Testing AsyncStorage...');
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      if (value === 'test_value') {
        addDebugInfo('✅ AsyncStorage working correctly');
      } else {
        addDebugInfo('❌ AsyncStorage test failed');
      }
      await AsyncStorage.removeItem('test_key');
    } catch (error) {
      addDebugInfo(`❌ AsyncStorage error: ${error}`);
    }
  };

  const testFirebaseConfig = async () => {
    try {
      addDebugInfo('Testing Firebase configuration...');
      if (auth) {
        addDebugInfo('✅ Firebase auth initialized');
        addDebugInfo(`Firebase project: ${auth.app.options.projectId}`);
      } else {
        addDebugInfo('❌ Firebase auth not initialized');
      }
    } catch (error) {
      addDebugInfo(`❌ Firebase error: ${error}`);
    }
  };

  const testAPIConfig = async () => {
    try {
      addDebugInfo('Testing API configuration...');
      addDebugInfo(`API Base URL: ${API_BASE_URL}`);
      
      // Test network connectivity
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        addDebugInfo('✅ Network connectivity working');
      } else {
        addDebugInfo(`❌ Network test failed: ${response.status}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Network error: ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setDebugInfo([]);
    
    addDebugInfo('Starting diagnostic tests...');
    
    await testAsyncStorage();
    await testFirebaseConfig();
    await testAPIConfig();
    
    addDebugInfo('All tests completed!');
    setIsLoading(false);
  };

  const clearLogs = () => {
    setDebugInfo([]);
  };

  const showDeviceInfo = () => {
    addDebugInfo('=== Device Information ===');
    addDebugInfo(`Platform: Android`);
    addDebugInfo(`Timestamp: ${new Date().toISOString()}`);
    addDebugInfo(`API URL: ${API_BASE_URL}`);
  };

  useEffect(() => {
    showDeviceInfo();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Mode</Text>
      <Text style={styles.subtitle}>App Crash Diagnostics</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={runAllTests}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Run Diagnostics
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={clearLogs}
          style={styles.button}
        >
          Clear Logs
        </Button>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.logText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#333',
  },
});

export default DebugApp;