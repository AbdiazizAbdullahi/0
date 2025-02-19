const { v4: uuidv4 } = require('uuid');

// Create a new sale record in the database
async function createSale(db, saleData) {
  try {
    // Fetch the client first
    const client = await db.get(saleData.clientId);

    // Subtract the sale price from the client's balance
    client.balance -= saleData.price;

    // Update the client's balance
    await db.put(client);

    const sale = {
      _id: uuidv4(),
      type: 'sale',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...saleData,
    };

    const response = await db.put(sale);
    return {
      success: true,
      sale: { _id: response.id, ...sale }
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active sales from the database
async function getAllSales(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'sale',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      sales: result.docs 
    };
  } catch (error) {
    console.error('Fetching sales failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing sale's information
async function updateSale(db, saleData) {
  try {
    const existingSale = await db.get(saleData._id);
    
    const sale = {
      _id: saleData._id,
      _rev: existingSale._rev,
      type: 'sale',
      state: existingSale.state || 'Active',
      ...saleData
    };

    const response = await db.put(sale);
    return {
      success: true,
      sale: { _id: response.id, ...sale }
    };
  } catch (error) {
    console.error('Sale update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a sale as inactive (soft delete)
async function archiveSale(db, saleId) {
  try {
    const sale = await db.get(saleId);
    sale.state = 'Inactive';
    
    const response = await db.put(sale);
    return { 
      success: true, 
      sale: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Sale archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function salesSearch(db, searchTerm, projectId) {
  try {
    const searchResult = await db.find({
      selector: {
        $or: [
          { clientName: { $regex: new RegExp(searchTerm, 'i') } },
          { agentName: { $regex: new RegExp(searchTerm, 'i') } },
          { houseNo: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: "Active",
        type: "sale",
        projectId: projectId
      }
    });
    return { success: true, sales: searchResult.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createSale,
  getAllSales,
  updateSale,
  archiveSale,
  salesSearch
};
