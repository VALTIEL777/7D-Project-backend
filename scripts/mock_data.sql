INSERT INTO Users (username, password) VALUES
('john_doe', 'password123'),
('jane_smith', 'securepass'),
('alice_green', 'alicepass');

INSERT INTO Payments (paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES
('PAY001', '2023-01-15', 1500.00, 'Completed', 'http://example.com/pay001', 1, 1),
('PAY002', '2023-02-20', 250.50, 'Pending', 'http://example.com/pay002', 2, 2),
('PAY003', '2023-03-01', 500.75, 'Refunded', 'http://example.com/pay003', 1, 3);

INSERT INTO People (UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
(1, 'John', 'Doe', 'Administrator', '1234567890', 'john.doe@example.com', 1, 1),
(2, 'Jane', 'Smith', 'Supervisor', '0987654321', 'jane.smith@example.com', 2, 2),
(3, 'Alice', 'Green', 'Engineer', '5551112233', 'alice.green@example.com', 3, 3);

INSERT INTO Quadrants (name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId) VALUES
('Northwest', 'Shop A', '34.000', '34.500', '-118.000', '-117.500', 1, 1, 2),
('Southeast', 'Shop B', '33.500', '34.000', '-117.500', '-117.000', 2, 2, 2),
('Northeast', 'Shop C', '34.500', '35.000', '-117.000', '-116.500', 3, 3, 1);

INSERT INTO wayfinding(streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy) VALUES
('Main St', 'Elm St', 'Downtown', 'N', 'Main', 'Ave', 10.5, 100.2, 1052.1, 1, 1),
('Oak Ave', 'Pine Ln', 'Suburb', 'S', 'Oak', 'St', 8.0, 75.0, 600.0, 2, 2),
('Bridge Rd', 'River Ln', 'Riverside', 'E', 'Bridge', 'Rd', 12.0, 150.0, 1800.0, 3, 3);

INSERT INTO NecessaryPhases (name, description, createdBy, updatedBy) VALUES
('Phase 1', 'Initial assessment', 1, 1),
('Phase 2', 'Construction', 2, 2),
('Phase 3', 'Testing and Quality Assurance', 1, 3);

INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy) VALUES
('CU001', 'Concrete Slab', 'Sq Yard', 'Standard concrete slab', 'Rebar', 'img_cu001.jpg', 50.00, 'Zone 1', 'Payment on completion', 1, 1),
('CU002', 'Asphalt Paving', 'Sq Yard', 'Asphalt overlay', 'Base prep', 'img_cu002.jpg', 30.00, 'Zone 2', '50% upfront, 50% on completion', 2, 2),
('CU003', 'Guardrail Installation', 'Linear Foot', 'Installation of steel guardrails', 'Painting', 'img_cu003.jpg', 75.50, 'Zone 3', 'Net 30 days', 3, 3);

INSERT INTO ContractUnitsPhases (contractUnitId, necessaryPhaseId, createdBy, updatedBy) VALUES
(1, 1, 1, 1),
(1, 2, 1, 1),
(2, 2, 2, 2),
(1, 3, 1, 3),
(3, 1, 3, 3),
(3, 2, 3, 3),
(3, 3, 3, 3);

INSERT INTO IncidentsMx (name, earliestRptDate, createdBy, updatedBy) VALUES
('Pothole', '2023-03-01', 1, 1),
('Water Leak', '2023-03-05', 2, 2),
('Tree Fall', '2023-03-10', 3, 3);

INSERT INTO Tickets (incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy) VALUES
(1, 1, 1, 1, 1, 'TICKET001', 5, 10, 'Urgent repair', 'No gas interference', 'C123', 250.00, 'regular', 1, 1),
(2, 2, 2, 2, 2, 'TICKET002', 2, 5, 'Routine maintenance', 'Requires coordination', 'C456', 150.00, 'regular', 2, 2),
(1, 1, 1, 1, 1, 'TICKET003', 1, 20, 'Requires mobilization', 'No gas lines affected', 'C789', 500.00, 'mobilization', 1, 1),
(2, 1, 1, 1, 1, 'TICKET004', 3, 7, 'Minor repair', 'Gas line nearby, careful', 'C101', 300.00, 'regular', 2, 2),
(2, 1, 1, 1, 1, 'TICKET005', 2, 12, 'Urgent water leak', 'Confirmed no gas involvement', 'C112', 450.00, 'regular', 3, 3);

UPDATE Tickets SET mobilizationId = 3 WHERE ticketId = 3;

INSERT INTO Invoices (ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy) VALUES
(1, 'INV001', '2023-03-10', 250.00, 'Paid', 'http://example.com/inv001', 1, 1),
(2, 'INV002', '2023-03-15', 150.00, 'Pending', 'http://example.com/inv002', 2, 2),
(3, 'INV003', '2023-03-20', 500.00, 'Pending', 'http://example.com/inv003', 1, 3),
(4, 'INV004', '2023-03-25', 300.00, 'Paid', 'http://example.com/inv004', 2, 2);

INSERT INTO Fines (ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy) VALUES
(1, 'FINE001', '2023-03-02', '2023-03-05', 50.00, 'Paid', 'http://example.com/fine001', 1, 1),
(2, 'FINE002', '2023-03-07', NULL, 30.00, 'Outstanding', 'http://example.com/fine002', 2, 2),
(3, 'FINE003', '2023-03-12', NULL, 75.00, 'Outstanding', 'http://example.com/fine003', 3, 3);

INSERT INTO Permits (permitNumber, status, startDate, expireDate, createdBy, updatedBy) VALUES
('PERMIT001', TRUE, '2023-01-01', '2023-12-31', 1, 1),
('PERMIT002', FALSE, '2023-02-01', '2023-08-31', 2, 2),
('PERMIT003', TRUE, '2023-03-01', '2023-09-30', 3, 3);

INSERT INTO PermitedTickets (permitId, ticketId, createdBy, updatedBy) VALUES
(1, 1, 1, 1),
(1, 2, 1, 1),
(2, 3, 2, 3),
(3, 5, 3, 3);

INSERT INTO Diggers (permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) VALUES
(1, 'DIGGER001', TRUE, '2023-01-10', '2023-06-30', TRUE, 1, 1),
(2, 'DIGGER002', FALSE, '2023-02-15', '2023-07-31', FALSE, 2, 2),
(3, 'DIGGER003', TRUE, '2023-03-05', '2023-09-01', TRUE, 1, 3);

INSERT INTO Skills (name, description, createdBy, updatedBy) VALUES
('Welding', 'Proficient in various welding techniques', 1, 1),
('Heavy Equipment Operation', 'Certified to operate heavy machinery', 2, 2),
('Plumbing', 'Skilled in pipe installation and repair', 3, 3);

INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy) VALUES
(1, 1, 4, 1, 1),
(2, 2, 5, 2, 2),
(3, 3, 3, 3, 3);

INSERT INTO Crews (type, photo, workedHours, createdBy, updatedBy) VALUES
('Repair Crew', 'crew_repair.jpg', 160.0, 1, 1),
('Paving Crew', 'crew_paving.jpg', 120.0, 2, 2),
('Emergency Crew', 'crew_emergency.jpg', 80.0, 3, 3);

INSERT INTO CrewEmployees (crewId, employeeId, crewLeader, createdBy, updatedBy) VALUES
(1, 1, TRUE, 1, 1),
(1, 2, FALSE, 1, 1),
(2, 2, TRUE, 2, 2),
(1, 3, FALSE, 1, 3),
(3, 1, TRUE, 3, 3),
(3, 2, FALSE, 3, 3);

INSERT INTO Addresses (addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES
('123', 'N', 'Maple', 'St', 1, 1),
('456', 'S', 'Oak', 'Ave', 2, 2),
('789', 'W', 'Cherry', 'Ln', 3, 3);

INSERT INTO TicketAddresses (ticketId, addressId, ispartner, is7d, createdBy, updatedBy) VALUES
(1, 1, TRUE, FALSE, 1, 1),
(2, 2, FALSE, TRUE, 2, 2),
(3, 3, TRUE, TRUE, 1, 3);

INSERT INTO Routes (routeCode, type, startDate, endDate, createdBy, updatedBy) VALUES
('ROUTE-A', 'asphalt', '2023-01-01', '2023-01-31', 1, 1),
('ROUTE-B', 'concrete', '2023-02-01', '2023-02-28', 2, 2),
('ROUTE-C', 'dirt', '2023-03-01', '2023-03-15', 3, 3);

INSERT INTO RouteTickets (routeId, ticketId, queue, createdBy, updatedBy) VALUES
(1, 1, 1, 1, 1),
(2, 2, 1, 2, 2),
(1, 3, 2, 1, 3),
(3, 4, 1, 3, 3);

INSERT INTO TaskStatus (name, description, createdBy, updatedBy) VALUES
('In Progress', 'Task is currently being worked on', 1, 1),
('Completed', 'Task has been finished', 2, 2),
('On Hold', 'Task paused due to external factors', 3, 3);

INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) VALUES
(1, 1, 1, '2023-03-01', NULL, 'Crew dispatched', 1, 1),
(2, 2, 2, '2023-03-05', '2023-03-06', 'Work finished ahead of schedule', 2, 2),
(3, 3, 1, '2023-03-10', NULL, 'Waiting for permit approval', 1, 3);

INSERT INTO photoEvidence (ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy) VALUES
(1, 1, 'Before Repair', 34.0522, -118.2437, 'photo1.jpg', '2023-03-01 10:00:00', 'Pothole before repair', 'http://example.com/photo1.jpg', '123 Maple St', 1, 1),
(2, 2, 'After Repair', 33.7000, -117.8000, 'photo2.jpg', '2023-03-06 15:30:00', 'Road repaved', 'http://example.com/photo2.jpg', '456 Oak Ave', 2, 2),
(1, 3, 'Mobilization Photo', 34.1000, -118.0000, 'photo3.jpg', '2023-03-10 09:00:00', 'Crew mobilizing to site', 'http://example.com/photo3.jpg', '789 Cherry Ln', 1, 3);

INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy) VALUES
('ABC Supplies', '5551234567', 'contact@abc.com', '123 Supply Rd', 1, 1),
('XYZ Equipment', '5559876543', 'info@xyz.com', '456 Equipment Dr', 2, 2),
('Tool Rentals Inc.', '5554445566', 'rentals@tools.com', '789 Tool St', 3, 3);

INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy) VALUES
(1, 'Concrete Mix', 10.00, 'Bag', 1, 1),
(1, 'Rebar', 5.00, 'Foot', 1, 1),
(2, 'Asphalt Patch', 15.00, 'Bag', 2, 2);

INSERT INTO Equipment (supplierId, equipmentName, owner, type, hourlyRate, hoursLent, observation, createdBy, updatedBy) VALUES
(2, 'Excavator', 'XYZ Equipment', 'machine', 100.00, 0.0, 'Heavy duty excavator', 1, 1),
(2, 'Jackhammer', 'XYZ Equipment', 'tool', 25.00, 0.0, 'Portable jackhammer', 2, 2),
(1, 'Dump Truck', 'ABC Logistics', 'vehicle', 75.00, 0.0, 'Large capacity dump truck', 3, 3);

INSERT INTO usedInventory (CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy) VALUES
(1, 1, 50.0, 500.00, 1, 1),
(1, 2, 100.0, 500.00, 1, 1),
(2, 3, 20.0, 300.00, 2, 2);

INSERT INTO usedEquipment (CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy) VALUES
(1, 1, '2023-03-01', '2023-03-02', 8.0, 1.0, 800.00, 'Used for digging', 1, 1),
(2, 2, '2023-03-05', '2023-03-05', 4.0, 1.0, 100.00, 'Used for breaking asphalt', 2, 2),
(1, 3, '2023-03-10', '2023-03-11', 12.0, 1.0, 900.00, 'Used for material transport', 1, 3);

INSERT INTO Users (username, password) VALUES ('bob_johnson', 'securepass456');
INSERT INTO Payments (paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES ('PAY004', '2023-04-01', 1000.00, 'Completed', 'http://example.com/pay004', 4, 4);
INSERT INTO People (UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES (4, 'Bob', 'Johnson', 'Manager', '5553334455', 'bob.johnson@example.com', 4, 4);
INSERT INTO Quadrants (name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId) VALUES ('Southwest', 'Shop D', '33.000', '33.500', '-118.500', '-118.000', 4, 4, 4);
INSERT INTO wayfinding(streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy) VALUES ('Fifth Ave', 'Sixth St', 'Financial District', 'W', 'Fifth', 'Ave', 15.0, 200.0, 3000.0, 4, 4);
INSERT INTO NecessaryPhases (name, description, createdBy, updatedBy) VALUES ('Phase 4', 'Post-construction cleanup', 4, 4);
INSERT INTO ContractUnits (itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy) VALUES ('CU004', 'Drainage System', 'Linear Foot', 'Installation of new drainage system', 'Excavation', 'img_cu004.jpg', 120.00, 'Zone 4', 'Upon inspection approval', 4, 4);
INSERT INTO Invoices (ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy) VALUES (5, 'INV005', '2023-04-10', 450.00, 'Pending', 'http://example.com/inv005', 4, 4);
INSERT INTO Fines (ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy) VALUES (4, 'FINE004', '2023-03-20', '2023-03-25', 100.00, 'Paid', 'http://example.com/fine004', 4, 4);
INSERT INTO Permits (permitNumber, status, startDate, expireDate, createdBy, updatedBy) VALUES ('PERMIT004', FALSE, '2023-04-01', '2023-10-31', 4, 4);
INSERT INTO Diggers (permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) VALUES (1, 'DIGGER004', TRUE, '2023-04-01', '2023-09-30', FALSE, 4, 4);
INSERT INTO Skills (name, description, createdBy, updatedBy) VALUES ('Masonry', 'Expert in brick and stone work', 4, 4);
INSERT INTO Crews (type, photo, workedHours, createdBy, updatedBy) VALUES ('Maintenance Crew', 'crew_maintenance.jpg', 90.0, 4, 4);
INSERT INTO Addresses (addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES ('101', 'E', 'Broad', 'St', 4, 4);
INSERT INTO Routes (routeCode, type, startDate, endDate, createdBy, updatedBy) VALUES ('ROUTE-D', 'gravel', '2023-04-01', '2023-04-30', 4, 4);
INSERT INTO TaskStatus (name, description, createdBy, updatedBy) VALUES ('Cancelled', 'Task was cancelled', 4, 4);
INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy) VALUES ('Construction Tools', '5557778899', 'sales@constructiontools.com', '101 Tool Ave', 4, 4);
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy) VALUES (1, 'Cement Bags', 8.50, 'Bag', 4, 4);
INSERT INTO Equipment (supplierId, equipmentName, owner, type, hourlyRate, hoursLent, observation, createdBy, updatedBy) VALUES (2, 'Compactor', 'XYZ Equipment', 'machine', 60.00, 0.0, 'Vibratory plate compactor', 4, 4); 