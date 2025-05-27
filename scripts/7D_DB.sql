-- Payments module
CREATE TABLE Payments (
    checkId SERIAL PRIMARY KEY,
    paymentNumber VARCHAR(128),
    datePaid DATE,
    amountPaid DECIMAL,
    status VARCHAR(128),
    paymentURL TEXT
);

CREATE TABLE Invoices (
    invoiceId SERIAL PRIMARY KEY,
    ticketId INTEGER REFERENCES Tickets(ticketId),
    invoiceNumber VARCHAR(128),
    invoiceDateRequested DATE,
    amountRequested DECIMAL,
    status VARCHAR(128)
    invoiceURL TEXT
);

CREATE TABLE Fines (
    fineId SERIAL PRIMARY KEY,
    ticketId INTEGER REFERENCES Tickets(ticketId),
    fineNumber VARCHAR(128),
    fineDate DATE,
    paymentDate DATE,
    amount DECIMAL,
    status VARCHAR(128),
    fineURL TEXT
);
-------------------------------------------------------------
--Permissions module
CREATE TABLE Permits (
    PermitId SERIAL PRIMARY KEY,
    permitNumber VARCHAR(128),
    status BOOLEAN,
    startDate DATE,
    expireDate DATE,
);

CREATE TABLE PermitedTickets (
    permitId INTEGER REFERENCES Permits(PermitId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    PRIMARY KEY (permitId, ticketId)
);

CREATE TABLE Diggers (
    diggerId SERIAL PRIMARY KEY,
    permitId INTEGER REFERENCES Permits(PermitId),
    diggerNumber VARCHAR(128),
    status BOOLEAN,
    startDate DATE,
    expireDate DATE,
    watch&Protect BOOLEAN
);
------------------------------------------------------------
-- Human Resources module
CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    username VARCHAR(128),
    email VARCHAR(128),
    password VARCHAR(32)
);

CREATE TABLE Employees (
    employeeId SERIAL PRIMARY KEY,
    UserId INTEGER REFERENCES Users(UserId),
    firstname VARCHAR(45),
    lastname VARCHAR(45),
    role VARCHAR(128),
    phone VARCHAR(10),
);

CREATE TABLE Skills (
    skillId SERIAL PRIMARY KEY,
    name VARCHAR(128),
    description TEXT
);

CREATE TABLE EmployeeSkills (
    employeeId INTEGER REFERENCES Employees(employeeId),
    skillId INTEGER REFERENCES Skills(skillId),
    PRIMARY KEY (employeeId, skillId),
    proficiencyLevel INTEGER CHECK (proficiencyLevel >= 1 AND proficiencyLevel <= 5)
);

CREATE TABLE PeopleGasSupervisors (
    supervisorId SERIAL PRIMARY KEY,
    name VARCHAR(128),
    phone VARCHAR(10),
    email VARCHAR(128),
    role VARCHAR(128) -- supervisor, zoneManager
);

CREATE TABLE Crews (
    crewId SERIAL PRIMARY KEY,
    type VARCHAR(30),
    photo VARCHAR(255),
    workedHours DECIMAL
);

CREATE TABLE CrewEmployees (
    crewId INTEGER REFERENCES Crews(crewId),
    employeeId INTEGER REFERENCES Employees(employeeId),
    crewLeader BOOLEAN,
    PRIMARY KEY (crewId, employeeId)
);
------------------------------------------------------------
-- Quadrants module
CREATE TABLE Quadrants (
    quadrantId SERIAL PRIMARY KEY,
    supervisorId INTEGER REFERENCES PeopleGasSupervisors(supervisorId),
    revisorId INTEGER REFERENCES PeopleGasSupervisors(supervisorId),
    name VARCHAR(64),
    shop VARCHAR(64),
    minLatitude VARCHAR(64),
    maxLatitude VARCHAR(64),
    minLongitude VARCHAR(64),
    maxLongitude VARCHAR(64)
);

-- Relación Cuadrante Supervisor
CREATE TABLE QuadrantSupervisor (
    supervisorId INTEGER REFERENCES PeopleGasSupervisors(supervisorId),
    quadrantId INTEGER REFERENCES Quadrants(quadrantId),
    PRIMARY KEY (supervisorId, quadrantId)
);

CREATE TABLE Addresses (
    addressId SERIAL PRIMARY KEY,
    addressNumber VARCHAR(64),
    addressCardinal CHAR(1),
    addressStreet VARCHAR(64),
    addressSuffix VARCHAR(64)
);

CREATE TABLE wayfinding(
    wayfindingId SERIAL PRIMARY KEY,
    streetFrom VARCHAR(64),
    streetTo VARCHAR(64),
    location VARCHAR(64),
    addressCardinal CHAR(1),
    addressStreet VARCHAR(64),
    addressSuffix VARCHAR(64),
    width DOUBLE PRECISION(10,2),
    length DOUBLE PRECISION(10,2),
    surfaceTotal DOUBLE PRECISION(10,2),

);
-----------------------------------------------------------------
--Tickets module
CREATE TABLE NecessaryPhases (
    necessaryPhaseId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    description TEXT
);

CREATE TABLE ContractUnits (
    contractUnitId SERIAL PRIMARY KEY,
    neededMobilization INTEGER REFERENCES ContractUnits (contractUnitId) NULLABLE,
    neededContractUnit INTEGER REFERENCES ContractUnits (contractUnitId) NULLABLE,
    itemCode VARCHAR(255),
    name VARCHAR(128),
    unit VARCHAR(64),
    description TEXT,
    workNotIncluded TEXT,
    CDOTStandardImg TEXT,
    CostPerUnit DOUBLE PRECISION,
    zone VARCHAR(64),
    PaymentClause TEXT
);

CREATE TABLE ContractUnitsPhases (
    contractUnitId INTEGER REFERENCES ContractUnits (contractUnitId),
    necessaryPhaseId INTEGER REFERENCES NecessaryPhases (necessaryPhaseId),
    PRIMARY KEY (contractUnitId, necessaryPhaseId)
);

CREATE TABLE IncidentsMx (
    incidentId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    EarliestRptDate DATE
);


CREATE TABLE Tickets (
    ticketId SERIAL PRIMARY KEY,
    incidentId INTEGER REFERENCES IncidentsMx(incidentId),
    cuadranteId INTEGER REFERENCES Quadrants(quadrantId),
    contractUnitId INTEGER REFERENCES ContractUnits(contractUnitId),
    wayfindingId INTEGER REFERENCES wayfinding(wayfindingId) NULLABLE,
    paymentId INTEGER REFERENCES Payments(paymentId),
    mobilizationId INTEGER REFERENCES Tickets(ticketId) NULLABLE,
    ticketCode VARCHAR(64),
    quantity INTEGER,
    daysOutstanding INTEGER,
    7dComment VARCHAR(255),
    PeopleGasComment VARCHAR(255),
    contractNumber VARCHAR(128),
    amountToPay DECIMAL,
    ticketType VARCHAR(64), -- mobilization, regular
);

-----------------------------------------------------------------------
--Routes module
CREATE TABLE Routes (
    routeId SERIAL PRIMARY KEY,
    routeCode VARCHAR(64),
    type VARCHAR(64), -- concrete, asphalt
    startDate DATE,
    endDate DATE,
);

Create Table RouteTickets(
    routeId INTEGER REFERENCES Routes(routeId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    PRIMARY KEY (routeId, ticketId),
    queue INTEGER
);

CREATE TABLE TaskStatus(
    taskStatusId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    description TEXT
);

CREATE TABLE TicketStatus(
    taskStatusId INTEGER REFERENCES TaskStatus(taskStatusId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    PRIMARY KEY (taskStatusId, ticketId),
    startingDate DATE,
    endingDate DATE,
    observation TEXT
);

CREATE TABLE photoEvidence(
    photoId SERIAL PRIMARY KEY,
    ticketStatusId INTEGER REFERENCES TicketStatus(ticketStatusId),
    name VARCHAR(64),
    latitude DOUBLE PRECISION(10,2),
    longitude DOUBLE PRECISION(10,2),
    photo VARCHAR(255),
    date TIMESTAMP,
    comment TEXT,
    photoURL TEXT,
    address VARCHAR(255),
);
----------------------------------------------------------------
--Material & Equipment module

CREATE TABLE Suppliers (
    supplierId SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(10),
    email VARCHAR(128),
    address VARCHAR(255)
);

CREATE TABLE Inventory (
    inventoryId SERIAL PRIMARY KEY,
    supplierId INTEGER REFERENCES Suppliers(supplierId),
    name VARCHAR(255),
    costPerUnit DECIMAL,
    unit VARCHAR(255)
);

CREATE TABLE Equipment(
    equipmentId SERIAL PRIMARY KEY,
    equipmentName VARCHAR(255),
    owner VARCHAR(255),
    type VARCHAR(255), --vehivle,tool,machine
    hourlyRate DECIMAL,
    observation TEXT
)

CREATE TABLE EquipmentLog (
    equipmentId INTEGER REFERENCES Equipment(equipmentId),
    crewId INTEGER REFERENCES Crews(crewId),
    comment TEXT,
    PRIMARY KEY (equipmentId, crewId)
);

CREATE TABLE CrewRouteResources(
    crewId INTEGER REFERENCES Crews(crewId),
    routeId INTEGER REFERENCES Routes(routeId),
    PRIMARY KEY (crewId, routeId)
);

CREATE TABLE InventoryUsage(
    CrewRouteId INTEGER REFERENCES CrewRouteResources(crewRouteId),
    inventoryId INTEGER REFERENCES Inventory(inventoryId),
    quantity DECIMAL,
    MaterialCost DECIMAL,
    PRIMARY KEY (CrewRouteId, inventoryId)
);

CREATE TABLE EquipmentUsage(
    CrewRouteId INTEGER REFERENCES CrewRouteResources(crewRouteId),
    equipmentId INTEGER REFERENCES Equipment(equipmentId),
    startDate DATE,
    endDate DATE,
    hoursLent DECIMAL,
    quantity DECIMAL,
    equipmentCost DECIMAL,
    observation TEXT,
    PRIMARY KEY (CrewRouteId, equipmentId)
);

---------------------------------------------------------------------


