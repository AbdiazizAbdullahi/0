const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seedAdminIfNeeded(db) {
  try {
    const result = await db.find({
      selector: { type: 'staff', state: 'Active', role: 'admin' }
    });

    if (result.docs.length === 0) {
      const adminPasscode = await bcrypt.hash('admin2025', 10);
      const admin = {
        _id: uuidv4(),
        type: 'staff',
        role: 'admin',
        name: 'Admin',
        phoneNumber: '1234567890',
        passcode: adminPasscode,
        state: 'Active',
        createdAt: new Date().toISOString()
      };
      await db.put(admin);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginStaff(db, phoneNumber, passcode) {
  try {
    const result = await db.find({
      selector: {
        type: 'staff',
        phoneNumber: phoneNumber,
        state: 'Active'
      }
    });

    if (result.docs.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const staff = result.docs[0];
    const isValid = await bcrypt.compare(passcode, staff.passcode);

    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    const { passcode: _, ...staffData } = staff;
    return { success: true, staff: staffData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  seedAdminIfNeeded,
  loginStaff
};
