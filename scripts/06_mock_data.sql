-- Mock data for Users
INSERT INTO Users (UserId, username, password) VALUES
  (2, 'Agustin', 'Agustin'),
  (3, 'Iris', 'Iris'),
  (4, 'Erick', 'Erick'),
  (5, 'Christian', 'Christian'),
  (6, 'Elian', 'Elian'),
  (7, 'Eva', 'Eva'),
  (8, 'Laura', 'laura123'),
  (9, 'Nicolas', 'Nicolas'),
  (10, 'Carlos', 'Carlos'),
  (11, 'Eduardo', 'Eduardo'),
  (12, 'JuanB', 'JuanB'),
  (13, 'Enrique', 'Enrique'),
  (14, 'Richard', 'Richard'),
  (15, 'Arturo', 'Arturo'),
  (16, 'Gabriel', 'Gabriel'),
  (17, 'JuanCamarena', 'JuanCamarena'),
  (18, 'Julian', 'Julian'),
  (19, 'LuisAlfredo', 'LuisAlfredo'),
  (20, 'JuanCorral', 'JuanCorral'),
  (21, 'Grgorio', 'Grgorio'),
  (22, 'EduardoD', 'EduardoD'),
  (23, 'EnriqueD', 'EnriqueD'),
  (24, 'Jorge', 'Jorge'),
  (25, 'Victor', 'Victor'),
  (26, 'AlejandroG', 'AlejandroG'),
  (27, 'Raul', 'Raul'),
  (28, 'SalvadorH', 'SalvadorH'),
  (29, 'HectorH', 'HectorH'),
  (30, 'JesusH', 'JesusH'),
  (31, 'ScottK', 'ScottK'),
  (32, 'JuanLopez', 'JuanLopez'),
  (33, 'CesarM', 'CesarM'),
  (34, 'Jorge Mojica', 'JorgeMojica'),
  (35, 'Carlos Montoya', 'CarlosMontoya'),
  (36, 'JuanCarlos', 'JuanCarlos'),
  (37, 'HoracioR', 'HoracioR'),
  (38, 'IsmaelR', 'IsmaelR'),
  (39, 'MarioR', 'MarioR'),
  (40, 'AntonioR', 'AntonioR'),
  (41, 'AmparoR', 'AmparoR'),
  (42, 'RamonS', 'RamonS'),
  (43, 'LuisT', 'LuisT'),
  (44, 'Jesus Valdez', 'JesusValdez'),
  (45, 'DionicioV', 'DionicioV'),
  (46, 'CesarV', 'CesarV'),
  (47, 'EdwardW', 'EdwardW'),
  (48, 'MarcosA', 'MarcosA'),
  (49, 'CarlosA', 'CarlosA'),
  (50, 'DelaCruzE', 'Delacruz'),
  (51, 'GustavoH', 'GustavoH'),
  (52, 'JavierO', 'JavierO');


-- Mock data for People
INSERT INTO People (UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
  (2, 'Agustin', 'Landa', 'admin', '1234567890', 'Agustin@example.com', 1, 1),
  (3, 'Iris', 'Landa', 'admin', '2345678901', 'Iris@example.com', 1, 1),
  (4, 'Erick', 'Flores', 'admin', '3456789012', 'Erick@example.com', 1, 1),
  (5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  (6, 'Elian', 'Medina', 'admin', '3456789012', 'Elian@example.com', 1, 1),
  (7, 'Eva', 'Landa', 'admin', '3456789012', 'Eva@example.com', 1, 1),
  (8, 'Laura', 'Mcqueen', 'operator', '3456789012', 'Laura@example.com', 1, 1),
  (9, 'Nicolas', 'Alarcon', 'operator', '0000000000', 'Nicolas@example.com', 1, 1),
  (10, 'Carlos', 'Aguayo', 'operator', '0000000000', 'Carlos@example.com', 1, 1),
  (11, 'Eduardo', 'Barraza', 'operator', '0000000000', 'Eduardo@example.com', 1, 1),
  (12, 'Juan', 'Barraza', 'operator', '0000000000', 'JuanC@example.com', 1, 1),
  (13, 'Enrique', 'Becerra', 'operator', '0000000000', 'Enrique@example.com', 1, 1),
  (14, 'Richard', 'Burandt', 'operator', '0000000000', 'Richard@example.com', 1, 1),
  (15, 'Arturo', 'Cahue', 'operator', '0000000000', 'Arturo@example.com', 1, 1),
  (16, 'Gabriel', 'Cahue', 'operator', '0000000000', 'Gabriel@example.com', 1, 1),
  (17, 'Juan', 'Camarena', 'operator', '0000000000', 'Juan@example.com', 1, 1),
  (18, 'Julian', 'Ceja', 'operator', '0000000000', 'Julian@example.com', 1, 1),
  (19, 'LuisAlfredo', 'Cisneros', 'operator', '0000000000', 'LuisAlfredo@example.com', 1, 1),
  (20, 'Juan', 'Corral', 'operator', '0000000000', 'JuanC@example.com', 1, 1),
  (21, 'Grgorio', 'Cuellar', 'operator', '0000000000', 'Grgorio@example.com', 1, 1),
  (22, 'EduardoD', 'Diaz', 'operator', '0000000000', 'EduardoD@example.com', 1, 1),
  (23, 'EnriqueD', 'Diaz', 'operator', '0000000000', 'EnriqueD@example.com', 1, 1),
  (24, 'Jorge', 'Duran', 'operator', '0000000000', 'Jorge@example.com', 1, 1),
  (25, 'Victor', 'Flores', 'operator', '0000000000', 'Victor@example.com', 1, 1),
  (26, 'Alejandro', 'Gonzalez', 'operator', '0000000000', 'Alejandro@example.com', 1, 1),
  (27, 'Raul', 'Guzman', 'operator', '0000000000', 'Raul@example.com', 1, 1),
  (28, 'Salvador', 'Hernandez', 'operator', '0000000000', 'Salvador@example.com', 1, 1),
  (29, 'Hector', 'Hernandez', 'operator', '0000000000', 'Hector@example.com', 1, 1),
  (30, 'Jesus', 'Herrera', 'operator', '0000000000', 'JesusH@example.com', 1, 1),
  (31, 'Scott', 'Kendall', 'operator', '0000000000', 'Scott@example.com', 1, 1),
  (32, 'Juan', 'Lopez', 'operator', '0000000000', 'JuanL@example.com', 1, 1),  
  (33, 'Cesar', 'Medina', 'operator', '0000000000', 'CesarM@example.com', 1, 1),
  (34, 'Jorge', 'Mojica', 'operator', '0000000000', 'Jorge.Mojica@example.com', 1, 1),
  (35, 'Carlos', 'Montoya', 'operator', '0000000000', 'Carlos.Montoya@example.com', 1, 1),  
  (36, 'Juan Carlos', 'Reyes', 'operator', '0000000000', 'JuanCarlos.Reyes@example.com', 1, 1),  
  (37, 'Horacio', 'Rodriguez', 'operator', '0000000000', 'Horacio@example.com', 1, 1),
  (38, 'Ismael', 'Romero', 'operator', '0000000000', 'Ismael@example.com', 1, 1),
  (39, 'Mario', 'Romero', 'operator', '0000000000', 'Mario@example.com', 1, 1),
  (40, 'Antonio', 'Rosalez', 'operator', '0000000000', 'Antonio@example.com', 1, 1),
  (41, 'Amparo', 'Rosalez', 'operator', '0000000000', 'Amparo@example.com', 1, 1),
  (42, 'Ramon', 'Solis', 'operator', '0000000000', 'Ramon@example.com', 1, 1),
  (43, 'Luis', 'Tello', 'operator', '0000000000', 'Luis@example.com', 1, 1),
  (44, 'Jesus', 'Valdez', 'operator', '0000000000', 'Jesus.Valdez@example.com', 1, 1),
  (45, 'Dionicio', 'Veloz', 'operator', '0000000000', 'Dionicio@example.com', 1, 1),
  (46, 'Cesar', 'Vera', 'operator', '0000000000', 'CesarV@example.com', 1, 1),
  (47, 'Edward', 'Watson', 'operator', '0000000000', 'Edward@example.com', 1, 1),
  (48, 'Marcos', 'Armas', 'operator', '0000000000', 'Marcos@example.com', 1, 1),
  (49, 'Carlos', 'Arroyo', 'operator', '0000000000', 'CarlosA@example.com', 1, 1),
  (50, 'DelaCruz', 'Enmergaudio', 'operator', '0000000000', 'DelaCruz@example.com', 1, 1),
  (51, 'Gustavo', 'Hernandez', 'operator', '0000000000', 'Gustavo@example.com', 1, 1),
  (52, 'Javier', 'Ontiveros', 'operator', '0000000000', 'Javier.Ontiveros@example.com', 1, 1);


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

-- Mock data for EmployeeSkills solo para los empleados especificados
INSERT INTO EmployeeSkills (employeeId, skillId, proficiencyLevel, createdBy, updatedBy) VALUES
  (15, 1, 5, 1, 1),   -- Agustin Landa - Labor
  (16, 2, 4, 1, 1),   -- Iris Landa - Finisher
  (17, 3, 3, 1, 1),   -- Erick Flores - Driver
  (18, 4, 5, 1, 1),   -- Christian Barragan - Machine
  (19, 5, 4, 1, 1),   -- Elian Medina - Measure
  (20, 6, 3, 1, 1),   -- Eva Landa - Spotter
  (21, 1, 5, 1, 1),   -- Laura Mcqueen - Labor
  (22, 2, 4, 1, 1),   -- Nicolas Alarcon - Finisher
  (23, 3, 3, 1, 1),   -- Carlos Aguayo - Driver
  (24, 4, 5, 1, 1),   -- Eduardo Barraza - Machine
  (25, 5, 4, 1, 1),   -- Juan Barraza - Measure
  (26, 6, 3, 1, 1),   -- Enrique Becerra - Spotter
  (27, 1, 5, 1, 1),   -- Richard Burandt - Labor
  (28, 2, 4, 1, 1),   -- Arturo Cahue - Finisher
  (29, 3, 3, 1, 1),   -- Gabriel Cahue - Driver
  (30, 4, 5, 1, 1),   -- Juan Camarena - Machine
  (31, 5, 4, 1, 1),   -- Julian Ceja - Measure
  (32, 6, 3, 1, 1),   -- LuisAlfredo Cisneros - Spotter
  (33, 1, 5, 1, 1),   -- Juan Corral - Labor
  (34, 2, 4, 1, 1),   -- Grgorio Cuellar - Finisher
  (35, 3, 3, 1, 1),   -- EduardoD Diaz - Driver
  (36, 4, 5, 1, 1),   -- EnriqueD Diaz - Machine
  (37, 5, 4, 1, 1),   -- Jorge Duran - Measure
  (38, 6, 3, 1, 1),   -- Victor Flores - Spotter
  (39, 1, 5, 1, 1),   -- Alejandro Gonzalez - Labor
  (40, 2, 4, 1, 1),   -- Raul Guzman - Finisher
  (41, 3, 3, 1, 1),   -- Salvador Hernandez - Driver
  (42, 4, 5, 1, 1),   -- Hector Hernandez - Machine
  (43, 5, 4, 1, 1),   -- Jesus Herrera - Measure
  (44, 6, 3, 1, 1),   -- Scott Kendall - Spotter
  (45, 1, 5, 1, 1),   -- Juan Lopez - Labor
  (46, 2, 4, 1, 1),   -- Cesar Medina - Finisher
  (47, 3, 3, 1, 1),   -- Jorge Mojica - Driver
  (48, 4, 5, 1, 1),   -- Carlos Montoya - Machine
  (49, 5, 4, 1, 1),   -- Juan Carlos Reyes - Measure
  (50, 6, 3, 1, 1),   -- Horacio Rodriguez - Spotter
  (51, 1, 5, 1, 1),   -- Ismael Romero - Labor
  (52, 2, 4, 1, 1),   -- Mario Romero - Finisher
  (53, 3, 3, 1, 1),   -- Antonio Rosalez - Driver
  (54, 4, 5, 1, 1),   -- Amparo Rosalez - Machine
  (55, 5, 4, 1, 1),   -- Ramon Solis - Measure
  (56, 6, 3, 1, 1),   -- Luis Tello - Spotter
  (57, 1, 5, 1, 1),   -- Jesus Valdez - Labor
  (58, 2, 4, 1, 1),   -- Dionicio Veloz - Finisher
  (59, 3, 3, 1, 1),   -- Cesar Vera - Driver
  (60, 4, 5, 1, 1),   -- Edward Watson - Machine
  (61, 5, 4, 1, 1),   -- Marcos Armas - Measure
  (62, 6, 3, 1, 1),   -- Carlos Arroyo - Spotter
  (63, 6, 5, 1, 1),   -- DelaCruz Enmergaudio - Spotter
  (64, 6, 4, 1, 1),   -- Gustavo Hernandez - Spotter
  (65, 6, 3, 1, 1);   -- Javier Ontiveros -   Sppotter



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

-- Spotting
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (8, 1, 1, 1, 1);

-- Grind
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (6, 1, 1, 1, 1);

-- Asphalt
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (12, 1, 1, 1, 1);

-- Crack Seal
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (9, 1, 1, 1, 1);

-- Stripping (opcional)
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (7, 1, 1, 1, 1);

-- Install Signs (opcional)
INSERT INTO TicketStatus (taskStatusId, ticketId, crewId, createdBy, updatedBy)
VALUES (10, 1, 1, 1, 1);