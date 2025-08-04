CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    username VARCHAR(128) UNIQUE,
    password TEXT,
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
    email VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

-- Payments module
CREATE TABLE Payments (
    checkId SERIAL PRIMARY KEY,
    paymentNumber VARCHAR(128) UNIQUE,
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
    zone VARCHAR(64),
    minLatitude VARCHAR(64),
    maxLatitude VARCHAR(64),
    minLongitude VARCHAR(64),
    maxLongitude VARCHAR(64),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId),
    supervisorId INTEGER REFERENCES People(employeeId),
    zoneManagerId INTEGER REFERENCES People(employeeId)
);

CREATE TABLE wayfinding(
    wayfindingId SERIAL PRIMARY KEY,
    location VARCHAR(64),
    fromAddressNumber VARCHAR(64),
    fromAddressCardinal VARCHAR(64),
    fromAddressStreet VARCHAR(64),
    fromAddressSuffix VARCHAR(64),
    toAddressNumber VARCHAR(64),
    toAddressCardinal VARCHAR(64),
    toAddressStreet VARCHAR(64),
    toAddressSuffix VARCHAR(64),
	width NUMERIC(10, 2),
    length NUMERIC(10, 2),
    surfaceTotal NUMERIC(10, 2),
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
    itemCode VARCHAR(255) UNIQUE,
    name VARCHAR(128),
    unit VARCHAR(64),
    description TEXT,
    workNotIncluded TEXT,
    CDOTStandardImg TEXT,
    CostPerUnit NUMERIC(10, 2),
    zone VARCHAR(64),
    PaymentClause TEXT,
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
    ticketCode VARCHAR(64) UNIQUE,
    quantity INTEGER DEFAULT 1,
    daysOutstanding INTEGER,
    comment7d VARCHAR(255),
    PartnerComment VARCHAR(255),
    PartnerSupervisorComment VARCHAR(255),
    contractNumber VARCHAR(128),
    amountToPay DECIMAL,
    calculatedCost DECIMAL,
    amountPaid DECIMAL,
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
    status VARCHAR(128),
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
    status VARCHAR(128),
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
    addressCardinal VARCHAR(64),
    addressStreet VARCHAR(64),
    addressSuffix VARCHAR(64),
    latitude NUMERIC(12, 8),
    longitude NUMERIC(12, 8),
    placeid VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId),
    UNIQUE(addressNumber, addressCardinal, addressStreet, addressSuffix)
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
    encodedPolyline TEXT,
    totalDistance NUMERIC(10, 2),
    totalDuration NUMERIC(10, 2),
    optimizedOrder JSONB,
    optimizationMetadata JSONB,
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
    address VARCHAR(255),
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
    startingDate TIMESTAMPTZ,
    endingDate TIMESTAMPTZ,
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
    ticketId INTEGER,  -- Add this column to match the composite key
    name VARCHAR(64),
    latitude NUMERIC(12, 8),
    longitude NUMERIC(12, 8),
    photo VARCHAR(255),
    date TIMESTAMP,
    comment TEXT,
    photoURL TEXT,
    FOREIGN KEY (ticketStatusId, ticketId) REFERENCES TicketStatus(taskStatusId, ticketId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE ContractUnitsPhases (
    contractUnitId INTEGER REFERENCES ContractUnits (contractUnitId),
    taskStatusId INTEGER REFERENCES TaskStatus ( taskStatusId),
    PRIMARY KEY (contractUnitId,  taskStatusId),
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

CREATE TABLE PricingAgreements(
    pricingAgreementId SERIAL PRIMARY KEY,
    supplierId INTEGER REFERENCES Suppliers(supplierId),
    startDate DATE,
    endDate DATE,
    fileURL TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE InventoryPricingAgreements(
    pricingAgreementId INTEGER REFERENCES PricingAgreements(pricingAgreementId),
    inventoryId INTEGER REFERENCES Inventory(inventoryId),
    costPerUnit DECIMAL,
    PRIMARY KEY (pricingAgreementId, inventoryId),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

CREATE TABLE EquipmentPricingAgreements(
    pricingAgreementId INTEGER REFERENCES PricingAgreements(pricingAgreementId),
    equipmentId INTEGER REFERENCES Equipment(equipmentId),
    PRIMARY KEY (pricingAgreementId, equipmentId),
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

CREATE TABLE RTRs (
    rtrId SERIAL PRIMARY KEY,
    name VARCHAR(255), -- original file name
    url TEXT,          -- MinIO/S3 URL or object key
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);

-- GeocodeCache table removed - using Addresses table with placeid field instead

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



--indexes
-- Permits table
CREATE INDEX idx_permits_expire_date ON Permits(expireDate) WHERE deletedAt IS NULL;
CREATE INDEX idx_permits_deleted_status ON Permits(deletedAt, status);

-- Tickets table
CREATE INDEX idx_tickets_comment7d ON Tickets(comment7d) WHERE deletedAt IS NULL;
CREATE INDEX idx_tickets_deleted ON Tickets(deletedAt) WHERE deletedAt IS NULL;
CREATE INDEX idx_tickets_ticket_code ON Tickets(ticketCode) WHERE deletedAt IS NULL;

-- PermitedTickets junction table
CREATE INDEX idx_permitedtickets_permitid ON PermitedTickets(permitId) WHERE deletedAt IS NULL;
CREATE INDEX idx_permitedtickets_ticketid ON PermitedTickets(ticketId) WHERE deletedAt IS NULL;
CREATE INDEX idx_permitedtickets_deleted ON PermitedTickets(deletedAt) WHERE deletedAt IS NULL;

-- TicketAddresses table
CREATE INDEX idx_ticketaddresses_ticketid ON TicketAddresses(ticketId) WHERE deletedAt IS NULL;
CREATE INDEX idx_ticketaddresses_addressid ON TicketAddresses(addressId) WHERE deletedAt IS NULL;

-- Addresses table
CREATE INDEX idx_addresses_deleted ON Addresses(deletedAt) WHERE deletedAt IS NULL;
CREATE INDEX idx_addresses_full ON Addresses(addressNumber, addressCardinal, addressStreet, addressSuffix) WHERE deletedAt IS NULL;

-- TicketStatus table
CREATE INDEX idx_ticketstatus_ticketid ON TicketStatus(ticketId) WHERE deletedAt IS NULL;
CREATE INDEX idx_ticketstatus_taskstatusid ON TicketStatus(taskStatusId) WHERE deletedAt IS NULL;

-- TaskStatus table
CREATE INDEX idx_taskstatus_name ON TaskStatus(name) WHERE deletedAt IS NULL;

CREATE INDEX idx_tickets_comment7d_specific ON Tickets(comment7d) 
WHERE deletedAt IS NULL AND (comment7d IS NULL OR comment7d = '' OR comment7d = 'TK - NEEDS PERMIT EXTENSION');

CREATE INDEX idx_tickets_with_null_comment7d ON Tickets(ticketId) 
WHERE comment7d IS NULL AND deletedAt IS NULL;

CREATE INDEX idx_address_ticket_join ON TicketAddresses(addressId, ticketId) 
WHERE deletedAt IS NULL;

ALTER TABLE Crews
ADD COLUMN routeId INTEGER REFERENCES Routes(routeId);

INSERT INTO Users ( username, password)
VALUES ('testuser', 'securepassword123')
ON CONFLICT (UserId) DO NOTHING;

-- Supervisors
INSERT INTO People (UserId, firstname, lastname, role, phone, email) VALUES
(NULL, 'Renee', 'Mercado', 'Supervisor', '7737946851', 'renee.mercado@peoplesgasdelivery.com'),
(NULL, 'Aaron', 'Collins', 'Supervisor', '7733957426', 'aaron.collins@peoplesgasdelivery.com'),
(NULL, 'Robert', 'Ozys', 'Supervisor', '3122732664', 'robert.ozys@peoplesgasdelivery.com');

-- Zone Managers (1-4)
INSERT INTO People (UserId, firstname, lastname, role, phone, email) VALUES
(NULL, 'Barbara', 'Powell', 'Zone 1 Manager', '8723622282', 'Barbara.Powell1@peoplesgasdelivery.com'),
(NULL, 'Mario', 'Ortiz', 'Zone 2 Manager', '3123660935', 'Mario.Ortiz@peoplesgasdelivery.com'),
(NULL, 'Bryan', 'Guzman', 'Zone 3 Manager', '3123302832', 'Bryan.Guzman@peoplesgasdelivery.com'),
(NULL, 'Matthew', 'Puljic', 'Zone 4 Manager', '3123661938', 'Matthew.Puljic@peoplesgasdelivery.com');

-- Regional Managers (North/Central/South)
INSERT INTO People (UserId, firstname, lastname, role, phone, email) VALUES
(NULL, 'Dominick', 'Puckett', 'Regional Manager', '3123514903', 'dominick.puckett@peoplesgasdelivery.com'),
(NULL, 'James', 'Davis', 'Regional Manager', '7733975593', 'dominick.hernandez@peoplesgasdelivery.com'),
(NULL, 'Anthony', 'Gross', 'Regional Manager', '3122135259', 'lucero.martinez@peoplesgasdelivery.com'),
(NULL, 'Giovanni', 'Delgado', 'Regional Manager', '3127991520', NULL);

-- Quadrant Zone Managers (NW/NE/SW/SE)
INSERT INTO People (UserId, firstname, lastname, role, phone, email) VALUES
(NULL, 'Jonathan', 'Salgado', 'Quadrant Manager (NE)', '3123668217', 'jonathan.salgado@peoplesgasdelivery.com'),
(NULL, 'Carl', 'Hughes', 'Quadrant Manager (SW)', '3122082480', 'carl.hughes@peoplesgasdelivery.com'),
(NULL, 'Pablo', 'Jimenez', 'Quadrant Manager (SE)', '3123661882', 'pablo.jimenez@peoplesgasdelivery.com');

INSERT INTO TaskStatus (name, description)
VALUES 
    ('Sawcut', 'Cutting the damaged pavement section with a saw'),
    ('Framing', 'Creating forms or frames for the new concrete pour'),
    ('Pour', 'Pouring new concrete into the prepared area'),
    ('Clean', 'Cleaning the work area and removing debris'),
    ('Dirt', 'Preparing and compacting the base dirt layer'),
    ('Grind', 'Grinding down uneven surfaces for smooth transitions'),
    ('Stripping', 'Removing old pavement or surface materials'),
    ('Spotting', 'Marking and identifying areas that need repair'),
    ('Crack Seal', 'Sealing cracks in asphalt to prevent water penetration and pavement degradation'),
    ('Install Signs', 'Installing road or traffic control signs at designated locations'),
    ('Steel Plate Pick Up', 'Removing previously installed steel plates from the roadway'),
    ('Asphalt', 'Laying down or repairing asphalt pavement surfaces'),
    ('Removal', 'Removing materials, debris, or temporary installations from the work site'),
    ('No Parking Signs', 'Installing No Parking Signs at designated locations');

--repair ids
SELECT setval(pg_get_serial_sequence('users', 'userid'), COALESCE(MAX(userid), 0) + 1, false) FROM users;
  SELECT setval(pg_get_serial_sequence('people', 'employeeid'), COALESCE(MAX(employeeid), 0) + 1, false) FROM people;
  SELECT setval(pg_get_serial_sequence('payments', 'checkid'), COALESCE(MAX(checkid), 0) + 1, false) FROM payments;











    