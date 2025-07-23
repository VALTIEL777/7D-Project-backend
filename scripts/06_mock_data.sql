-- Mock data for Users
INSERT INTO Users ( username, password) VALUES
  ('Agustin', 'Agustin'),
  ('Iris', 'Iris'),
  ('Erick', 'Erick'),
  ('Christian', 'Christian'),
  ('Elian', 'Elian'),
  ('Eva', 'Eva'),
  ('Laura', 'laura123'),
  ('Nicolas', 'Nicolas'),
('Carlos', 'Carlos'),
('Eduardo', 'Eduardo'),
('JuanC', 'JuanC'),
('Enrique', 'Enrique'),
('Richard', 'Richard'),
('Gabriel', 'Gabriel'),
('Juan', 'Juan'),
('Julian', 'Julian'),
('Arturo', 'Arturo'),
('LuisAlfredo', 'LuisAlfredo'),
('Grgorio', 'Grgorio'),
('EduardoD', 'EduardoD'),
('Jorge', 'Jorge'),
('Victor', 'Victor'),
('Alejandro', 'Alejandro'),
('Raul', 'Raul'),
('Salvador', 'Salvador'),
('Hector', 'Hector'),
('Jesus', 'Jesus'),
('Scott', 'Scott'),
('Cesar', 'Cesar'),
('Horacio', 'Horacio'),
('Ismael', 'Ismael'),
('Mario', 'Mario'),
('Antonio', 'Antonio'),
('Amparo', 'Amparo'),
('Ramon', 'Ramon'),
('Luis', 'Luis'),
('Dionicio', 'Dionicio'),
('CesarV', 'CesarV'),
('Edward', 'Edward'),
('Marcos', 'Marcos'),
('CarlosA', 'CarlosA'),
('DelaCruz', 'DelaCruz'),
('Gustavo', 'Gustavo'),
('Javier', 'Javier');


-- Mock data for People
INSERT INTO People ( UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
  ( 2, 'Agustin', 'Landa', 'admin', '1234567890', 'Agustin@example.com', 1, 1),
  ( 3, 'Iris', 'Landa', 'admin', '2345678901', 'Iris@example.com', 1, 1),
  ( 4, 'Erick', 'Flores', 'admin', '3456789012', 'Erick@example.com', 1, 1),
  ( 5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  ( 5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  ( 6, 'Elian', 'Medina', 'admin', '3456789012', 'Elian@example.com', 1, 1),
  ( 7, 'Eva', 'Landa', 'admin', '3456789012', 'Eva@example.com', 1, 1),
   ( 8, 'Laura', 'Mcqueen', 'operator', '3456789012', 'Eva@example.com', 1, 1),
   (9, 'Nicolas', 'Alarcon', 'operator', '0000000000', 'Nicolas@example.com', 1, 1),
(10, 'Carlos', 'Aguayo', 'operator', '0000000000', 'Carlos@example.com', 1, 1),
(11, 'Eduardo', 'Barraza', 'operator', '0000000000', 'Eduardo@example.com', 1, 1),
(12, 'Juan C', 'Barraza', 'operator', '0000000000', 'JuanC@example.com', 1, 1),
(13, 'Enrique', 'Becerra', 'operator', '0000000000', 'Enrique@example.com', 1, 1),
(14, 'Richard', 'Burandt', 'operator', '0000000000', 'Richard@example.com', 1, 1),
(15, 'Gabriel', 'Cahue', 'operator', '0000000000', 'Gabriel@example.com', 1, 1),
(16, 'Juan', 'Camarena', 'operator', '0000000000', 'Juan@example.com', 1, 1),
(17, 'Julian', 'Ceja', 'operator', '0000000000', 'Julian@example.com', 1, 1),
(18, 'Arturo', 'Cahue', 'operator', '0000000000', 'Arturo@example.com', 1, 1),
(19, 'Luis Alfredo', 'Cisneros', 'operator', '0000000000', 'LuisAlfredo@example.com', 1, 1),
(20, 'Juan C', 'Corral', 'operator', '0000000000', 'JuanC@example.com', 1, 1),
(21, 'Grgorio', 'Cuellar', 'operator', '0000000000', 'Grgorio@example.com', 1, 1),
(22, 'Eduardo', 'Diaz', 'operator', '0000000000', 'EduardoD@example.com', 1, 1),
(23, 'Jorge', 'Duran', 'operator', '0000000000', 'Jorge@example.com', 1, 1),
(24, 'Victor', 'Flores', 'operator', '0000000000', 'Victor@example.com', 1, 1),
(25, 'Alejandro', 'Gonzalez', 'operator', '0000000000', 'Alejandro@example.com', 1, 1),
(26, 'Raul', 'Guzman', 'operator', '0000000000', 'Raul@example.com', 1, 1),
(27, 'Salvador', 'Hernandez', 'operator', '0000000000', 'Salvador@example.com', 1, 1),
(28, 'Hector', 'Hernandez', 'operator', '0000000000', 'Hector@example.com', 1, 1),
(29, 'Jesus', 'Herrera', 'operator', '0000000000', 'Jesus@example.com', 1, 1),
(30, 'Scott', 'Kendall', 'operator', '0000000000', 'Scott@example.com', 1, 1),
(31, 'Cesar', 'Medina', 'operator', '0000000000', 'Cesar@example.com', 1, 1),
(32, 'Horacio', 'Rodriguez', 'operator', '0000000000', 'Horacio@example.com', 1, 1),
(33, 'Ismael', 'Romero', 'operator', '0000000000', 'Ismael@example.com', 1, 1),
(34, 'Mario', 'Romero', 'operator', '0000000000', 'Mario@example.com', 1, 1),
(35, 'Antonio', 'Rosalez', 'operator', '0000000000', 'Antonio@example.com', 1, 1),
(36, 'Amparo', 'Rosalez', 'operator', '0000000000', 'Amparo@example.com', 1, 1),
(37, 'Ramon', 'Solis', 'operator', '0000000000', 'Ramon@example.com', 1, 1),
(38, 'Luis', 'Tello', 'operator', '0000000000', 'Luis@example.com', 1, 1),
(39, 'Dionicio', 'Velaz', 'operator', '0000000000', 'Dionicio@example.com', 1, 1),
(40, 'Cesar', 'Vera', 'operator', '0000000000', 'CesarV@example.com', 1, 1),
(41, 'Edward', 'Watson', 'operator', '0000000000', 'Edward@example.com', 1, 1),
(42, 'Marcos', 'Armas', 'operator', '0000000000', 'Marcos@example.com', 1, 1),
(43, 'Carlos', 'Arroyo', 'operator', '0000000000', 'CarlosA@example.com', 1, 1),
(44, 'De la Cruz', 'Enmergaudio', 'operator', '0000000000', 'DelaCruz@example.com', 1, 1),
(45, 'Gustavo', 'Hernandez', 'operator', '0000000000', 'Gustavo@example.com', 1, 1),
(46, 'Javier', 'Ontiveros', 'operator', '0000000000', 'Javier@example.com', 1, 1);


-- Mock data for Payments
INSERT INTO Payments (checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES
  (1, 'PAY001', '2024-01-01', 1000.00, 'Completed', 'http://pay1.com', 1, 1),
  (2, 'PAY002', '2024-01-02', 2000.00, 'Pending', 'http://pay2.com', 2, 2),
  (3, 'PAY003', '2024-01-03', 1500.00, 'Completed', 'http://pay3.com', 3, 3);


-- Mock data for Skills
INSERT INTO Skills (skillId, name, description, createdBy, updatedBy) VALUES
  (1, 'Labor', 'Labor skills', 1, 1),
  (2, 'Finisher', 'Finisher skills', 1, 1),
  (3, 'Driver', 'Driving different types of vehicles', 1, 1),
  (4, 'Machine', 'Operating heavy machinery', 1, 1),
  (5, 'Measure', 'Measurement and leveling skills', 1, 1),  
  (6, 'Spotter', 'Spotter skills', 1, 1);


-- Mock data for EmployeeSkills con nuevos employeeId
INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy) VALUES
  (15, 1, 5, 1, 1), -- Agustin - Welding (Expert)
  (16, 2, 4, 1, 1), -- Iris - Plumbing (Advanced)
  (15, 3, 4, 1, 1), -- Agustin - Driver
  (15, 4, 3, 1, 1), -- Agustin - Tool
  (16, 5, 5, 1, 1), -- Iris - Machine
  (17, 6, 2, 1, 1), -- Erick - Measure (Basic)
   (18, 1, 5, 1, 1), -- Christian - Welding (Expert)
  (19, 2, 4, 1, 1), -- Elian - Plumbing (Advanced)
  (20, 3, 4, 1, 1), -- Eva - Driver
  (20, 4, 3, 1, 1), -- Eva - Tool
  (19, 5, 5, 2, 2), -- Elian - Machine
  (21, 6, 2, 1, 1), -- Laura - Measure (Basic)
(9, 1, 5, 1, 1),   -- Nicolas Alarcon - LABOR
(10, 1, 5, 1, 1),  -- Carlos Aguayo - LABOR
(11, 1, 5, 1, 1),  -- Eduardo Barraza - LABOR
(12, 1, 5, 1, 1),  -- Juan C Barraza - LABOR
(13, 3, 5, 1, 1),  -- Enrique Becerra - OPERATOR
(14, 1, 5, 1, 1),  -- Richard Burandt - LABOR
(15, 1, 5, 1, 1),  -- Gabriel Cahue - LABOR
(16, 1, 5, 1, 1),  -- Juan Camarena - LABOR
(17, 1, 5, 1, 1),  -- Julian Ceja - LABOR
(18, 1, 5, 1, 1),  -- Arturo Cahue - LABOR
(19, 1, 5, 1, 1),  -- Luis Alfredo Cisneros - LABOR
(20, 1, 5, 1, 1),  -- Juan C Corral - LABOR
(21, 1, 5, 1, 1),  -- Grgorio Cuellar - LABOR
(22, 2, 5, 1, 1),  -- Eduardo Diaz - FINISHER
(23, 1, 5, 1, 1),  -- Jorge Duran - LABOR
(24, 3, 5, 1, 1),  -- Victor Flores - OPERATOR
(25, 1, 5, 1, 1),  -- Alejandro Gonzalez - LABOR
(26, 1, 5, 1, 1),  -- Raul Guzman - LABOR
(27, 1, 5, 1, 1),  -- Salvador Hernandez - LABOR
(28, 2, 5, 1, 1),  -- Hector Hernandez - FINISHER
(29, 1, 5, 1, 1),  -- Jesus Herrera - LABOR
(30, 3, 5, 1, 1),  -- Scott Kendall - OPERATOR
(31, 1, 5, 1, 1),  -- Juan Lopez - LABOR
(32, 1, 5, 1, 1),  -- Cesar Medina - LABOR
(33, 1, 5, 1, 1),  -- Jorge Mojica - LABOR
(34, 1, 5, 1, 1),  -- Carlos Montoya - LABOR
(35, 1, 5, 1, 1),  -- Juan Carlos Reyes - LABOR
(36, 1, 5, 1, 1),  -- Horacio Rodriguez - LABOR
(37, 1, 5, 1, 1),  -- Ismael Romero - LABOR
(38, 1, 5, 1, 1),  -- Mario Romero - LABOR
(39, 1, 5, 1, 1),  -- Antonio Rosalez - LABOR
(40, 1, 5, 1, 1),  -- Amparo Rosalez - LABOR
(41, 1, 5, 1, 1),  -- Ramon Solis - LABOR
(42, 1, 5, 1, 1),  -- Luis Tello - LABOR
(43, 1, 5, 1, 1),  -- Jesus Valdez - LABOR
(44, 1, 5, 1, 1),  -- Dionicio Veloz - LABOR
(45, 2, 5, 1, 1),  -- Cesar Vera - FINISHER
(46, 1, 5, 1, 1),  -- Edward Watson - LABOR
(47, 1, 5, 1, 1),  -- Marcos Armas - LABOR
(48, 6, 5, 1, 1),  -- Carlos Arroyo - SPOTTER
(49, 6, 5, 1, 1),  -- De la Cruz Enmergaudio - SPOTTER
(50, 6, 5, 1, 1),  -- Gustavo Hernandez - SPOTTER
(51, 6, 5, 1, 1);  -- Javier Ontiveros - SPOTTER



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

