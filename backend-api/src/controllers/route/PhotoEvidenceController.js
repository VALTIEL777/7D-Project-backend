const PhotoEvidence = require('../../models/route/PhotoEvidence');

const PhotoEvidenceController = {
  async createPhotoEvidence(req, res) {
    try {
      const { ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy } = req.body;
      const newPhotoEvidence = await PhotoEvidence.create(ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy);
      res.status(201).json(newPhotoEvidence);
    } catch (error) {
      console.error('Error creating PhotoEvidence:', error);
      res.status(500).json({ message: 'Error creating PhotoEvidence', error: error.message });
    }
  },

  async getPhotoEvidenceById(req, res) {
    try {
      const { photoId } = req.params;
      const photoEvidence = await PhotoEvidence.findById(photoId);
      if (!photoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      res.status(200).json(photoEvidence);
    } catch (error) {
      console.error('Error fetching PhotoEvidence by ID:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence', error: error.message });
    }
  },

  async getAllPhotoEvidence(req, res) {
    try {
      const allPhotoEvidence = await PhotoEvidence.findAll();
      res.status(200).json(allPhotoEvidence);
    } catch (error) {
      console.error('Error fetching all PhotoEvidence:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence', error: error.message });
    }
  },

  async updatePhotoEvidence(req, res) {
    try {
      const { photoId } = req.params;
      const { ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, updatedBy } = req.body;
      const updatedPhotoEvidence = await PhotoEvidence.update(photoId, ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, updatedBy);
      if (!updatedPhotoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      res.status(200).json(updatedPhotoEvidence);
    } catch (error) {
      console.error('Error updating PhotoEvidence:', error);
      res.status(500).json({ message: 'Error updating PhotoEvidence', error: error.message });
    }
  },

  async deletePhotoEvidence(req, res) {
    try {
      const { photoId } = req.params;
      const deletedPhotoEvidence = await PhotoEvidence.delete(photoId);
      if (!deletedPhotoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      res.status(200).json({ message: 'PhotoEvidence deleted successfully' });
    } catch (error) {
      console.error('Error deleting PhotoEvidence:', error);
      res.status(500).json({ message: 'Error deleting PhotoEvidence', error: error.message });
    }
  },
};

module.exports = PhotoEvidenceController; 