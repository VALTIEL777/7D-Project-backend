INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy)
VALUES (
    'VCNA Prairie Materials',
    '324180400',
    'vgorembew@prairie.com',
    '7601 W. 79th Street',
    1, 1  -- Assuming user ID 1 is creating/updating
);

-- Insert inventory items with their standard costs
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (1, 'Winter Service Charges', 15.00, 'CY', 1, 1),
    (1, 'Environmental Charge', 3.25, 'CY', 1, 1),
    (1, 'Non-Chloride Accelerator 1%', 10.75, 'CY', 1, 1),
    (1, 'Calcium Chloride 1%', 3.35, 'CY', 1, 1),
    (1, 'Retarder', 4.70, 'CY', 1, 1),
    (1, 'Fibrillated Fibers (1.5 lb bag)', 12.00, 'CY', 1, 1),
    (1, 'Mono Fibers', 9.00, 'CY', 1, 1);
    
-- Insert project-priced items with NULL costPerUnit
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (1, 'Strux Fiber', NULL, 'Project', 1, 1),
    (1, 'Forta Ferro Fiber', NULL, 'Project', 1, 1),
    (1, 'CNI', NULL, 'Project', 1, 1),
    (1, 'Steel or Blended fibers', NULL, 'Project', 1, 1);


INSERT INTO Equipment (supplierId, equipmentName, owner, type, hourlyRate, hoursLent, observation, createdBy, updatedBy)
VALUES (
    1, 
    'Mixer Truck Rental', 
    'VCNA Prairie Materials', 
    'vehicle', 
    195.00, 
    8,  -- 8 hour minimum
    '8 hour minimum rental', 
    1, 1
);
-----------------------------------------------------------------------------------------------------------
INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy)
VALUES (
    'Vulcan Materials Company',
    '2242273406',
    NULL,  -- Email not provided in the document
    '3910 S Racine Ave, Chicago, IL ',  
    1, 1  -- Assuming user ID 1 is creating/updating
);


-- Insert aggregate products (grouping similar products across plants)
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (2, 'Rip Rap RR#4', NULL, 'ton', 1, 1),
    (2, 'Rip Rap RR#3', NULL, 'ton', 1, 1),
    (2, 'CA-1 Stone', NULL, 'ton', 1, 1),
    (2, 'Rip Rap RR#2', NULL, 'ton', 1, 1),
    (2, '3" -1" Stone', NULL, 'ton', 1, 1),
    (2, 'CA-3 Stone', NULL, 'ton', 1, 1),
    (2, 'CA-5 Stone', NULL, 'ton', 1, 1),
    (2, '1 1/2" Stone', NULL, 'ton', 1, 1),
    (2, 'Cert CM-06', NULL, 'ton', 1, 1),
    (2, 'CA-7 Bedding Stone', NULL, 'ton', 1, 1),
    (2, 'CA-11 Stone', NULL, 'ton', 1, 1),
    (2, 'CA-16 Bedding', NULL, 'ton', 1, 1),
    (2, 'FA-5 Screenings', NULL, 'ton', 1, 1),
    (2, 'FA-6', NULL, 'ton', 1, 1),
    (2, 'Rip Rap RR#7', NULL, 'ton', 1, 1),
    (2, 'Rip Rap RR#6', NULL, 'ton', 1, 1),
    (2, 'Rip Rap RR#5', NULL, 'ton', 1, 1),
    (2, '4" - 1" Stone', NULL, 'ton', 1, 1),
    (2, '1/2" Stone', NULL, 'ton', 1, 1),
    (2, 'Cert CM-10 Stone', NULL, 'ton', 1, 1),
    (2, '3/8" Chips', NULL, 'ton', 1, 1),
    (2, 'Aglime', NULL, 'ton', 1, 1),
    (2, 'Fine Aglime', NULL, 'ton', 1, 1);

-- Insert recycled materials
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (2, 'CS01 (r)', NULL, 'ton', 1, 1),
    (2, '3" -1" (r)', NULL, 'ton', 1, 1),
    (2, '1" Bedding (r)', NULL, 'ton', 1, 1),
    (2, 'FA-6 (r)', NULL, 'ton', 1, 1),
    (2, 'CM-6 (R) D Quality', NULL, 'ton', 1, 1),
    (2, 'CM-6 (r) Cap/tbf', NULL, 'ton', 1, 1);

-- Insert tipping fee services
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (2, 'Hard To Hndl-Semi', NULL, 'load', 1, 1),
    (2, 'Conc Dump-Semi', NULL, 'load', 1, 1),
    (2, 'Conc Dump-6wh', NULL, 'load', 1, 1),
    (2, 'Conc Dump-4wh', NULL, 'load', 1, 1),
    (2, 'CCDD Dump - Semi', NULL, 'load', 1, 1),
    (2, 'CCDD IEPA Fee', NULL, 'load', 1, 1);

-----------------------------------------------------------------------------------------------------------
INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy)
VALUES (
    'Heidelberg Materials',
    '8157618696',
    'leaticia.khan@heidelbergmaterials.com',
    '3101 S Damen Ave, Chicago, IL',  -- Using customer address since supplier address isn't provided
    1, 1  -- Assuming user ID 1 is creating/updating
);


-- Insert aggregate products
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (3, 'Mason Sand', NULL, 'ton', 1, 1),
    (3, 'FA02 - Natural Sand', NULL, 'ton', 1, 1),
    (3, 'FA05 - Screenings', NULL, 'ton', 1, 1),
    (3, 'FA06 - Trench Backfill', NULL, 'ton', 1, 1),
    (3, 'CA01 / RR02 - 3" Stone', NULL, 'ton', 1, 1),
    (3, 'CA03 / RR01 / IN 2 - 2" Stone', NULL, 'ton', 1, 1),
    (3, 'CA05 / IN 5 - 1 1/2" Stone', NULL, 'ton', 1, 1),
    (3, 'CA06 / IN 53 - Graded Base', NULL, 'ton', 1, 1),
    (3, 'CA07 / IND 8 Comm - 3/4" Stone', NULL, 'ton', 1, 1),
    (3, 'CA11 / IND 8 Washed - 3/4" Stone', NULL, 'ton', 1, 1),
    (3, 'CA16 - 3/8" Chip', NULL, 'ton', 1, 1),
    (3, 'CS01 - PGE Surge', NULL, 'ton', 1, 1),
    (3, 'RR03', NULL, 'ton', 1, 1),
    (3, 'RR04 / Reverment', NULL, 'ton', 1, 1),
    (3, 'RR05', NULL, 'ton', 1, 1),
    (3, 'RR06 / Class 2', NULL, 'ton', 1, 1),
    (3, 'RR07', NULL, 'ton', 1, 1),
    (3, 'Turf Aggregate / PGB', NULL, 'ton', 1, 1),
    (3, 'Birds Eye Pea Gravel', NULL, 'ton', 1, 1),
    (3, 'CCDD Disposal Fee', NULL, 'load', 1, 1);

---------------------------------------------------------------------------------------------------------------------

INSERT INTO Suppliers (name, phone, email, address, createdBy, updatedBy)
VALUES (
    'Ogden Avenue Materials',
    '3127380600',
    NULL,  -- Email not provided in the document
    '935 W Chestnut St., Suite 100, Chicago, IL 60642-5448',
    1, 1  -- Assuming user ID 1 is creating/updating
);

-- Insert asphalt products
INSERT INTO Inventory (supplierId, name, costPerUnit, unit, createdBy, updatedBy)
VALUES 
    (4, 'N50 IL-19.0', 67.00, 'ton', 1, 1),
    (4, 'N50 IL-9.5', 70.00, 'ton', 1, 1),
    (4, 'N70 IL-19.0', 68.00, 'ton', 1, 1),
    (4, 'N70 IL-9.5', 72.00, 'ton', 1, 1),
    (4, 'N30 IL-9.5', 67.00, 'ton', 1, 1),
    (4, 'PRIVATE SURFACE', 65.00, 'ton', 1, 1),
    (4, 'EMULSION PAILS', 50.00, 'each', 1, 1),
    (4, 'DUMP GRINDINGS 4 WHL', 150.00, 'load', 1, 1),
    (4, 'DUMP GRINDINGS 6 WHL', 180.00, 'load', 1, 1),
    (4, 'DUMP GRINDINGS SEMI', 180.00, 'load', 1, 1),
    (4, 'I-FIT verified mix designs', NULL, 'project', 1, 1),
    (4, 'Additional Superpave mixes', NULL, 'project', 1, 1);







