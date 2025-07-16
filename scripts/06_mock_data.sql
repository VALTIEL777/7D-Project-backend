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
  (2, 'Plumbing', 'Plumbing skills', 2, 2);


