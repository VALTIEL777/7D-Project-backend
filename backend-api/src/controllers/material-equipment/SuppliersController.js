const Suppliers = require('../../models/material-equipment/Suppliers');

const SuppliersController = {
  async createSupplier(req, res) {
    try {
      const { name, phone, email, address, createdBy, updatedBy } = req.body;
      const newSupplier = await Suppliers.create(name, phone, email, address, createdBy, updatedBy);
      res.status(201).json(newSupplier);
    } catch (error) {
      console.error('Error creating Supplier:', error);
      res.status(500).json({ message: 'Error creating Supplier', error: error.message });
    }
  },

  async getSupplierById(req, res) {
    try {
      const { supplierId } = req.params;
      const supplier = await Suppliers.findById(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json(supplier);
    } catch (error) {
      console.error('Error fetching Supplier by ID:', error);
      res.status(500).json({ message: 'Error fetching Supplier', error: error.message });
    }
  },

  async getAllSuppliers(req, res) {
    try {
      const allSuppliers = await Suppliers.findAll();
      res.status(200).json(allSuppliers);
    } catch (error) {
      console.error('Error fetching all Suppliers:', error);
      res.status(500).json({ message: 'Error fetching Suppliers', error: error.message });
    }
  },

  async updateSupplier(req, res) {
    try {
      const { supplierId } = req.params;
      const { name, phone, email, address, updatedBy } = req.body;
      const updatedSupplier = await Suppliers.update(supplierId, name, phone, email, address, updatedBy);
      if (!updatedSupplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json(updatedSupplier);
    } catch (error) {
      console.error('Error updating Supplier:', error);
      res.status(500).json({ message: 'Error updating Supplier', error: error.message });
    }
  },

  async deleteSupplier(req, res) {
    try {
      const { supplierId } = req.params;
      const deletedSupplier = await Suppliers.delete(supplierId);
      if (!deletedSupplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting Supplier:', error);
      res.status(500).json({ message: 'Error deleting Supplier', error: error.message });
    }
  },
};

module.exports = SuppliersController; 