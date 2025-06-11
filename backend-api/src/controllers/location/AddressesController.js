const Addresses = require('../../models/location/Addresses');

const AddressesController = {
  async createAddress(req, res) {
    try {
      const { addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy } = req.body;
      const newAddress = await Addresses.create(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy);
      res.status(201).json(newAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ message: 'Error creating address', error: error.message });
    }
  },

  async getAddressById(req, res) {
    try {
      const { addressId } = req.params;
      const address = await Addresses.findById(addressId);
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }
      res.status(200).json(address);
    } catch (error) {
      console.error('Error fetching address by ID:', error);
      res.status(500).json({ message: 'Error fetching address', error: error.message });
    }
  },

  async getAllAddresses(req, res) {
    try {
      const allAddresses = await Addresses.findAll();
      res.status(200).json(allAddresses);
    } catch (error) {
      console.error('Error fetching all addresses:', error);
      res.status(500).json({ message: 'Error fetching addresses', error: error.message });
    }
  },

  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const { addressNumber, addressCardinal, addressStreet, addressSuffix, updatedBy } = req.body;
      const updatedAddress = await Addresses.update(addressId, addressNumber, addressCardinal, addressStreet, addressSuffix, updatedBy);
      if (!updatedAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }
      res.status(200).json(updatedAddress);
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ message: 'Error updating address', error: error.message });
    }
  },

  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      const deletedAddress = await Addresses.delete(addressId);
      if (!deletedAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }
      res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ message: 'Error deleting address', error: error.message });
    }
  },
};

module.exports = AddressesController; 