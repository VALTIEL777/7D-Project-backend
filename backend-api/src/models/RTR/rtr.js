// Placeholder model for Excel data
// Replace this with Mongoose/Sequelize schema if needed

class ExcelItem {
  constructor(data) {
    this.data = data;
    // Optional: validation logic here
  }

  // Example save method
  save() {
    console.log("Saving item:", this.data);
  }
}

module.exports = ExcelItem;
