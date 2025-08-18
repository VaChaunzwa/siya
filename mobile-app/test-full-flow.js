const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://10.0.0.39:5005/api';
const TEST_USER = {
  email: 'hi@artinovasa.com',
  password: 'password123' // You may need to adjust this
};

async function testFullFlow() {
  console.log('=== Testing Full Authentication and Delivery Flow ===\n');
  
  try {
    // Step 1: Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    const { token, user } = loginResponse.data;
    console.log('\nAuthentication successful!');
    console.log('User:', user.email, 'Role:', user.role);
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Step 2: Test authenticated delivery fetch
    console.log('\n2. Testing authenticated delivery fetch...');
    const deliveryResponse = await axios.get(`${API_BASE_URL}/deliveries`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 20,
        page: 1
      }
    });
    
    console.log('Delivery Fetch Status:', deliveryResponse.status);
    console.log('Delivery Response:', JSON.stringify(deliveryResponse.data, null, 2));
    
    if (deliveryResponse.data.success && deliveryResponse.data.data && deliveryResponse.data.data.deliveries) {
      console.log('\n✅ SUCCESS: Deliveries fetched successfully!');
      console.log('Number of deliveries:', deliveryResponse.data.data.deliveries.length);
      
      if (deliveryResponse.data.data.deliveries.length > 0) {
        console.log('Sample delivery:', JSON.stringify(deliveryResponse.data.data.deliveries[0], null, 2));
      }
    } else {
      console.log('\n❌ ISSUE: Deliveries response format unexpected');
      console.log('Expected: response.data.success && response.data.data.deliveries');
      console.log('Actual structure:', Object.keys(deliveryResponse.data));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR in test flow:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testFullFlow();