const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTicketsReadyEndpoints() {
  console.log('🧪 Testing Tickets Ready for Route Optimization Endpoints\n');

  const endpoints = [
    '/routes/tickets-ready/spotting',
    '/routes/tickets-ready/concrete',
    '/routes/tickets-ready/asphalt'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Count: ${response.data.count}`);
      console.log(`🏷️  Type: ${response.data.type}`);
      console.log(`📋 Criteria: ${response.data.criteria}`);
      
      if (response.data.tickets && response.data.tickets.length > 0) {
        console.log(`🎫 Tickets with addresses: ${response.data.tickets.length}`);
        const firstTicket = response.data.tickets[0];
        console.log(`📍 First ticket address: ${firstTicket.address}`);
        console.log(`🔢 Ticket ID: ${firstTicket.ticketId}`);
        console.log(`🏷️  Ticket Code: ${firstTicket.ticketCode}`);
        console.log(`💰 Amount: $${firstTicket.amountToPay}`);
      } else {
        console.log(`⚠️  No tickets found for this type`);
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
testTicketsReadyEndpoints().catch(console.error); 