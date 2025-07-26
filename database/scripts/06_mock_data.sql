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
  (12, 'JuanC', 'JuanC'),
  (13, 'Enrique', 'Enrique'),
  (14, 'Richard', 'Richard'),
  (15, 'Gabriel', 'Gabriel'),
  (16, 'Juan', 'Juan'),
  (17, 'Julian', 'Julian'),
  (18, 'Arturo', 'Arturo'),
  (19, 'LuisAlfredo', 'LuisAlfredo'),
  (20, 'Gregorio', 'Grgorio'),
  (21, 'EduardoD', 'EduardoD'),
  (22, 'Jorge', 'Jorge'),
  (23, 'Victor', 'Victor'),
  (24, 'Alejandro', 'Alejandro'),
  (25, 'Raul', 'Raul'),
  (26, 'Salvador', 'Salvador'),
  (27, 'Hector', 'Hector'),
  (28, 'Jesus', 'Jesus'),
  (29, 'Scott', 'Scott'),
  (30, 'Cesar', 'Cesar'),
  (31, 'Horacio', 'Horacio'),
  (32, 'Ismael', 'Ismael'),
  (33, 'Mario', 'Mario'),
  (34, 'Antonio', 'Antonio'),
  (35, 'Amparo', 'Amparo'),
  (36, 'Ramon', 'Ramon'),
  (37, 'Luis', 'Luis'),
  (38, 'Dionicio', 'Dionicio'),
  (39, 'CesarV', 'CesarV'),
  (40, 'Edward', 'Edward'),
  (41, 'Marcos', 'Marcos'),
  (42, 'CarlosA', 'CarlosA'),
  (43, 'DelaCruz', 'DelaCruz'),
  (44, 'Gustavo', 'Gustavo'),


-- Mock data for People
INSERT INTO People (employeeId, UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES
  (2, 2, 'Agustin', 'Landa', 'admin', '1234567890', 'Agustin@example.com', 1, 1),
  (3, 3, 'Iris', 'Landa', 'admin', '2345678901', 'Iris@example.com', 1, 1),
  (4, 4, 'Erick', 'Flores', 'admin', '3456789012', 'Erick@example.com', 1, 1),
  (5, 5, 'Christian', 'Barragan', 'operator', '3456789012', 'Christian@example.com', 1, 1),
  (6, 6, 'Elian', 'Medina', 'admin', '3456789012', 'Elian@example.com', 1, 1),
  (7, 7, 'Eva', 'Landa', 'admin', '3456789012', 'Eva@example.com', 1, 1),
  (8, 8, 'Laura', 'Mcqueen', 'operator', '3456789012', 'Laura@example.com', 1, 1),
  (9, 9, 'Nicolas', 'Alarcon', 'operator', '0000000000', 'Nicolas@example.com', 1, 1),
  (10, 10, 'Carlos', 'Aguayo', 'operator', '0000000000', 'Carlos@example.com', 1, 1),
  (11, 11, 'Eduardo', 'Barraza', 'operator', '0000000000', 'Eduardo@example.com', 1, 1),
  (12, 12, 'JuanC', 'Barraza', 'operator', '0000000000', 'JuanC@example.com', 1, 1),
  (13, 13, 'Enrique', 'Becerra', 'operator', '0000000000', 'Enrique@example.com', 1, 1),
  (14, 14, 'Richard', 'Burandt', 'operator', '0000000000', 'Richard@example.com', 1, 1),
  (15, 15, 'Gabriel', 'Cahue', 'operator', '0000000000', 'Gabriel@example.com', 1, 1),
  (16, 16, 'Juan', 'Camarena', 'operator', '0000000000', 'Juan@example.com', 1, 1),
  (17, 17, 'Julian', 'Ceja', 'operator', '0000000000', 'Julian@example.com', 1, 1),
  (18, 18, 'Arturo', 'Cahue', 'operator', '0000000000', 'Arturo@example.com', 1, 1),
  (19, 19, 'LuisAlfredo', 'Cisneros', 'operator', '0000000000', 'LuisAlfredo@example.com', 1, 1),
  (21, 20, 'Gregorio', 'Cuellar', 'operator', '0000000000', 'Grgorio@example.com', 1, 1),
  (22, 21, 'EduardoD', 'Diaz', 'operator', '0000000000', 'EduardoD@example.com', 1, 1),
  (23, 22, 'Jorge', 'Duran', 'operator', '0000000000', 'Jorge@example.com', 1, 1),
  (24, 23, 'Victor', 'Flores', 'operator', '0000000000', 'Victor@example.com', 1, 1),
  (25, 24, 'Alejandro', 'Gonzalez', 'operator', '0000000000', 'Alejandro@example.com', 1, 1),
  (26, 25, 'Raul', 'Guzman', 'operator', '0000000000', 'Raul@example.com', 1, 1),
  (27, 26, 'Salvador', 'Hernandez', 'operator', '0000000000', 'Salvador@example.com', 1, 1),
  (28, 27, 'Hector', 'Hernandez', 'operator', '0000000000', 'Hector@example.com', 1, 1),
  (29, 28, 'Jesus', 'Herrera', 'operator', '0000000000', 'Jesus@example.com', 1, 1),
  (30, 29, 'Scott', 'Kendall', 'operator', '0000000000', 'Scott@example.com', 1, 1),
  (31, 30, 'Cesar', 'Medina', 'operator', '0000000000', 'Cesar@example.com', 1, 1),
  (32, 31, 'Horacio', 'Rodriguez', 'operator', '0000000000', 'Horacio@example.com', 1, 1),
  (33, 32, 'Ismael', 'Romero', 'operator', '0000000000', 'Ismael@example.com', 1, 1),
  (34, 33, 'Mario', 'Romero', 'operator', '0000000000', 'Mario@example.com', 1, 1),
  (35, 34, 'Antonio', 'Rosalez', 'operator', '0000000000', 'Antonio@example.com', 1, 1),
  (36, 35, 'Amparo', 'Rosalez', 'operator', '0000000000', 'Amparo@example.com', 1, 1),
  (37, 36, 'Ramon', 'Solis', 'operator', '0000000000', 'Ramon@example.com', 1, 1),
  (38, 37, 'Luis', 'Tello', 'operator', '0000000000', 'Luis@example.com', 1, 1),
  (39, 38, 'Dionicio', 'Velaz', 'operator', '0000000000', 'Dionicio@example.com', 1, 1),
  (40, 39, 'CesarV', 'Vera', 'operator', '0000000000', 'CesarV@example.com', 1, 1),
  (41, 40, 'Edward', 'Watson', 'operator', '0000000000', 'Edward@example.com', 1, 1),
  (42, 41, 'Marcos', 'Armas', 'operator', '0000000000', 'Marcos@example.com', 1, 1),
  (43, 42, 'CarlosA', 'Arroyo', 'operator', '0000000000', 'CarlosA@example.com', 1, 1),
  (44, 43, 'DelaCruz', 'Enmergaudio', 'operator', '0000000000', 'DelaCruz@example.com', 1, 1),
  (45, 44, 'Gustavo', 'Hernandez', 'operator', '0000000000', 'Gustavo@example.com', 1, 1);

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
(15, 1, 5, 1, 1), -- Agustin - Labor
(16, 2, 4, 1, 1), -- Iris - Finisher
(17, 3, 4, 1, 1), -- Erick - Driver
(18, 4, 3, 1, 1), -- Christian - Machine
(19, 5, 5, 1, 1), -- Elian - Measure
(20, 6, 2, 1, 1), -- Eva - Spotter
(21, 1, 5, 1, 1), -- Laura - Labor
(22, 2, 4, 1, 1), -- Nicolas - Finisher
(23, 3, 4, 1, 1), -- Carlos - Driver
(24, 4, 3, 1, 1), -- Eduardo - Machine
(25, 5, 5, 1, 1), -- JuanC - Measure
(26, 6, 2, 1, 1), -- Enrique - Spotter
(27, 1, 5, 1, 1), -- Richard - Labor
(28, 2, 4, 1, 1), -- Gabriel - Finisher
(29, 3, 4, 1, 1), -- Juan - Driver
(30, 4, 3, 1, 1), -- Julian - Machine
(31, 5, 5, 1, 1), -- Arturo - Measure
(32, 6, 2, 1, 1), -- LuisAlfredo - Spotter
(33, 1, 5, 1, 1), -- JuanC Corral - Labor
(34, 2, 4, 1, 1), -- Grgorio - Finisher
(35, 3, 4, 1, 1), -- EduardoD - Driver
(36, 4, 3, 1, 1), -- Jorge - Machine
(37, 5, 5, 1, 1), -- Victor - Measure
(38, 6, 2, 1, 1), -- Alejandro - Spotter
(39, 1, 5, 1, 1), -- Raul - Labor
(40, 2, 4, 1, 1), -- Salvador - Finisher
(41, 3, 4, 1, 1), -- Hector - Driver
(42, 4, 3, 1, 1), -- Jesus - Machine
(43, 5, 5, 1, 1), -- Scott - Measure
(44, 6, 2, 1, 1), -- Cesar - Spotter
(45, 1, 5, 1, 1), -- Horacio - Labor
(46, 2, 4, 1, 1), -- Ismael - Finisher
(47, 3, 4, 1, 1), -- Mario - Driver
(48, 4, 3, 1, 1), -- Antonio - Machine
(49, 5, 5, 1, 1), -- Amparo - Measure
(50, 6, 2, 1, 1), -- Ramon - Spotter
(51, 1, 5, 1, 1), -- Luis - Labor
(52, 2, 4, 1, 1), -- Dionicio - Finisher
(53, 3, 4, 1, 1), -- CesarV - Driver
(54, 4, 3, 1, 1), -- Edward - Machine
(55, 5, 5, 1, 1), -- Marcos - Measure
(56, 6, 2, 1, 1), -- CarlosA - Spotter
(57, 1, 5, 1, 1), -- DelaCruz - Labor
(58, 2, 4, 1, 1); -- Gustavo - Finisher





