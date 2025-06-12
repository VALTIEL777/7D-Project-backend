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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: [
    './routes/users/*.js',
    './routes/human-resources/*.js',
    './routes/location/*.js',
    './routes/material-equipment/*.js',
    './routes/payments/*.js',
    './routes/permissions/*.js',
    './routes/route/*.js',
    './routes/ticket-logic/*.js',
    // Add more paths for other route files as needed
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs; 