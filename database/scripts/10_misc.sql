ALTER TABLE PhotoEvidence
ADD COLUMN thumbnailURL TEXT;

ALTER TABLE usedEquipment
ADD COLUMN retrievalCrewId INTEGER REFERENCES Crews(crewId);

-- Add ticketId column (nullable initially to allow existing data)
ALTER TABLE usedEquipment
ADD COLUMN ticketId INTEGER REFERENCES Tickets(ticketId);
