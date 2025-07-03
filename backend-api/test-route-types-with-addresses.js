const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testRouteTypeEndpoints() {
  console.log('🧪 Testing Route Type Endpoints with Ticket Addresses\n');

  const endpoints = [
    '/routes/spotting',
    '/routes/concrete', 
    '/routes/asphalt',
    '/routes/type/SPOTTER',
    '/routes/type/CONCRETE',
    '/routes/type/ASPHALT'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Count: ${response.data.count}`);
      
      if (response.data.routes && response.data.routes.length > 0) {
        const firstRoute = response.data.routes[0];
        console.log(`🔍 First Route ID: ${firstRoute.routeId}`);
        console.log(`🏷️  Route Type: ${firstRoute.type}`);
        
        if (firstRoute.tickets && firstRoute.tickets.length > 0) {
          console.log(`🎫 Tickets with addresses: ${firstRoute.tickets.length}`);
          const firstTicket = firstRoute.tickets[0];
          console.log(`📍 First ticket address: ${firstTicket.address}`);
          console.log(`🔢 Queue position: ${firstTicket.queue}`);
        } else {
          console.log(`⚠️  No tickets found for this route`);
        }
      } else {
        console.log(`⚠️  No routes found for this type`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}:`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message || error.response.data.error}`);
      } else {
        console.log(`   ${error.message}`);
      }
      console.log('---\n');
    }
  }
}

// Run the test
testRouteTypeEndpoints().catch(console.error); 