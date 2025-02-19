const { v4: uuidv4 } = require('uuid');

// Create a new supplier record in the database
async function createSupplier(db, supplierData) {
  try {
    const supplier = {
      _id: uuidv4(),
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
async function getAllSuppliers(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'supplier',
        state: 'Active',
        projectId: projectId
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

async function getSupplierDetails(db, supplierId) {
  try {
    // Fetch supplier info
    const supplier = await db.get(supplierId);
    if (supplier.type !== 'supplier' || supplier.state === 'Inactive') {
      throw new Error('Supplier not found or is inactive');
    }

    // Fetch invoices
    const invoicesResult = await db.find({
      selector: {
        type: 'invoice',
        state: 'Active',
        supplierId: supplierId
      }
    });

    // Fetch transactions
    const transactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        $or: [
          { from: supplierId },
          { to: supplierId }
        ]
      }
    });

    // Prepare ledger entries
    let ledgerEntries = [
      // Convert invoices to ledger entries
      ...invoicesResult.docs.map(invoice => ({
        date: invoice.date,
        description: `Invoice: ${invoice.description}`,
        debit: invoice.amount,
        credit: 0,
        type: 'invoice',
        id: invoice._id
      })),
      // Convert transactions to ledger entries
      ...transactionsResult.docs.map(trans => ({
        date: trans.date,
        description: trans.description,
        debit: trans.from === supplierId ? trans.amount : 0,
        credit: trans.to === supplierId ? trans.amount : 0,
        type: 'transaction',
        id: trans._id
      }))
    ];

    // Sort by date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance and metrics
    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledgerWithBalance = ledgerEntries.map(entry => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
      balance = balance + entry.debit - entry.credit;
      return {
        ...entry,
        balance
      };
    });

    return {
      success: true,
      data: {
        info: supplier,
        metrics: {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit
        },
        ledger: ledgerWithBalance
      }
    };
  } catch (error) {
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
  getSupplierById,
  getSupplierDetails
};
