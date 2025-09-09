const fs = require('fs');
const { execSync } = require('child_process');

// Generate self-signed certificate
try {
  execSync('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { cwd: __dirname });
  console.log('SSL certificates generated successfully');
} catch (error) {
  console.error('Error generating SSL certificates:', error.message);
}
