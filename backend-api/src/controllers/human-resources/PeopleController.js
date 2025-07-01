const People = require('../../models/human-resources/People');
const Quadrants = require('../../models/location/Quadrants');

// Helper function to normalize database response to camelCase
const normalizePerson = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    employeeId: dbRecord.employeeid,
    userId: dbRecord.userid ? Number(dbRecord.userid) : null,
    firstname: dbRecord.firstname,
    lastname: dbRecord.lastname,
    role: dbRecord.role,
    phone: dbRecord.phone,
    email: dbRecord.email,
    createdBy: dbRecord.createdby ? Number(dbRecord.createdby) : null,
    updatedBy: dbRecord.updatedby ? Number(dbRecord.updatedby) : null,
    createdAt: dbRecord.createdat,
    updatedAt: dbRecord.updatedat,
    deletedAt: dbRecord.deletedat
  };
};

// Helper function to normalize person with quadrants
const normalizePersonWithQuadrants = (dbRecord) => {
  if (!dbRecord) return null;
  
  const normalizedPerson = normalizePerson(dbRecord);
  
  // Parse and normalize assigned quadrants
  let assignedQuadrants = [];
  if (dbRecord.assignedquadrants) {
    try {
      // Handle both string and array cases
      const quadrantsData = typeof dbRecord.assignedquadrants === 'string' 
        ? JSON.parse(dbRecord.assignedquadrants) 
        : dbRecord.assignedquadrants;
      
      if (Array.isArray(quadrantsData)) {
        assignedQuadrants = quadrantsData.map(quadrant => ({
          quadrantId: Number(quadrant.quadrantId),
          name: quadrant.name,
          shop: quadrant.shop,
          zone: quadrant.zone,
          relationship: quadrant.relationship
        }));
      }
    } catch (error) {
      console.error('Error parsing assigned quadrants:', error);
      console.error('Raw assignedQuadrants data:', dbRecord.assignedquadrants);
      assignedQuadrants = [];
    }
  }
  
  return {
    ...normalizedPerson,
    assignedQuadrants
  };
};

const PeopleController = {
  async createPeople(req, res) {
    try {
      const { UserId, firstname, lastname, role, phone, email, createdBy, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericUserId = UserId ? Number(UserId) : null;
      const numericCreatedBy = createdBy ? Number(createdBy) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const newPeople = await People.create(numericUserId, firstname, lastname, role, phone, email, numericCreatedBy, numericUpdatedBy);
      res.status(201).json(normalizePerson(newPeople));
    } catch (error) {
      console.error('Error creating people:', error);
      res.status(500).json({ message: 'Error creating people', error: error.message });
    }
  },

  async getPeopleById(req, res) {
    try {
      const { employeeId } = req.params;
      const people = await People.findById(employeeId);
      if (!people) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json(normalizePerson(people));
    } catch (error) {
      console.error('Error fetching people by ID:', error);
      res.status(500).json({ message: 'Error fetching people', error: error.message });
    }
  },

  async getAllPeople(req, res) {
  try {
    const allPeople = await People.findAll();
      const normalizedPeople = allPeople.map(person => normalizePerson(person));
      res.status(200).json(normalizedPeople);
  } catch (error) {
    console.error('Error fetching all people:', error);
    res.status(500).json({ message: 'Error fetching people!', error: error.message });
  }
  },

  async updatePeople(req, res) {
    try {
      const { employeeId } = req.params;
      const { UserId, firstname, lastname, role, phone, email, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericUserId = UserId ? Number(UserId) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const updatedPeople = await People.update(employeeId, numericUserId, firstname, lastname, role, phone, email, numericUpdatedBy);
      if (!updatedPeople) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json(normalizePerson(updatedPeople));
    } catch (error) {
      console.error('Error updating people:', error);
      res.status(500).json({ message: 'Error updating people', error: error.message });
    }
  },

  async deletePeople(req, res) {
    try {
      const { employeeId } = req.params;
      const deletedPeople = await People.delete(employeeId);
      if (!deletedPeople) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json({
        message: 'People deleted successfully',
        deletedPerson: normalizePerson(deletedPeople)
      });
    } catch (error) {
      console.error('Error deleting people:', error);
      res.status(500).json({ message: 'Error deleting people', error: error.message });
    }
  },

  // New endpoint: Get People by Role (for Quadrant relationships)
  async getPeopleByRole(req, res) {
    try {
      const { role } = req.params;
      const people = await People.findByRole(role);
      const normalizedPeople = people.map(person => normalizePerson(person));
      res.status(200).json(normalizedPeople);
    } catch (error) {
      console.error('Error fetching people by role:', error);
      res.status(500).json({ message: 'Error fetching people by role', error: error.message });
    }
  },

  // New endpoint: Get Supervisors (for Quadrant supervisorId relationships)
  async getSupervisors(req, res) {
    try {
      const supervisors = await People.findByRole('Supervisor');
      const normalizedSupervisors = supervisors.map(person => normalizePerson(person));
      res.status(200).json(normalizedSupervisors);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      res.status(500).json({ message: 'Error fetching supervisors', error: error.message });
    }
  },

  // New endpoint: Get Zone Managers (for Quadrant zoneManagerId relationships)
  async getZoneManagers(req, res) {
    try {
      const zoneManagers = await People.findByRole('Zone Manager');
      const normalizedZoneManagers = zoneManagers.map(person => normalizePerson(person));
      res.status(200).json(normalizedZoneManagers);
    } catch (error) {
      console.error('Error fetching zone managers:', error);
      res.status(500).json({ message: 'Error fetching zone managers', error: error.message });
    }
  },

  // New endpoint: Get all people with their assigned quadrants
  async getAllPeopleWithQuadrants(req, res) {
    try {
      const peopleWithQuadrants = await People.findWithQuadrants();
      const normalizedPeople = peopleWithQuadrants.map(person => normalizePersonWithQuadrants(person));
      res.status(200).json(normalizedPeople);
    } catch (error) {
      console.error('Error fetching people with quadrants:', error);
      res.status(500).json({ message: 'Error fetching people with quadrants', error: error.message });
    }
  },

  // New endpoint: Get specific person with their assigned quadrants
  async getPeopleByIdWithQuadrants(req, res) {
    try {
      const { employeeId } = req.params;
      const personWithQuadrants = await People.findByIdWithQuadrants(employeeId);
      if (!personWithQuadrants) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json(normalizePersonWithQuadrants(personWithQuadrants));
    } catch (error) {
      console.error('Error fetching person with quadrants:', error);
      res.status(500).json({ message: 'Error fetching person with quadrants', error: error.message });
    }
  },

  // New endpoint: Get people by role with their assigned quadrants
  async getPeopleByRoleWithQuadrants(req, res) {
    try {
      const { role } = req.params;
      const peopleWithQuadrants = await People.findByRoleWithQuadrants(role);
      const normalizedPeople = peopleWithQuadrants.map(person => normalizePersonWithQuadrants(person));
      res.status(200).json(normalizedPeople);
    } catch (error) {
      console.error('Error fetching people by role with quadrants:', error);
      res.status(500).json({ message: 'Error fetching people by role with quadrants', error: error.message });
    }
  },

  // New endpoint: Update quadrant assignments for a person
  async updateQuadrantAssignments(req, res) {
    try {
      const { employeeId } = req.params;
      const { quadrantAssignments, updatedBy } = req.body;
      
      if (!quadrantAssignments || !Array.isArray(quadrantAssignments)) {
        return res.status(400).json({ message: 'quadrantAssignments must be an array' });
      }

      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      const results = [];

      for (const assignment of quadrantAssignments) {
        const { quadrantId, relationship } = assignment;
        const numericQuadrantId = Number(quadrantId);
        const numericEmployeeId = Number(employeeId);

        if (!numericQuadrantId || !relationship) {
          results.push({
            quadrantId: numericQuadrantId,
            success: false,
            error: 'Missing quadrantId or relationship'
          });
          continue;
        }

        try {
          let updatedQuadrant;
          if (relationship === 'supervisor') {
            updatedQuadrant = await Quadrants.updateSupervisor(numericQuadrantId, numericEmployeeId, numericUpdatedBy);
          } else if (relationship === 'zoneManager') {
            updatedQuadrant = await Quadrants.updateZoneManager(numericQuadrantId, numericEmployeeId, numericUpdatedBy);
          } else {
            results.push({
              quadrantId: numericQuadrantId,
              success: false,
              error: 'Invalid relationship. Must be "supervisor" or "zoneManager"'
            });
            continue;
          }

          if (updatedQuadrant) {
            results.push({
              quadrantId: numericQuadrantId,
              relationship,
              success: true,
              updatedQuadrant: {
                quadrantId: updatedQuadrant.quadrantid,
                name: updatedQuadrant.name,
                supervisorId: updatedQuadrant.supervisorid ? Number(updatedQuadrant.supervisorid) : null,
                zoneManagerId: updatedQuadrant.zonemanagerid ? Number(updatedQuadrant.zonemanagerid) : null
              }
            });
          } else {
            results.push({
              quadrantId: numericQuadrantId,
              success: false,
              error: 'Quadrant not found'
            });
          }
        } catch (error) {
          results.push({
            quadrantId: numericQuadrantId,
            success: false,
            error: error.message
          });
        }
      }

      res.status(200).json({
        message: 'Quadrant assignments updated',
        employeeId: Number(employeeId),
        results
      });
    } catch (error) {
      console.error('Error updating quadrant assignments:', error);
      res.status(500).json({ message: 'Error updating quadrant assignments', error: error.message });
    }
  },
};

module.exports = PeopleController; 