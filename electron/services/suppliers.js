const { v4: uuidv4 } = require('uuid');

// Create a new supplier record in the database
async function createSupplier(db, supplierData) {
  try {
    const supplier = {
      _id: supplierData._id || uuidv4(),
      type: 'supplier',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...supplierData,
    };

    const response = await db.put(supplier);
    return {
      success: true,
      supplier: { _id: response.id, ...supplier }
    };
  } catch (error) {
    console.error('Supplier creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active suppliers from the database
async function getAllSuppliers(db) {
  try {
    const result = await db.find({
      selector: { 
        type: 'supplier',
        state: 'Active' 
      },
      limit: 100000
    });

    return { 
      success: true, 
      suppliers: result.docs 
    };
  } catch (error) {
    console.error('Fetching suppliers failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing supplier's information
async function updateSupplier(db, supplierData) {
  try {
    const existingSupplier = await db.get(supplierData._id);
    
    const supplier = {
      _id: supplierData._id,
      _rev: existingSupplier._rev,
      type: 'supplier',
      state: existingSupplier.state || 'Active',
      ...supplierData
    };

    const response = await db.put(supplier);
    return {
      success: true,
      supplier: { _id: response.id, ...supplier }
    };
  } catch (error) {
    console.error('Supplier update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a supplier as inactive (soft delete)
async function archiveSupplier(db, supplierId) {
  try {
    const supplier = await db.get(supplierId);
    supplier.state = 'Inactive';
    
    const response = await db.put(supplier);
    return { 
      success: true, 
      supplier: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Supplier archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search suppliers using flexible matching criteria
async function searchSuppliers(db, searchTerm, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'supplier'
      },
      limit: 100000
    });

    return {
      success: true,
      suppliers: result.docs
    };
  } catch (error) {
    console.error('Supplier search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve a specific supplier by their ID
async function getSupplierById(db, supplierId) {
  try {
    const supplier = await db.get(supplierId);
    
    // Only return active suppliers or provide a way to override
    if (supplier.type !== 'supplier' || supplier.state === 'Inactive') {
      return {
        success: false,
        error: 'Supplier not found or is inactive'
      };
    }

    return {
      success: true,
      supplier: supplier
    };
  } catch (error) {
    console.error('Fetching supplier by ID failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  archiveSupplier,
  searchSuppliers,
  getSupplierById
};
