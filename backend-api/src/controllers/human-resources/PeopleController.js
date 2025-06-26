const People = require('../../models/human-resources/People');

const PeopleController = {
  async createPeople(req, res) {
    try {
      const { UserId, firstname, lastname, role, phone, email, createdBy, updatedBy } = req.body;
      const newPeople = await People.create(UserId, firstname, lastname, role, phone, email, createdBy, updatedBy);
      res.status(201).json(newPeople);
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
      res.status(200).json(people);
    } catch (error) {
      console.error('Error fetching people by ID:', error);
      res.status(500).json({ message: 'Error fetching people', error: error.message });
    }
  },

  async getAllPeople(req, res) {
  try {
    const allPeople = await People.findAll();
    res.status(200).json(allPeople);
  } catch (error) {
    console.error('Error fetching all people:', error);
    res.status(500).json({ message: 'Error fetching people!', error: error.message });
  }
}
,

  async updatePeople(req, res) {
    try {
      const { employeeId } = req.params;
      const { UserId, firstname, lastname, role, phone, email, updatedBy } = req.body;
      const updatedPeople = await People.update(employeeId, UserId, firstname, lastname, role, phone, email, updatedBy);
      if (!updatedPeople) {
        return res.status(404).json({ message: 'People not found' });
      }
      res.status(200).json(updatedPeople);
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
      res.status(200).json({ message: 'People deleted successfully' });
    } catch (error) {
      console.error('Error deleting people:', error);
      res.status(500).json({ message: 'Error deleting people', error: error.message });
    }
  },
};

module.exports = PeopleController; 