const { v4: uuidv4 } = require('uuid');

// Create a new agent record in the database
async function createAgent(db, agentData) {
  try {
    const agent = {
      _id: agentData._id || uuidv4(),
      type: 'agent',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...agentData,
    };

    const response = await db.put(agent);
    return {
      success: true,
      agent: { _id: response.id, ...agent }
    };
  } catch (error) {
    console.error('Agent creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active agents from the database
async function getAllAgents(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'agent',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      agents: result.docs 
    };
  } catch (error) {
    console.error('Fetching agents failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing agent's information
async function updateAgent(db, agentData) {
  try {
    const existingAgent = await db.get(agentData._id);
    
    const agent = {
      _id: agentData._id,
      _rev: existingAgent._rev,
      type: 'agent',
      state: existingAgent.state || 'Active',
      ...agentData
    };

    const response = await db.put(agent);
    return {
      success: true,
      agent: { _id: response.id, ...agent }
    };
  } catch (error) {
    console.error('Agent update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark an agent as inactive (soft delete)
async function archiveAgent(db, agentId) {
  try {
    const agent = await db.get(agentId);
    agent.state = 'Inactive';
    
    const response = await db.put(agent);
    return { 
      success: true, 
      agent: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Agent archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search agents using flexible matching criteria
async function searchAgents(db, searchTerm, projectId, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'agent',
        projectId: projectId
      }
    });

    return {
      success: true,
      agents: result.docs
    };
  } catch (error) {
    console.error('Agent search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  createAgent,
  getAllAgents,
  updateAgent,
  archiveAgent,
  searchAgents
};
