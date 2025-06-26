-- Mock data for Users
INSERT INTO Users (UserId, username, password) VALUES
  (2, 'alice', 'password1'),
  (3, 'bob', 'password2'),
  (4, 'carol', 'password3');

-- Mock data for People
INSERT INTO People ( UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
  ( 1, 'Alice', 'Smith', 'Supervisor', '1234567890', 'alice@example.com', 1, 1),
  ( 2, 'Bob', 'Johnson', 'Technician', '2345678901', 'bob@example.com', 2, 2),
  ( 3, 'Carol', 'Williams', 'Engineer', '3456789012', 'carol@example.com', 3, 3);

-- Mock data for Payments
INSERT INTO Payments (checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES
  (1, 'PAY001', '2024-01-01', 1000.00, 'Completed', 'http://pay1.com', 1, 1),
  (2, 'PAY002', '2024-01-02', 2000.00, 'Pending', 'http://pay2.com', 2, 2),
  (3, 'PAY003', '2024-01-03', 1500.00, 'Completed', 'http://pay3.com', 3, 3);


-- Mock data for wayfinding
INSERT INTO wayfinding (wayfindingId, location, fromAddressNumber, fromAddressCardinal, fromAddressStreet, fromAddressSuffix, toAddressNumber, toAddressCardinal, toAddressStreet, toAddressSuffix, width, length, surfaceTotal, createdBy, updatedBy) VALUES
  (1, 'Loc1', '100', 'N', 'Main', 'St', '200', 'S', 'Elm', 'Ave', 10.5, 20.0, 210.0, 1, 1),
  (2, 'Loc2', '101', 'E', 'Oak', 'Blvd', '201', 'W', 'Pine', 'Rd', 12.0, 18.0, 216.0, 2, 2);

-- Mock data for NecessaryPhases
INSERT INTO NecessaryPhases (necessaryPhaseId, name, description, createdBy, updatedBy) VALUES
  (1, 'Phase 1', 'Initial phase', 1, 1),
  (2, 'Phase 2', 'Secondary phase', 2, 2);


-- Mock data for IncidentsMx
INSERT INTO IncidentsMx (incidentId, name, earliestRptDate, createdBy, updatedBy) VALUES
  (1, 'Incident 1', '2024-01-10', 1, 1),
  (2, 'Incident 2', '2024-01-11', 2, 2);

-- Mock data for Tickets
INSERT INTO Tickets (ticketId, incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, ticketCode, quantity, daysOutstanding, comment7d, contractNumber, amountToPay, ticketType, createdBy, updatedBy) VALUES
  (1, 1, 1, 1, 1, 1, 'TCK001', 5, 2, NULL, 'CN001', 500.0, 'regular', 1, 1),
  (2, 2, 2, 2, 2, 2, 'TCK002', 3, 1, 'Done', 'CN002', 300.0, 'mobilization', 2, 2);

-- Mock data for Addresses
INSERT INTO Addresses (addressId, addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES
  (1, '123', 'N', 'Main', 'St', 1, 1),
  (2, '456', 'S', 'Elm', 'Ave', 2, 2);

-- Mock data for TicketAddresses
INSERT INTO TicketAddresses (ticketId, addressId, ispartner, is7d, createdBy, updatedBy) VALUES
  (1, 1, true, false, 1, 1),
  (2, 2, false, true, 2, 2);

-- Mock data for Permits
INSERT INTO Permits (PermitId, permitNumber, status, startDate, expireDate, createdBy, updatedBy) VALUES
  (1, 'PRM001', 'Active', '2024-01-01', '2024-12-31', 1, 1),
  (2, 'PRM002', 'Expired', '2023-01-01', '2023-12-31', 2, 2);

-- Mock data for PermitedTickets
INSERT INTO PermitedTickets (permitId, ticketId, createdBy, updatedBy) VALUES
  (1, 1, 1, 1),
  (2, 2, 2, 2);

-- Mock data for Diggers
INSERT INTO Diggers (diggerId, permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) VALUES
  (1, 1, 'DG001', 'Active', '2024-01-01', '2024-06-01', true, 1, 1),
  (2, 2, 'DG002', 'Inactive', '2023-01-01', '2023-06-01', false, 2, 2);

-- Mock data for Skills
INSERT INTO Skills (skillId, name, description, createdBy, updatedBy) VALUES
  (1, 'Welding', 'Welding skills', 1, 1),
  (2, 'Plumbing', 'Plumbing skills', 2, 2);

-- Mock data for EmployeeSkills
INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy) VALUES
  (1, 1, 5, 1, 1),
  (2, 2, 4, 2, 2);

-- Mock data for Crews
INSERT INTO Crews (crewId, type, photo, workedHours, createdBy, updatedBy) VALUES
  (1, 'Repair', 'crew1.jpg', 100.0, 1, 1),
  (2, 'Paving', 'crew2.jpg', 200.0, 2, 2);

-- Mock data for CrewEmployees
INSERT INTO CrewEmployees (crewId, employeeId, crewLeader, createdBy, updatedBy) VALUES
  (1, 1, true, 1, 1),
  (2, 2, false, 2, 2);

-- Mock data for Routes
INSERT INTO Routes (routeId, routeCode, type, startDate, endDate, createdBy, updatedBy) VALUES
  (1, 'RTE001', 'concrete', '2024-01-01', '2024-01-10', 1, 1),
  (2, 'RTE002', 'asphalt', '2024-02-01', '2024-02-10', 2, 2);

-- Mock data for RouteTickets
INSERT INTO RouteTickets (routeId, ticketId, queue, createdBy, updatedBy) VALUES
  (1, 1, 1, 1, 1),
  (2, 2, 2, 2, 2);

-- Mock data for TaskStatus
INSERT INTO TaskStatus (taskStatusId, name, description, createdBy, updatedBy) VALUES
  (1, 'Open', 'Ticket is open', 1, 1),
  (2, 'Closed', 'Ticket is closed', 2, 2);

-- Mock data for TicketStatus
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) VALUES
  (1, 1, 1, '2024-01-01', '2024-01-05', 'Started', 1, 1),
  (2, 2, 2, '2024-02-01', '2024-02-05', 'Completed', 2, 2);

-- Mock data for photoEvidence
INSERT INTO photoEvidence (photoId, ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, createdBy, updatedBy) VALUES
  (1, 1, 1, 'Photo1', 41.0, -87.0, 'photo1.jpg', '2024-01-02', 'Initial', 'http://photo1.com', 1, 1),
  (2, 2, 2, 'Photo2', 42.0, -86.0, 'photo2.jpg', '2024-02-02', 'Final', 'http://photo2.com', 2, 2);

-- Mock data for Suppliers
INSERT INTO Suppliers (supplierId, name, phone, email, address, createdBy, updatedBy) VALUES
  (1, 'Supplier1', '5551112222', 'sup1@example.com', '123 Main St', 1, 1),
  (2, 'Supplier2', '5553334444', 'sup2@example.com', '456 Elm St', 2, 2);

-- Mock data for Inventory
INSERT INTO Inventory (inventoryId, supplierId, name, costPerUnit, unit, createdBy, updatedBy) VALUES
  (1, 1, 'Cement', 50.0, 'bag', 1, 1),
  (2, 2, 'Bricks', 0.5, 'piece', 2, 2);

-- Mock data for Equipment
INSERT INTO Equipment (equipmentId, supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy) VALUES
  (1, 1, 'Excavator', 'CompanyA', 'machine', 100.0, 'Heavy', 1, 1),
  (2, 2, 'Bulldozer', 'CompanyB', 'machine', 150.0, 'Large', 2, 2);

-- Mock data for usedInventory
INSERT INTO usedInventory (CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy) VALUES
  (1, 1, 10, 500.0, 1, 1),
  (2, 2, 20, 10.0, 2, 2);

-- Mock data for usedEquipment
INSERT INTO usedEquipment (CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy) VALUES
  (1, 1, '2024-01-01', '2024-01-02', 8.0, 1, 800.0, 'Used for digging', 1, 1),
  (2, 2, '2024-02-01', '2024-02-02', 6.0, 1, 900.0, 'Used for grading', 2, 2);

-- Mock data for RTRs
INSERT INTO RTRs (rtrId, name, url, createdAt, updatedAt) VALUES
  (1, 'RTR File 1', 'http://rtr1.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'RTR File 2', 'http://rtr2.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 


  INSERT INTO Invoices (invoiceId, ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy) VALUES
  (1, 1, 'INV001', '2024-01-05', 1200.00, 'Pending', 'http://invoice1.com', 1, 1),
  (2, 2, 'INV002', '2024-01-06', 800.00, 'Paid', 'http://invoice2.com', 2, 2),
  (3, 1, 'INV003', '2024-01-10', 600.00, 'Overdue', 'http://invoice3.com', 3, 3),
  (4, 2, 'INV004', '2024-01-15', 400.00, 'Pending', 'http://invoice4.com', 1, 1);

-- Mock data for Fines
INSERT INTO Fines (fineId, ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy) VALUES
  (1, 1, 'FINE001', '2024-01-05', '2024-01-10', 250.00, 'Paid', 'http://fine1.com', 1, 1),
  (2, 1, 'FINE002', '2024-01-08', NULL, 150.00, 'Outstanding', 'http://fine2.com', 2, 2),
  (3, 2, 'FINE003', '2024-01-12', '2024-01-15', 300.00, 'Paid', 'http://fine3.com', 3, 3),
  (4, 2, 'FINE004', '2024-01-15', NULL, 200.00, 'Pending', 'http://fine4.com', 1, 1),
  (5, 1, 'FINE005', '2024-01-20', NULL, 175.00, 'Overdue', 'http://fine5.com', 2, 2);
