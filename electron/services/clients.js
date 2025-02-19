const { v4: uuidv4 } = require('uuid');

// Create a new client record in the database
async function createClient(db, clientData) {
  try {
    const client = {
      _id: uuidv4(),
      type: 'client',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...clientData,
    };

    const response = await db.put(client);
    return {
      success: true,
      client: { _id: response.id, ...client }
    };
  } catch (error) {
    console.error('Client creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active clients from the database
async function getAllClients(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'client',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      clients: result.docs 
    };
  } catch (error) {
    console.error('Fetching clients failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing client's information
async function updateClient(db, clientData) {
  try {
    const existingClient = await db.get(clientData._id);
    
    const client = {
      _id: clientData._id,
      _rev: existingClient._rev,
      type: 'client',
      state: existingClient.state || 'Active',
      ...clientData
    };

    const response = await db.put(client);
    return {
      success: true,
      client: { _id: response.id, ...client }
    };
  } catch (error) {
    console.error('Client update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a client as inactive (soft delete)
async function archiveClient(db, clientId) {
  try {
    const client = await db.get(clientId);
    client.state = 'Inactive';
    
    const response = await db.put(client);
    return { 
      success: true, 
      client: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Client archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search clients using flexible matching criteria
async function searchClients(db, searchTerm, projectId, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'client',
        projectId: projectId
      }
    });

    return {
      success: true,
      clients: result.docs
    };
  } catch (error) {
    console.error('Client search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  createClient,
  getAllClients,
  updateClient,
  archiveClient,
  searchClients
};
