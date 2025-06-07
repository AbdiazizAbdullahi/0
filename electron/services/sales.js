const { v4: uuidv4 } = require('uuid');

// Create a new sale record in the database
async function createSale(db, saleData) {
  try {
    // Fetch the client first
    const client = await db.get(saleData.clientId);

    // Convert price to client's currency if they differ
    let convertedPrice = saleData.price;
    if (saleData.currency !== client.currency) {
      if (saleData.currency === 'USD' && client.currency === 'KES') {
        convertedPrice *= saleData.rate; // USD to KES using provided rate
      } else if (saleData.currency === 'KES' && client.currency === 'USD') {
        convertedPrice /= saleData.rate; // KES to USD using provided rate
      }
    }

    // Subtract the converted price from the client's balance
    client.balance -= Math.floor(convertedPrice);

    // Update the client's balance
    await db.put(client);

    const sale = {
      _id: uuidv4(),
      type: 'sale',
      state: 'Active',
      createdAt: new Date().toISOString(),
      projectId: saleData.projectId,
      clientId: saleData.clientId,
      clientName: client.name,
      currency: client.currency,
      rate: client.rate,
      convertedPrice,
      originalPrice: saleData.price,
      originalCurrency: saleData.currency,
      conversionRate: saleData.rate,
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

    // Sort sales from latest to oldest based on createdAt timestamp
    const sortedSales = result.docs.sort((a, b) => {
      // Use createdAt as primary sort field, fall back to date if createdAt isn't available
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      return dateB - dateA; // Descending order (latest first)
    });

    return { 
      success: true, 
      sales: sortedSales 
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
    // Get the sale and client
    const sale = await db.get(saleId);
    const client = await db.get(sale.clientId);

    // Add back the converted price to client's balance
    client.balance += Math.floor(sale.convertedPrice);

    // Update the client's balance
    await db.put(client);

    // Archive the sale
    sale.state = 'Inactive';
    sale.updatedAt = new Date().toISOString();
    await db.put(sale);
    
    return { success: true };
  } catch (error) {
    console.error('Sale archival failed:', error);
    return { success: false, error: error.message };
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
