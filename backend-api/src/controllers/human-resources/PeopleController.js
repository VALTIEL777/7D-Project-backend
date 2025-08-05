const People = require('../../models/human-resources/People');
const Quadrants = require('../../models/location/Quadrants');
const User = require('../../models/human-resources/User');
const db = require('../../config/db');

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

// Helper function to normalize person with user information
const normalizePersonWithUser = (dbRecord) => {
  if (!dbRecord) return null;
  
  const normalizedPerson = normalizePerson(dbRecord);
  
  // Add user information if available
  let user = null;
  if (dbRecord.userid) {
    user = {
      userId: Number(dbRecord.userid),
      username: dbRecord.username,
      createdAt: dbRecord.user_createdat,
      updatedAt: dbRecord.user_updatedat,
      deletedAt: dbRecord.user_deletedat
    };
  }
  
  return {
    ...normalizedPerson,
    user
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

  // New endpoint: Create person with user simultaneously
  async createPersonWithUser(req, res) {
    try {
      const { 
        username, 
        password, 
        firstname, 
        lastname, 
        role, 
        phone, 
        email, 
        createdBy, 
        updatedBy 
      } = req.body;
      
      // Validate required fields
      if (!username || !password || !firstname || !lastname || !role) {
        return res.status(400).json({ 
          message: 'Missing required fields: username, password, firstname, lastname, role are required' 
        });
      }

      // Convert numeric values
      const numericCreatedBy = createdBy ? Number(createdBy) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;

      // Check if username already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Username already exists',
          error: 'USERNAME_EXISTS'
        });
      }

      // Start database transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // 1. Create the user first
        const newUser = await client.query(
          'INSERT INTO Users(username, password) VALUES($1, $2) RETURNING *;',
          [username, password]
        );

        // 2. Create the person with the new user's ID
        const newPerson = await client.query(
          'INSERT INTO People(userid, firstname, lastname, role, phone, email, createdby, updatedby) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
          [newUser.rows[0].userid, firstname, lastname, role, phone, email, numericCreatedBy, numericUpdatedBy]
        );

        await client.query('COMMIT');

        // Return combined response
        res.status(201).json({
          message: 'Person and user created successfully',
          user: {
            userId: newUser.rows[0].userid,
            username: newUser.rows[0].username,
            createdAt: newUser.rows[0].createdat
          },
          person: normalizePerson(newPerson.rows[0])
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error creating person with user:', error);
      res.status(500).json({ 
        message: 'Error creating person with user', 
        error: error.message 
      });
    }
  },

  // New endpoint: Update both user and person simultaneously
  async updatePersonWithUser(req, res) {
    try {
      const { employeeId } = req.params;
      const { 
        username, 
        password, 
        firstname, 
        lastname, 
        role, 
        phone, 
        email, 
        updatedBy 
      } = req.body;
      
      // Validate required fields
      if (!firstname || !lastname || !role) {
        return res.status(400).json({ 
          message: 'Missing required fields: firstname, lastname, role are required' 
        });
      }

      // Convert numeric values
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;

      // Get the current person to find the associated user
      const currentPerson = await People.findById(employeeId);
      if (!currentPerson) {
        return res.status(404).json({ 
          message: 'Person not found' 
        });
      }

      // Check if username is being changed and if it already exists
      if (username) {
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.userid !== currentPerson.userid) {
          return res.status(409).json({ 
            message: 'Username already exists',
            error: 'USERNAME_EXISTS'
          });
        }
      }

      // Start database transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // 1. Update the user if username or password provided
        if (username || password) {
          const updateFields = [];
          const updateValues = [];
          let paramCount = 1;

          if (username) {
            updateFields.push(`username = $${paramCount}`);
            updateValues.push(username);
            paramCount++;
          }
          if (password) {
            updateFields.push(`password = $${paramCount}`);
            updateValues.push(password);
            paramCount++;
          }

          updateValues.push(currentPerson.userid);
          await client.query(
            `UPDATE Users SET ${updateFields.join(', ')}, updatedat = CURRENT_TIMESTAMP WHERE userid = $${paramCount} RETURNING *;`,
            updateValues
          );
        }

        // 2. Update the person
        const updatedPerson = await client.query(
          'UPDATE People SET firstname = $1, lastname = $2, role = $3, phone = $4, email = $5, updatedat = CURRENT_TIMESTAMP, updatedby = $6 WHERE employeeid = $7 RETURNING *;',
          [firstname, lastname, role, phone, email, numericUpdatedBy, employeeId]
        );

        await client.query('COMMIT');

        // Get the updated user data
        const updatedUser = await User.findById(currentPerson.userid);

        // Return combined response
        res.status(200).json({
          message: 'Person and user updated successfully',
          user: updatedUser ? {
            userId: updatedUser.userid,
            username: updatedUser.username,
            updatedAt: updatedUser.updatedat
          } : null,
          person: normalizePerson(updatedPerson.rows[0])
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error updating person with user:', error);
      res.status(500).json({ 
        message: 'Error updating person with user', 
        error: error.message 
      });
    }
  },

  // New endpoint: Soft delete person and optionally user
  async softDeletePersonWithUser(req, res) {
    try {
      const { employeeId } = req.params;
      const { deleteUser = false, updatedBy } = req.body;

      // Convert numeric values
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;

      // Get the current person to find the associated user
      const currentPerson = await People.findById(employeeId);
      if (!currentPerson) {
        return res.status(404).json({ 
          message: 'Person not found' 
        });
      }

      // Start database transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // 1. Soft delete the person
        const deletedPerson = await client.query(
          'UPDATE People SET deletedat = CURRENT_TIMESTAMP, updatedby = $1 WHERE employeeid = $2 RETURNING *;',
          [numericUpdatedBy, employeeId]
        );

        // 2. Optionally soft delete the user
        let deletedUser = null;
        if (deleteUser && currentPerson.userid) {
          deletedUser = await client.query(
            'UPDATE Users SET deletedat = CURRENT_TIMESTAMP WHERE userid = $1 RETURNING *;',
            [currentPerson.userid]
          );
        }

        await client.query('COMMIT');

        // Return combined response
        res.status(200).json({
          message: 'Person and user soft deleted successfully',
          person: normalizePerson(deletedPerson.rows[0]),
          user: deletedUser ? {
            userId: deletedUser.rows[0].userid,
            username: deletedUser.rows[0].username,
            deletedAt: deletedUser.rows[0].deletedat
          } : null,
          deleteUser: deleteUser
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error soft deleting person with user:', error);
      res.status(500).json({ 
        message: 'Error soft deleting person with user', 
        error: error.message 
      });
    }
  },

  // New endpoint: Get all people with their associated user information
  async getAllPeopleWithUsers(req, res) {
    try {
      const peopleWithUsers = await People.findWithUsers();
      const normalizedPeople = peopleWithUsers.map(person => normalizePersonWithUser(person));
      res.status(200).json(normalizedPeople);
    } catch (error) {
      console.error('Error fetching people with users:', error);
      res.status(500).json({ message: 'Error fetching people with users', error: error.message });
    }
  },

  // New endpoint: Get specific person with their associated user information
  async getPeopleByIdWithUser(req, res) {
    try {
      const { employeeId } = req.params;
      const personWithUser = await People.findByIdWithUser(employeeId);
      if (!personWithUser) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json(normalizePersonWithUser(personWithUser));
    } catch (error) {
      console.error('Error fetching person with user:', error);
      res.status(500).json({ message: 'Error fetching person with user', error: error.message });
    }
  },
};

module.exports = PeopleController; 