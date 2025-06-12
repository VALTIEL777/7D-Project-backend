CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    username VARCHAR(128),
    password VARCHAR(32),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);
CREATE TABLE People (
    employeeId SERIAL PRIMARY KEY,
    UserId INTEGER REFERENCES Users(UserId),
    firstname VARCHAR(45),
    lastname VARCHAR(45),
    role VARCHAR(128),
    phone VARCHAR(10),
    email VARCHAR(128),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

-- Payments module
CREATE TABLE Payments (
    checkId SERIAL PRIMARY KEY,
    paymentNumber VARCHAR(128),
    datePaid DATE,
    amountPaid DECIMAL,
    status VARCHAR(128),
    paymentURL TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

-- Quadrants module
CREATE TABLE Quadrants (
    quadrantId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    shop VARCHAR(64),
    minLatitude VARCHAR(64),
    maxLatitude VARCHAR(64),
    minLongitude VARCHAR(64),
    maxLongitude VARCHAR(64),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId),
    supervisorId INTEGER REFERENCES People(employeeId)
);

CREATE TABLE wayfinding(
    wayfindingId SERIAL PRIMARY KEY,
    streetFrom VARCHAR(64),
    streetTo VARCHAR(64),
    location VARCHAR(64),
    addressCardinal CHAR(1),
    addressStreet VARCHAR(64),
    addressSuffix VARCHAR(64),
	width DOUBLE PRECISION,
    length DOUBLE PRECISION,
    surfaceTotal DOUBLE PRECISION,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE NecessaryPhases (
    necessaryPhaseId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE ContractUnits (
    contractUnitId SERIAL PRIMARY KEY,
    neededMobilization INTEGER REFERENCES ContractUnits (contractUnitId) ,
    neededContractUnit INTEGER REFERENCES ContractUnits (contractUnitId) ,
    itemCode VARCHAR(255),
    name VARCHAR(128),
    unit VARCHAR(64),
    description TEXT,
    workNotIncluded TEXT,
    CDOTStandardImg TEXT,
    CostPerUnit DOUBLE PRECISION,
    zone VARCHAR(64),
    PaymentClause TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE ContractUnitsPhases (
    contractUnitId INTEGER REFERENCES ContractUnits (contractUnitId),
    necessaryPhaseId INTEGER REFERENCES NecessaryPhases (necessaryPhaseId),
    PRIMARY KEY (contractUnitId, necessaryPhaseId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE IncidentsMx (
    incidentId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    earliestRptDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

-----------------------------------------------------------------
--Tickets module
CREATE TABLE Tickets (
    ticketId SERIAL PRIMARY KEY,
    incidentId INTEGER REFERENCES IncidentsMx(incidentId),
    cuadranteId INTEGER REFERENCES Quadrants(quadrantId),
    contractUnitId INTEGER REFERENCES ContractUnits(contractUnitId),
    wayfindingId INTEGER REFERENCES wayfinding(wayfindingId),
    paymentId INTEGER REFERENCES Payments(checkId),
    mobilizationId INTEGER REFERENCES Tickets(ticketId),
    ticketCode VARCHAR(64),
    quantity INTEGER,
    daysOutstanding INTEGER,
    comment7d VARCHAR(255),
    PeopleGasComment VARCHAR(255),
    contractNumber VARCHAR(128),
    amountToPay DECIMAL,
    ticketType VARCHAR(64), -- mobilization, regular
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE Invoices (
    invoiceId SERIAL PRIMARY KEY,
    ticketId INTEGER REFERENCES Tickets(ticketId),
    invoiceNumber VARCHAR(128),
    invoiceDateRequested DATE,
    amountRequested DECIMAL,
    status VARCHAR(128),
    invoiceURL TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE Fines (
    fineId SERIAL PRIMARY KEY,
    ticketId INTEGER REFERENCES Tickets(ticketId),
    fineNumber VARCHAR(128),
    fineDate DATE,
    paymentDate DATE,
    amount DECIMAL,
    status VARCHAR(128),
    fineURL TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
-------------------------------------------------------------
--Permissions module
CREATE TABLE Permits (
    PermitId SERIAL PRIMARY KEY,
    permitNumber VARCHAR(128),
    status BOOLEAN,
    startDate DATE,
    expireDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE PermitedTickets (
    permitId INTEGER REFERENCES Permits(PermitId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    PRIMARY KEY (permitId, ticketId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE Diggers (
    diggerId SERIAL PRIMARY KEY,
    permitId INTEGER REFERENCES Permits(PermitId),
    diggerNumber VARCHAR(128),
    status BOOLEAN,
    startDate DATE,
    expireDate DATE,
    watchnProtect BOOLEAN,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
------------------------------------------------------------
-- Human Resources module



CREATE TABLE Skills (
    skillId SERIAL PRIMARY KEY,
    name VARCHAR(128),
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE EmployeeSkills (
    employeeId INTEGER REFERENCES People(employeeId),
    skillId INTEGER REFERENCES Skills(skillId),
    PRIMARY KEY (employeeId, skillId),
    proficiencyLevel INTEGER CHECK (proficiencyLevel >= 1 AND proficiencyLevel <= 5),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);


CREATE TABLE Crews (
    crewId SERIAL PRIMARY KEY,
    type VARCHAR(30),
    photo VARCHAR(255),
    workedHours DECIMAL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE CrewEmployees (
    crewId INTEGER REFERENCES Crews(crewId),
    employeeId INTEGER REFERENCES People(employeeId),
    crewLeader BOOLEAN,
    PRIMARY KEY (crewId, employeeId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
------------------------------------------------------------
-- Quadrants module
-- Relación Cuadrante Supervisor

CREATE TABLE Addresses (
    addressId SERIAL PRIMARY KEY,
    addressNumber VARCHAR(64),
    addressCardinal CHAR(1),
    addressStreet VARCHAR(64),
    addressSuffix VARCHAR(64),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
CREATE TABLE TicketAddresses (
    ticketId INTEGER REFERENCES Tickets(ticketId),
    addressId INTEGER REFERENCES Addresses(addressId),
    PRIMARY KEY (ticketId, addressId),
    ispartner BOOLEAN,
    is7d BOOLEAN,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
-----------------------------------------------------------------------
--Routes module
CREATE TABLE Routes (
    routeId SERIAL PRIMARY KEY,
    routeCode VARCHAR(64),
    type VARCHAR(64), -- concrete, asphalt
    startDate DATE,
    endDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

Create Table RouteTickets(
    routeId INTEGER REFERENCES Routes(routeId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    PRIMARY KEY (routeId, ticketId),
    queue INTEGER,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE TaskStatus(
    taskStatusId SERIAL PRIMARY KEY,
    name VARCHAR(64),
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);


CREATE TABLE TicketStatus(
    taskStatusId INTEGER REFERENCES TaskStatus(taskStatusId),
    ticketId INTEGER REFERENCES Tickets(ticketId),
    crewId INTEGER REFERENCES Crews(crewId),
    PRIMARY KEY (taskStatusId, ticketId),
    startingDate DATE,
    endingDate DATE,
    observation TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE photoEvidence(
    photoId SERIAL PRIMARY KEY,
    ticketStatusId INTEGER,
    ticketId INTEGER,
    name VARCHAR(64),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    photo VARCHAR(255),
    date TIMESTAMP,
    comment TEXT,
    photoURL TEXT,
    address VARCHAR(255),
    FOREIGN KEY (ticketStatusId, ticketId) REFERENCES TicketStatus(taskStatusId, ticketId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);
----------------------------------------------------------------
--Material & Equipment module

CREATE TABLE Suppliers (
    supplierId SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(10),
    email VARCHAR(128),
    address VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE Inventory (
    inventoryId SERIAL PRIMARY KEY,
    supplierId INTEGER REFERENCES Suppliers(supplierId),
    name VARCHAR(255),
    costPerUnit DECIMAL,
    unit VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE Equipment(
    equipmentId SERIAL PRIMARY KEY,
    supplierId INTEGER REFERENCES Suppliers(supplierId),
    equipmentName VARCHAR(255),
    owner VARCHAR(255),
    type VARCHAR(255), --vehivle,tool,machine
    hourlyRate DECIMAL,
    hoursLent DECIMAL,
    observation TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);




CREATE TABLE usedInventory(
    CrewId INTEGER REFERENCES Crews(crewId),
    inventoryId INTEGER REFERENCES Inventory(inventoryId),
    quantity DECIMAL,
    MaterialCost DECIMAL,
    PRIMARY KEY (CrewId, inventoryId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE usedEquipment(
    CrewId INTEGER REFERENCES Crews(crewId),
    equipmentId INTEGER REFERENCES Equipment(equipmentId),
    startDate DATE,
    endDate DATE,
    hoursLent DECIMAL,
    quantity DECIMAL,
    equipmentCost DECIMAL,
    observation TEXT,
    PRIMARY KEY (CrewId, equipmentId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updatedAt column
CREATE TRIGGER set_updated_at_payments
BEFORE UPDATE ON Payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_quadrants
BEFORE UPDATE ON Quadrants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_wayfinding
BEFORE UPDATE ON wayfinding
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_necessaryphases
BEFORE UPDATE ON NecessaryPhases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_contractunits
BEFORE UPDATE ON ContractUnits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_contractunitsphases
BEFORE UPDATE ON ContractUnitsPhases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_incidentsmx
BEFORE UPDATE ON IncidentsMx
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_tickets
BEFORE UPDATE ON Tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_invoices
BEFORE UPDATE ON Invoices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_fines
BEFORE UPDATE ON Fines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_permits
BEFORE UPDATE ON Permits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_permitedtickets
BEFORE UPDATE ON PermitedTickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_diggers
BEFORE UPDATE ON Diggers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_employees
BEFORE UPDATE ON People
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_skills
BEFORE UPDATE ON Skills
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_employeeskills
BEFORE UPDATE ON EmployeeSkills
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_crews
BEFORE UPDATE ON Crews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_crewemployees
BEFORE UPDATE ON CrewEmployees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();


CREATE TRIGGER set_updated_at_addresses
BEFORE UPDATE ON Addresses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_ticketaddresses
BEFORE UPDATE ON TicketAddresses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_routes
BEFORE UPDATE ON Routes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_routetickets
BEFORE UPDATE ON RouteTickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_taskstatus
BEFORE UPDATE ON TaskStatus
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_ticketstatus
BEFORE UPDATE ON TicketStatus
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_photoevidence
BEFORE UPDATE ON photoEvidence
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_suppliers
BEFORE UPDATE ON Suppliers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_inventory
BEFORE UPDATE ON Inventory
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_equipment
BEFORE UPDATE ON Equipment
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();


CREATE TRIGGER set_updated_at_usedinventory
BEFORE UPDATE ON usedInventory
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_usedequipment
BEFORE UPDATE ON usedEquipment
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();


