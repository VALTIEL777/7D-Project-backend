-- Mock data for Users
INSERT INTO Users ( username, password) VALUES
  ('Agustin', 'Agustin'),
  ('Iris', 'Iris'),
  ('Erick', 'Erick'),
  ('Christian', 'Christian'),
  ('Elian', 'Elian'),
  ('Eva', 'Eva'),
  ('Laura', 'laura123');


-- Mock data for People
INSERT INTO People ( UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
  ( 2, 'Agustin', 'Landa', 'admin', '1234567890', 'Agustin@example.com', 1, 1),
  ( 3, 'Iris', 'Landa', 'admin', '2345678901', 'Iris@example.com', 1, 1),
  ( 4, 'Erick', 'Flores', 'admin', '3456789012', 'Erick@example.com', 1, 1),
  ( 5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  ( 5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  ( 6, 'Elian', 'Medina', 'admin', '3456789012', 'Elian@example.com', 1, 1),
  ( 7, 'Eva', 'Landa', 'admin', '3456789012', 'Eva@example.com', 1, 1),
   ( 8, 'Laura', 'Mcqueen', 'operator', '3456789012', 'Eva@example.com', 1, 1);


-- Mock data for Payments
INSERT INTO Payments (checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES
  (1, 'PAY001', '2024-01-01', 1000.00, 'Completed', 'http://pay1.com', 1, 1),
  (2, 'PAY002', '2024-01-02', 2000.00, 'Pending', 'http://pay2.com', 2, 2),
  (3, 'PAY003', '2024-01-03', 1500.00, 'Completed', 'http://pay3.com', 3, 3);


-- Mock data for Skills
INSERT INTO Skills (skillId, name, description, createdBy, updatedBy) VALUES
  (1, 'Welding', 'Welding skills', 1, 1),
  (2, 'Plumbing', 'Plumbing skills', 2, 2),
  (3, 'Driver', 'Driving different types of vehicles', 1, 1),
  (4, 'Tool', 'Proficiency in using construction tools', 1, 1),
  (5, 'Machine', 'Operating heavy machinery', 2, 2),
  (6, 'Measure', 'Measurement and leveling skills', 2, 2);


-- Mock data for EmployeeSkills con nuevos employeeId
INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy) VALUES
  (15, 1, 5, 1, 1), -- Agustin - Welding (Expert)
  (16, 2, 4, 2, 2), -- Iris - Plumbing (Advanced)
  (15, 3, 4, 1, 1), -- Agustin - Driver
  (15, 4, 3, 1, 1), -- Agustin - Tool
  (16, 5, 5, 2, 2), -- Iris - Machine
  (17, 6, 2, 1, 1), -- Erick - Measure (Basic)
   (18, 1, 5, 1, 1), -- Christian - Welding (Expert)
  (19, 2, 4, 2, 2), -- Elian - Plumbing (Advanced)
  (20, 3, 4, 1, 1), -- Eva - Driver
  (20, 4, 3, 1, 1), -- Eva - Tool
  (19, 5, 5, 2, 2), -- Elian - Machine
  (21, 6, 2, 1, 1); -- Laura - Measure (Basic)



-- Mock data for Crews
INSERT INTO Crews ( type, photo, workedHours, createdBy, updatedBy) VALUES
  ('Repair', 'crew1.jpg', 100.0, 1, 1),
  ('Paving', 'crew2.jpg', 200.0, 2, 2);

-- Mock data for CrewEmployees
INSERT INTO CrewEmployees (crewId, employeeId, crewLeader, createdBy, updatedBy) VALUES
  (1, 1, true, 1, 1),
  (2, 2, false, 2, 2);

--Generacion de rutas

INSERT INTO wayfinding (
    location, fromAddressNumber, fromAddressCardinal, fromAddressStreet, fromAddressSuffix,
    toAddressNumber, toAddressCardinal, toAddressStreet, toAddressSuffix,
    width, length, surfaceTotal, createdBy, updatedBy
) VALUES (
    'Zone A', '123', 'N', 'Main', 'Stt',
    '125', 'N', 'Main', 'St',
    5.00, 20.00, 100.00, 1, 1
);

INSERT INTO IncidentsMx (
    name, earliestRptDate, createdBy, updatedBy
) VALUES (
    'Bache profundo', '2024-06-01', 1, 1
);

INSERT INTO Tickets (
    incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId,
    ticketCode, quantity, daysOutstanding, comment7d,
    PartnerComment, PartnerSupervisorComment, contractNumber,
    amountToPay, ticketType, createdBy, updatedBy
) VALUES (
    1, 1, 1, 1, 1,
    'TK-001', 1, 3, 'Pendiente de validación',
    'Revisado por partner', 'Aprobado por supervisor', 'CU-123',
    1500.00, 'regular', 1, 1
);

INSERT INTO Routes (
    routeCode, type, startDate, endDate, encodedPolyline,
    totalDistance, totalDuration, optimizedOrder,
    optimizationMetadata, createdBy, updatedBy
) VALUES (
    'ASPHALT-001', 'asphalt', '2024-07-01', '2024-07-03', 'abc123xyz',
    10.50, 2.25, '["1", "2", "3"]',
    '{"notes": "optimizado"}', 1, 1
);

INSERT INTO RouteTickets (
    routeId, ticketId, address, queue, createdBy, updatedBy
) VALUES (
    1, 1, '123 N Main St to 125 N Main St', 1, 1, 1
);

INSERT INTO Fines (
  ticketId,
  fineNumber,
  fineDate,
  paymentDate,
  amount,
  status,
  fineURL,
  createdBy,
  updatedBy
) VALUES (
  1,                 -- ticketId (relacionado al ticket con ticketId = 1)
  'FINE001',         -- fineNumber (número único de multa)
  '2024-07-10',      -- fineDate (fecha que se emitió la multa)
  NULL,              -- paymentDate (puede ser NULL si aún no se ha pagado)
  300.00,            -- amount (monto de la multa)
  'Outstanding',     -- status (estado, por ejemplo Outstanding, Paid, Pending)
  'http://example.com/fines/FINE001.pdf', -- fineURL (opcional, link al documento)
  1,                 -- createdBy (usuario que crea la entrada)
  1                  -- updatedBy (usuario que actualiza la entrada)
);

