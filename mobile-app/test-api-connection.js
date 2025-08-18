// Test API connection from mobile app
const fetch = require('node-fetch');

// Use the same API configuration as the mobile app
const API_BASE_URL = "http://192.168.68.63:5005/api";

async function testAPIConnection() {
  try {
    console.log('🌐 Testing API connection to:', API_BASE_URL);
    
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const healthResponse = await fetch(`http://192.168.68.63:5005/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test 2: API endpoint connectivity
    console.log('\n2. Testing API endpoint...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass'
      })
    });
    
    console.log('📡 Login endpoint response status:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('📡 Login endpoint response:', loginData);
    
    if (loginResponse.status === 400 || loginResponse.status === 401) {
      console.log('✅ API endpoint is reachable (expected auth error)');
    } else {
      console.log('❌ Unexpected response from API endpoint');
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAPIConnection();