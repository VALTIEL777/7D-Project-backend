-- 1. Users
INSERT INTO Users (username, password) VALUES 
('admin', 'admin123'), 
('jorge', 'passw0rd'), 
('maria', 'm4ri4pwd');

-- 2. People (empleados)
INSERT INTO People (UserId, firstname, lastname, role, phone, email, createdBy, updatedBy)
VALUES
 (1, 'Jorge', 'Gonzalez', 'Supervisor', '2220001111', 'jorge@gon.com', 1, 1),
 (2, 'María', 'Pérez', 'Supervisor', '2220002222', 'maria@pe.com', 1, 1),
 (3, 'Luis', 'Ramirez', 'Operario', '2220003333', 'luis@ram.com', 1, 1);

-- 3. Pagos
INSERT INTO Payments (paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy)
VALUES
 ('PAY-001', '2025-05-01', 1500.00, 'COMPLETED', 'https://pay/1', 1, 1),
 ('PAY-002', '2025-05-15', 2500.50, 'PENDING', NULL, 2, 2);

-- 4. Cuadrantes
INSERT INTO Quadrants (name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId)
VALUES
 ('Centro', 'ShopA', '19.1800', '19.2000', '-96.1400', '-96.1200', 1, 1, 1),
 ('Norte', 'ShopB', '19.2200', '19.2400', '-96.1400', '-96.1200', 2, 2, 1);

-- 5. Wayfinding
INSERT INTO wayfinding (streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy)
VALUES
 ('Av. Juarez', 'Calle 5', 'Centro', 'N', 'Juarez', 'Ave', 10.5, 100.0, 1050.0, 1, 1),
 ('Calle 10', 'Calle 12', 'Norte', 'E', '10', 'St', 8.0, 80.0, 640.0, 2, 2);

-- 6. NecessaryPhases
INSERT INTO NecessaryPhases (name, description, createdBy, updatedBy)
VALUES
 ('Excavación', 'Fase de retiro de tierra', 1, 1),
 ('Compactación', 'Compactado de suelo', 1, 1);

-- 7. ContractUnits
INSERT INTO ContractUnits (neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CostPerUnit, zone, PaymentClause, createdBy, updatedBy)
VALUES
 (NULL, NULL, 'CU-001', 'Movilización Básica', 'unit', 'Servicio de movilización', 'No incluye materiales', 500.00, 'Centro', 'Pago al finalizar', 1, 1),
 (1, NULL, 'CU-002', 'Excavación (m³)', 'm3', 'Excavación de tierra', 'No incluye transporte', 12.50, 'Norte', 'Pago parcial', 1, 1);

-- Relacionar ContractUnitsPhases
INSERT INTO ContractUnitsPhases (contractUnitId, necessaryPhaseId, createdBy, updatedBy)
VALUES
 (1, 1, 1, 1),
 (2, 1, 1, 1),
 (2, 2, 1, 1);

-- 8. IncidentsMx
INSERT INTO IncidentsMx (name, earliestRptDate, createdBy, updatedBy)
VALUES
 ('Inundación Calle Centro', '2025-05-20', 2, 2);

-- 9. Tickets
INSERT INTO Tickets 
(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy)
VALUES
 (1, 1, 2, 1, 1, NULL, 'TCK-001', 10, 5, 'Pendiente confirmación', 'Sin gas necesario', 'CTR-1001', 125.00, 'regular', 2, 2),
 (1, 2, 1, 2, 2, 1, 'TCK-002', 1, 0, 'Movilización lista', 'Gas OK', 'CTR-1002', 500.00, 'mobilization', 1, 1);

-- 10. Invoices
INSERT INTO Invoices (ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy)
VALUES
 (1, 'INV-1001', '2025-05-10', 125.00, 'REQUESTED', 'https://inv/1', 2, 2),
 (2, 'INV-1002', '2025-05-12', 500.00, 'PAID', 'https://inv/2', 1, 1);

-- 11. Fines
INSERT INTO Fines (ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy)
VALUES
 (1, 'FINE-001', '2025-05-22', NULL, 50.00, 'UNPAID', NULL, 2, 2);

-- 12. Permits, Diggers
INSERT INTO Permits (permitNumber, status, startDate, expireDate, createdBy, updatedBy)
VALUES
 ('PRM-001', TRUE, '2025-06-01', '2025-12-01', 1, 1);

INSERT INTO Diggers (permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy)
VALUES
 (1, 'DG-100', TRUE, '2025-06-05', '2025-06-10', TRUE, 1, 1);

-- 13. PermitedTickets association
INSERT INTO PermitedTickets (permitId, ticketId, createdBy, updatedBy)
VALUES (1, 1, 1, 1);

-- 14. Skills, EmployeeSkills
INSERT INTO Skills (name, description, createdBy, updatedBy)
VALUES
 ('Excavación', 'Habilidad para manejar maquinaria de excavación', 1, 1),
 ('Compactación', 'Uso de rodillos compactadores', 1, 1);

INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy)
VALUES
 (2, 1, 4, 1, 1),
 (3, 2, 3, 1, 1);

-- 15. Crews y CrewEmployees
INSERT INTO Crews (type, photo, workedHours, createdBy, updatedBy)
VALUES
 ('Equipo A', 'eqA.jpg', 120.5, 1, 1);

INSERT INTO CrewEmployees (crewId, employeeId, crewLeader, createdBy, updatedBy)
VALUES
 (1, 2, TRUE, 1, 1),
 (1, 3, FALSE, 1, 1);

-- 16. Addresses & TicketAddresses
INSERT INTO Addresses (addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy)
VALUES
 ('123', 'N', 'Juarez', 'Ave', 2, 2),
 ('456', 'E', '10', 'St', 2, 2);

INSERT INTO TicketAddresses (ticketId, addressId, ispartner, is7d, createdBy, updatedBy)
VALUES
 (1, 1, FALSE, TRUE, 2, 2),
 (2, 2, TRUE, FALSE, 1, 1);

-- 17. Routes & RouteTickets
INSERT INTO Routes (routeCode, type, startDate, endDate, createdBy, updatedBy)
VALUES
 ('RTE-01', 'concrete', '2025-06-01', NULL, 1, 1);

INSERT INTO RouteTickets (routeId, ticketId, queue, createdBy, updatedBy)
VALUES
 (1, 1, 1, 1, 1);

-- 18. TaskStatus & TicketStatus
INSERT INTO TaskStatus (name, description, createdBy, updatedBy)
VALUES
 ('Asignado', 'Ticket asignado al equipo', 1, 1),
 ('En progreso', 'Trabajo en curso', 1, 1);

INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy)
VALUES
 (1, 1, 1, '2025-06-05', NULL, 'Iniciado con Crew A', 1, 1);

-- 19. photoEvidence
INSERT INTO photoEvidence (ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy)
VALUES
 (1, 1, 'Inicio Excavación', 19.1900, -96.1300, 'photo1.jpg', '2025-06-06 10:00:00', 'Estado inicial de la zanja', 'https://photos/1', 'Juarez Ave 123', 1, 1);

-- 20. Suppliers, Inventory, Equipment, usedInventory, usedEquipment
INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy)
VALUES ('ProveedorA', '2220004444', 'sup@a.com', 'Av. Centro 100', 1, 1);

INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES (1, 'Cemento', 6.50, 'bolsa', 1, 1);

INSERT INTO Equipment (supplierId, equipmentName, owner, type, hourlyRate, hoursLent, observation, createdBy, updatedBy)
VALUES (1, 'Retroexcavadora', 'ProveedorA', 'machine', 150.00, 0, 'Servicio de palas', 1, 1);

INSERT INTO usedInventory (CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy)
VALUES (1, 1, 50, 325.00, 1, 1);

INSERT INTO usedEquipment (CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy)
VALUES (1, 1, '2025-06-06', '2025-06-07', 8, 1, 1200.00, 'Uso para excavación', 1, 1);