const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '7D-Project-backend API Documentation',
      version: '1.0.0',
      description: 'API documentation for the 7D-Project-backend application.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://7d-compass.christba.com/',
        description: 'Live server',
      }
    ],
  },
  apis: [
    './src/routes/users/*.js',
    './src/routes/human-resources/*.js',
    './src/routes/location/*.js',
    './src/routes/material-equipment/*.js',
    './src/routes/payments/*.js',
    './src/routes/permissions/*.js',
    './src/routes/route/*.js',
    './src/routes/ticket-logic/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs; 