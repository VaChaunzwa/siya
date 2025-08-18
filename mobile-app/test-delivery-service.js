// Test the mobile app's delivery service directly
const deliveryService = require('./src/services/deliveryService.ts');
const authService = require('./src/services/authService.ts');

async function testDeliveryService() {
  console.log('=== Testing Mobile App Delivery Service ===\n');
  
  try {
    // First, simulate login
    console.log('1. Simulating login...');
    
    // Mock the auth service for testing
    const mockUser = {
      id: '0ZH5T7Y1C4O9GGDWQ2GjGqH1c2i2',
      email: 'hi@artinovasa.com',
      role: 'admin',
      tenantId: 'dbff0cfe-07e8-4d9e-8ae2-5a431d2c6be1'
    };
    
    const mockToken = 'a33b1975e2affe5ce3fd84e39661f8d86fff28d66752c32549c9371d8def5c03';
    
    // Mock authService methods
    authService.default.getCurrentUser = () => Promise.resolve(mockUser);
    authService.default.getAuthToken = () => mockToken;
    authService.default.isDriver = () => false;
    authService.default.isClient = () => false;
    
    console.log('Mock user set:', mockUser.email, 'Role:', mockUser.role);
    
    // Test delivery fetching
    console.log('\n2. Testing delivery service...');
    const result = await deliveryService.default.getDeliveriesForCurrentUser({ limit: 20, page: 1 });
    
    console.log('\n✅ SUCCESS: Delivery service working!');
    console.log('Deliveries fetched:', result.deliveries.length);
    console.log('Pagination:', result.pagination);
    
    if (result.deliveries.length > 0) {
      console.log('\nSample delivery:');
      console.log('- ID:', result.deliveries[0].id);
      console.log('- Code:', result.deliveries[0].code || result.deliveries[0].deliveryNumber);
      console.log('- Status:', result.deliveries[0].status);
      console.log('- Client:', result.deliveries[0].clientName);
      console.log('- Driver:', result.deliveries[0].driverName);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR in delivery service test:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDeliveryService();