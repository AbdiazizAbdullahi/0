const { v4: uuidv4 } = require('uuid');

// Create a new staff member record in the database
async function createStaff(db, staffData) {
  try {
    const staff = {
      _id: uuidv4(),
      type: 'staff',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...staffData,
    };

    const response = await db.put(staff);
    return {
      success: true,
      staff: { _id: response.id, ...staff }
    };
  } catch (error) {
    console.error('Staff creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active staff members from the database
async function getAllStaff(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'staff',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      staff: result.docs 
    };
  } catch (error) {
    console.error('Fetching staff failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing staff member's information
async function updateStaff(db, staffData) {
  try {
    const existingStaff = await db.get(staffData._id);
    
    const staff = {
      _id: staffData._id,
      _rev: existingStaff._rev,
      type: 'staff',
      state: existingStaff.state || 'Active',
      ...staffData
    };

    const response = await db.put(staff);
    return {
      success: true,
      staff: { _id: response.id, ...staff }
    };
  } catch (error) {
    console.error('Staff update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a staff member as inactive (soft delete)
async function archiveStaff(db, staffId) {
  try {
    const staff = await db.get(staffId);
    staff.state = 'Inactive';
    
    const response = await db.put(staff);
    return { 
      success: true, 
      staff: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Staff archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search staff using flexible matching criteria
async function searchStaff(db, searchTerm, projectId, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } },
          { department: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'staff',
        projectId: projectId
      }
    });

    return {
      success: true,
      staff: result.docs
    };
  } catch (error) {
    console.error('Staff search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve a specific staff member by their ID
async function getStaffById(db, staffId) {
  try {
    const staff = await db.get(staffId);
    
    if (staff.type !== 'staff' || staff.state === 'Inactive') {
      return {
        success: false,
        error: 'Staff member not found or is inactive'
      };
    }

    return {
      success: true,
      staff: staff
    };
  } catch (error) {
    console.error('Fetching staff by ID failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  archiveStaff,
  searchStaff,
  getStaffById
};
