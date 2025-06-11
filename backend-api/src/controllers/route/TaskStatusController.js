const TaskStatus = require('../../models/route/TaskStatus');

const TaskStatusController = {
  async createTaskStatus(req, res) {
    try {
      const { name, description, createdBy, updatedBy } = req.body;
      const newTaskStatus = await TaskStatus.create(name, description, createdBy, updatedBy);
      res.status(201).json(newTaskStatus);
    } catch (error) {
      console.error('Error creating TaskStatus:', error);
      res.status(500).json({ message: 'Error creating TaskStatus', error: error.message });
    }
  },

  async getTaskStatusById(req, res) {
    try {
      const { taskStatusId } = req.params;
      const taskStatus = await TaskStatus.findById(taskStatusId);
      if (!taskStatus) {
        return res.status(404).json({ message: 'TaskStatus not found' });
      }
      res.status(200).json(taskStatus);
    } catch (error) {
      console.error('Error fetching TaskStatus by ID:', error);
      res.status(500).json({ message: 'Error fetching TaskStatus', error: error.message });
    }
  },

  async getAllTaskStatuses(req, res) {
    try {
      const allTaskStatuses = await TaskStatus.findAll();
      res.status(200).json(allTaskStatuses);
    } catch (error) {
      console.error('Error fetching all TaskStatuses:', error);
      res.status(500).json({ message: 'Error fetching TaskStatuses', error: error.message });
    }
  },

  async updateTaskStatus(req, res) {
    try {
      const { taskStatusId } = req.params;
      const { name, description, updatedBy } = req.body;
      const updatedTaskStatus = await TaskStatus.update(taskStatusId, name, description, updatedBy);
      if (!updatedTaskStatus) {
        return res.status(404).json({ message: 'TaskStatus not found' });
      }
      res.status(200).json(updatedTaskStatus);
    } catch (error) {
      console.error('Error updating TaskStatus:', error);
      res.status(500).json({ message: 'Error updating TaskStatus', error: error.message });
    }
  },

  async deleteTaskStatus(req, res) {
    try {
      const { taskStatusId } = req.params;
      const deletedTaskStatus = await TaskStatus.delete(taskStatusId);
      if (!deletedTaskStatus) {
        return res.status(404).json({ message: 'TaskStatus not found' });
      }
      res.status(200).json({ message: 'TaskStatus deleted successfully' });
    } catch (error) {
      console.error('Error deleting TaskStatus:', error);
      res.status(500).json({ message: 'Error deleting TaskStatus', error: error.message });
    }
  },
};

module.exports = TaskStatusController; 