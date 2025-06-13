// index.js
const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: '*', // In production, replace with your actual domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Swagger UI setup with CORS headers
app.use('/api-docs', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}, swaggerUi.serve, swaggerUi.setup(specs, {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showCommonExtensions: true
  }
}));

// Import routes
const userRoutes = require('./routes/users/UserRoutes');
const crewRoutes = require('./routes/human-resources/CrewsRoutes');
const crewEmployeesRoutes = require('./routes/human-resources/CrewEmployeesRoutes');
const peopleRoutes = require('./routes/human-resources/PeopleRoutes');
const quadrantSupervisorRoutes = require('./routes/human-resources/QuadrantSupervisorRoutes');
const skillsRoutes = require('./routes/human-resources/SkillsRoutes');
const addressesRoutes = require('./routes/location/AddressesRoutes');
const quadrantsRoutes = require('./routes/location/QuadrantsRoutes');
const ticketAddressesRoutes = require('./routes/location/TicketAddressesRoutes');
const wayfindingRoutes = require('./routes/location/WayfindingRoutes');
const equipmentRoutes = require('./routes/material-equipment/EquipmentRoutes');
const inventoryRoutes = require('./routes/material-equipment/InventoryRoutes');
const suppliersRoutes = require('./routes/material-equipment/SuppliersRoutes');
const usedEquipmentRoutes = require('./routes/material-equipment/UsedEquipmentRoutes');
const usedInventoryRoutes = require('./routes/material-equipment/UsedInventoryRoutes');
const finesRoutes = require('./routes/payments/FinesRoutes');
const invoicesRoutes = require('./routes/payments/InvoicesRoutes');
const paymentsRoutes = require('./routes/payments/PaymentsRoutes');
const diggersRoutes = require('./routes/permissions/DiggersRoutes');
const permitedTicketsRoutes = require('./routes/permissions/PermitedTicketsRoutes');
const permitsRoutes = require('./routes/permissions/PermitsRoutes');
const photoEvidenceRoutes = require('./routes/route/PhotoEvidenceRoutes');
const routesRoutes = require('./routes/route/RoutesRoutes');
const routeTicketsRoutes = require('./routes/route/RouteTicketsRoutes');
const taskStatusRoutes = require('./routes/route/TaskStatusRoutes');
const ticketStatusRoutes = require('./routes/route/TicketStatusRoutes');
const contractUnitsRoutes = require('./routes/ticket-logic/ContractUnitsRoutes');
const contractUnitsPhasesRoutes = require('./routes/ticket-logic/ContractUnitsPhasesRoutes');
const incidentsMxRoutes = require('./routes/ticket-logic/IncidentsMxRoutes');
const necessaryPhasesRoutes = require('./routes/ticket-logic/NecessaryPhasesRoutes');
const ticketsRoutes = require('./routes/ticket-logic/TicketsRoutes');

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// New endpoint to test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ status: 'Database connected', currentTime: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error', err);
    res.status(500).json({ status: 'Database connection failed', error: err.message });
  }
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/crews', crewRoutes);
app.use('/api/crewemployees', crewEmployeesRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/quadrantsupervisors', quadrantSupervisorRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/quadrants', quadrantsRoutes);
app.use('/api/ticketaddresses', ticketAddressesRoutes);
app.use('/api/wayfinding', wayfindingRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/usedequipment', usedEquipmentRoutes);
app.use('/api/usedinventory', usedInventoryRoutes);
app.use('/api/fines', finesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/diggers', diggersRoutes);
app.use('/api/permitedtickets', permitedTicketsRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/photoevidence', photoEvidenceRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/routetickets', routeTicketsRoutes);
app.use('/api/taskstatus', taskStatusRoutes);
app.use('/api/ticketstatus', ticketStatusRoutes);
app.use('/api/contractunits', contractUnitsRoutes);
app.use('/api/contractunitsphases', contractUnitsPhasesRoutes);
app.use('/api/incidentsmx', incidentsMxRoutes);
app.use('/api/necessaryphases', necessaryPhasesRoutes);
app.use('/api/tickets', ticketsRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
